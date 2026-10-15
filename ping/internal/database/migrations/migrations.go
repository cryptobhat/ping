// Package migrations handles database schema migrations
// This ensures the database schema is up-to-date with the application
package migrations

import (
	"context"
	"embed"
	"fmt"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/sirupsen/logrus"

	"github.com/yourusername/ping/internal/database"
)

//go:embed *.sql
var migrationsFS embed.FS

// Migration represents a single database migration
type Migration struct {
	// Name is the identifier for the migration (e.g., "001_create_users_table")
	Name string
	
	// SQL is the SQL to execute for this migration
	SQL string
}

// GetMigrations returns all migrations in order
// Migrations are sorted by name to ensure they run in the correct order
func GetMigrations() []Migration {
	// List all SQL files in the migrations directory
	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		logrus.Error("Failed to read migrations directory: ", err)
		return nil
	}

	var migrations []Migration
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			// Read the SQL file
			content, err := migrationsFS.ReadFile("migrations/" + entry.Name())
			if err != nil {
				logrus.Error("Failed to read migration file: ", err)
				continue
			}

			// Remove .sql extension for the migration name
			name := strings.TrimSuffix(entry.Name(), ".sql")
			migrations = append(migrations, Migration{
				Name: name,
				SQL:  string(content),
			})
		}
	}

	// Sort migrations by name to ensure correct order
	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Name < migrations[j].Name
	})

	return migrations
}

// RunMigrations runs all pending migrations
// It tracks which migrations have been run in the database
func RunMigrations(ctx context.Context) error {
	// Create migrations table if it doesn't exist
	err := createMigrationsTable(ctx)
	if err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get all migrations
	migrations := GetMigrations()
	if len(migrations) == 0 {
		logrus.Info("No migrations to run")
		return nil
	}

	// Get already run migrations from the database
	runMigrations, err := getRunMigrations(ctx)
	if err != nil {
		return fmt.Errorf("failed to get run migrations: %w", err)
	}

	// Create a map of run migration names for quick lookup
	runMigrationMap := make(map[string]bool)
	for _, name := range runMigrations {
		runMigrationMap[name] = true
	}

	// Run each migration that hasn't been run yet
	for _, migration := range migrations {
		if !runMigrationMap[migration.Name] {
			logrus.Infof("Running migration: %s", migration.Name)
			
			// Run the migration in a transaction
			tx, err := database.DB.BeginTx(ctx, nil)
			if err != nil {
				return fmt.Errorf("failed to begin transaction for migration %s: %w", migration.Name, err)
			}

			// Execute the migration SQL
			_, err = tx.Exec(ctx, migration.SQL)
			if err != nil {
				tx.Rollback(ctx)
				return fmt.Errorf("failed to execute migration %s: %w", migration.Name, err)
			}

			// Record that this migration has been run
			_, err = tx.Exec(ctx, 
				"INSERT INTO schema_migrations (name, executed_at) VALUES ($1, NOW())",
				migration.Name)
			if err != nil {
				tx.Rollback(ctx)
				return fmt.Errorf("failed to record migration %s: %w", migration.Name, err)
			}

			// Commit the transaction
			err = tx.Commit(ctx)
			if err != nil {
				return fmt.Errorf("failed to commit migration %s: %w", migration.Name, err)
			}

			logrus.Infof("Migration %s completed successfully", migration.Name)
		}
	}

	logrus.Info("All migrations completed")
	return nil
}

// createMigrationsTable creates the schema_migrations table if it doesn't exist
func createMigrationsTable(ctx context.Context) error {
	const sql = `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL UNIQUE,
			executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)
	`
	_, err := database.DB.Exec(ctx, sql)
	return err
}

// getRunMigrations returns a list of all migration names that have been run
func getRunMigrations(ctx context.Context) ([]string, error) {
	rows, err := database.DB.Query(ctx, "SELECT name FROM schema_migrations ORDER BY executed_at")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var names []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		names = append(names, name)
	}

	return names, nil
}

// RollbackLastMigration rolls back the most recent migration
// This is useful for development and testing
func RollbackLastMigration(ctx context.Context) error {
	// Get the most recent migration
	var name string
	err := database.DB.QueryRow(ctx, 
		"SELECT name FROM schema_migrations ORDER BY executed_at DESC LIMIT 1").Scan(&name)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("no migrations to rollback")
		}
		return fmt.Errorf("failed to get most recent migration: %w", err)
	}

	// Get the migration SQL
	migrations := GetMigrations()
	var migrationSQL string
	for _, m := range migrations {
		if m.Name == name {
			migrationSQL = m.SQL
			break
		}
	}

	if migrationSQL == "" {
		return fmt.Errorf("migration %s not found", name)
	}

	// For now, we don't support automatic rollback
	// In production, you should write down migrations that can be rolled back
	logrus.Warnf("Rollback for migration %s is not implemented. You need to manually revert the changes.", name)
	
	// Remove the migration from the tracking table
	_, err = database.DB.Exec(ctx, "DELETE FROM schema_migrations WHERE name = $1", name)
	if err != nil {
		return fmt.Errorf("failed to remove migration from tracking table: %w", err)
	}

	logrus.Infof("Migration %s marked as rolled back. Manual database changes may be required.", name)
	return nil
}

// MigrationInfo contains information about a migration
type MigrationInfo struct {
	Name      string    `json:"name"`
	ExecutedAt time.Time `json:"executed_at"`
}

// GetMigrationInfo returns information about all migrations
func GetMigrationInfo(ctx context.Context) ([]MigrationInfo, error) {
	rows, err := database.DB.Query(ctx, 
		"SELECT name, executed_at FROM schema_migrations ORDER BY executed_at")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var infos []MigrationInfo
	for rows.Next() {
		var info MigrationInfo
		if err := rows.Scan(&info.Name, &info.ExecutedAt); err != nil {
			return nil, err
		}
		infos = append(infos, info)
	}

	return infos, nil
}
