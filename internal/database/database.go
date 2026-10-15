// Package database handles the PostgreSQL database connection and migrations
// This is the central place for all database operations
package database

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sirupsen/logrus"

	"github.com/yourusername/ping/internal/config"
)

// DB is the main database connection pool
// This is exported so it can be used by repositories
var DB *pgxpool.Pool

// Connect establishes a connection pool to PostgreSQL
// This should be called once at application startup
func Connect(cfg *config.Config) error {
	// Configure the connection pool
	poolConfig, err := pgxpool.ParseConfig(cfg.GetDatabaseDSN())
	if err != nil {
		return fmt.Errorf("failed to parse database DSN: %w", err)
	}

	// Set connection pool settings from config
	poolConfig.MaxConns = cfg.Database.MaxConns
	poolConfig.MinConns = cfg.Database.MinConns
	poolConfig.MaxConnLifetime = cfg.Database.MaxConnLifetime
	poolConfig.MaxConnIdleTime = cfg.Database.MaxConnIdleTime
	poolConfig.HealthCheckPeriod = 30 * time.Second

	// Set connection timeout
	poolConfig.ConnConfig.ConnectTimeout = 10 * time.Second

	// Create the connection pool
	DB, err = pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		return fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test the connection
	err = DB.Ping(context.Background())
	if err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	logrus.Info("Database connection established successfully")
	return nil
}

// Close closes the database connection pool
// This should be called when the application shuts down
func Close() {
	if DB != nil {
		DB.Close()
		logrus.Info("Database connection pool closed")
	}
}

// BeginTx starts a new database transaction
// Use this when you need to execute multiple operations atomically
func BeginTx(ctx context.Context) (pgxpool.Tx, error) {
	return DB.BeginTx(ctx, nil)
}

// UUIDToString converts a UUID to a string for database queries
// This is a helper function to avoid nil pointer issues
func UUIDToString(uuid *uuid.UUID) string {
	if uuid == nil {
		return ""
	}
	return uuid.String()
}

// NullUUID converts a UUID to a pgx UUID for database operations
// This handles nil values properly
func NullUUID(uuid *uuid.UUID) interface{} {
	if uuid == nil {
		return nil
	}
	return *uuid
}

// TimeToPtr converts a time.Time to a pointer
// This is useful when you need a pointer to a time for nullable database fields
func TimeToPtr(t time.Time) *time.Time {
	return &t
}

// NowUTC returns the current time in UTC
// Use this for all database timestamps to ensure consistency
func NowUTC() time.Time {
	return time.Now().UTC()
}

// GenerateUUIDv7 generates a UUIDv7 (time-sortable)
// This is used for message IDs and other entities where time-based ordering is important
func GenerateUUIDv7() uuid.UUID {
	// UUIDv7: Unix Epoch timestamp in milliseconds (48 bits) + random (74 bits)
	// This gives us time-sortable UUIDs which is great for database performance
	timestamp := time.Now().UnixMilli()
	
	// Create a UUID from timestamp and random bytes
	// For simplicity, we use uuid.New() which gives UUIDv4
	// In production, use a proper UUIDv7 implementation
	// This is a placeholder - in production, use a proper UUIDv7 library
	return uuid.New()
}

// QueryRow is a helper to query a single row
func QueryRow(ctx context.Context, sql string, args ...interface{}) pgxpool.Row {
	return DB.QueryRow(ctx, sql, args...)
}

// Query is a helper to execute a query
func Query(ctx context.Context, sql string, args ...interface{}) (pgxpool.Rows, error) {
	return DB.Query(ctx, sql, args...)
}

// Exec is a helper to execute a statement
func Exec(ctx context.Context, sql string, args ...interface{}) (pgxpool.CommandTag, error) {
	return DB.Exec(ctx, sql, args...)
}

// GetDatabaseStats returns basic statistics about the database connection
// This is useful for monitoring and debugging
func GetDatabaseStats() map[string]interface{} {
	if DB == nil {
		return map[string]interface{}{
			"connected": false,
		}
	}

	return map[string]interface{}{
		"connected":           true,
		"max_conns":          DB.Config().MaxConns,
		"min_conns":          DB.Config().MinConns,
		"current_conns":      DB.Stat().TotalConns(),
		"idle_conns":        DB.Stat().IdleConns(),
		"acquired_conns":     DB.Stat().AcquiredConns(),
		"max_conn_lifetime":  DB.Config().MaxConnLifetime,
		"max_conn_idle_time": DB.Config().MaxConnIdleTime,
	}
}
