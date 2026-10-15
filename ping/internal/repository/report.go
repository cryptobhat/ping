// Package repository contains the data access layer for the application
// ReportRepository handles database operations for user reports
package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/sirupsen/logrus"

	"github.com/yourusername/ping/internal/database"
	"github.com/yourusername/ping/internal/models"
)

// ReportRepository handles database operations for reports
type ReportRepository struct {
	// db is the database connection pool
	db *pgxpool.Pool
}

// NewReportRepository creates a new ReportRepository
func NewReportRepository() *ReportRepository {
	return &ReportRepository{
		db: database.DB,
	}
}

// Create creates a new report in the database
func (r *ReportRepository) Create(ctx context.Context, report *models.Report) error {
	const sql = `
		INSERT INTO reports (
			reporter_id, reported_user_id, reported_message_id,
			reason, description, category, status
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		) RETURNING id, created_at, updated_at
	`

	// Execute the query
	err := r.db.QueryRow(ctx, sql,
		report.ReporterID,
		report.ReportedUserID,
		database.NullUUID(report.ReportedMessageID),
		report.Reason,
		database.NullString(report.Description),
		report.Category,
		report.Status,
	).Scan(&report.ID, &report.CreatedAt, &report.UpdatedAt)

	if err != nil {
		if pgErr, ok := err.(*pgx.Error); ok {
			// Check for unique constraint violation
			if pgErr.Code == "23505" {
				return fmt.Errorf("report already exists")
			}
		}
		return fmt.Errorf("failed to create report: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"report_id": report.ID,
		"reporter_id": report.ReporterID,
		"reported_user_id": report.ReportedUserID,
		"category": report.Category,
	}).Info("Report filed successfully")
	return nil
}

// FindByID finds a report by its ID
func (r *ReportRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Report, error) {
	const sql = `
		SELECT 
			id, reporter_id, reported_user_id, reported_message_id,
			reason, description, category, status, created_at, updated_at
		FROM reports
		WHERE id = $1
	`

	report := &models.Report{}
	err := r.db.QueryRow(ctx, sql, id).Scan(
		&report.ID,
		&report.ReporterID,
		&report.ReportedUserID,
		&report.ReportedMessageID,
		&report.Reason,
		&report.Description,
		&report.Category,
		&report.Status,
		&report.CreatedAt,
		&report.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("report not found")
		}
		return nil, fmt.Errorf("failed to find report: %w", err)
	}

	return report, nil
}

// ListByReporter finds all reports filed by a user
func (r *ReportRepository) ListByReporter(ctx context.Context, reporterID uuid.UUID) ([]*models.Report, error) {
	const sql = `
		SELECT 
			id, reporter_id, reported_user_id, reported_message_id,
			reason, description, category, status, created_at, updated_at
		FROM reports
		WHERE reporter_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, sql, reporterID)
	if err != nil {
		return nil, fmt.Errorf("failed to query reports: %w", err)
	}
	defer rows.Close()

	var reports []*models.Report
	for rows.Next() {
		report := &models.Report{}
		err := rows.Scan(
			&report.ID,
			&report.ReporterID,
			&report.ReportedUserID,
			&report.ReportedMessageID,
			&report.Reason,
			&report.Description,
			&report.Category,
			&report.Status,
			&report.CreatedAt,
			&report.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan report: %w", err)
		}
		reports = append(reports, report)
	}

	return reports, nil
}

// ListByReportedUser finds all reports about a specific user
func (r *ReportRepository) ListByReportedUser(ctx context.Context, reportedUserID uuid.UUID) ([]*models.Report, error) {
	const sql = `
		SELECT 
			id, reporter_id, reported_user_id, reported_message_id,
			reason, description, category, status, created_at, updated_at
		FROM reports
		WHERE reported_user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, sql, reportedUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to query reports: %w", err)
	}
	defer rows.Close()

	var reports []*models.Report
	for rows.Next() {
		report := &models.Report{}
		err := rows.Scan(
			&report.ID,
			&report.ReporterID,
			&report.ReportedUserID,
			&report.ReportedMessageID,
			&report.Reason,
			&report.Description,
			&report.Category,
			&report.Status,
			&report.CreatedAt,
			&report.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan report: %w", err)
		}
		reports = append(reports, report)
	}

	return reports, nil
}

// ListPending returns all reports that are still pending
func (r *ReportRepository) ListPending(ctx context.Context, limit int) ([]*models.Report, error) {
	const sql = `
		SELECT 
			id, reporter_id, reported_user_id, reported_message_id,
			reason, description, category, status, created_at, updated_at
		FROM reports
		WHERE status = 'pending'
		ORDER BY created_at ASC
		LIMIT $1
	`

	rows, err := r.db.Query(ctx, sql, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query pending reports: %w", err)
	}
	defer rows.Close()

	var reports []*models.Report
	for rows.Next() {
		report := &models.Report{}
		err := rows.Scan(
			&report.ID,
			&report.ReporterID,
			&report.ReportedUserID,
			&report.ReportedMessageID,
			&report.Reason,
			&report.Description,
			&report.Category,
			&report.Status,
			&report.CreatedAt,
			&report.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan report: %w", err)
		}
		reports = append(reports, report)
	}

	return reports, nil
}

// UpdateStatus updates the status of a report
func (r *ReportRepository) UpdateStatus(ctx context.Context, reportID uuid.UUID, status models.ReportStatus) error {
	const sql = `
		UPDATE reports
		SET status = $2, updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at
	`

	var updatedAt time.Time
	err := r.db.QueryRow(ctx, sql, reportID, status).Scan(&updatedAt)
	if err != nil {
		return fmt.Errorf("failed to update report status: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"report_id": reportID,
		"status":    status,
	}).Info("Report status updated successfully")
	return nil
}

// Delete removes a report from the database
func (r *ReportRepository) Delete(ctx context.Context, reportID uuid.UUID) error {
	const sql = `DELETE FROM reports WHERE id = $1`

	_, err := r.db.Exec(ctx, sql, reportID)
	if err != nil {
		return fmt.Errorf("failed to delete report: %w", err)
	}

	logrus.WithField("report_id", reportID).Info("Report deleted successfully")
	return nil
}

// CountByReportedUser counts reports for a specific user
func (r *ReportRepository) CountByReportedUser(ctx context.Context, userID uuid.UUID) (int, error) {
	const sql = `SELECT COUNT(*) FROM reports WHERE reported_user_id = $1`

	var count int
	err := r.db.QueryRow(ctx, sql, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count reports: %w", err)
	}

	return count, nil
}
