// Package repository contains the data access layer for the application
// DeviceRepository handles database operations for user devices
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

// DeviceRepository handles database operations for devices
type DeviceRepository struct {
	// db is the database connection pool
	db *pgxpool.Pool
}

// NewDeviceRepository creates a new DeviceRepository
func NewDeviceRepository() *DeviceRepository {
	return &DeviceRepository{
		db: database.DB,
	}
}

// Create creates a new device for a user
func (r *DeviceRepository) Create(ctx context.Context, device *models.Device) error {
	const sql = `
		INSERT INTO devices (
			user_id, device_id, name,
			identity_key_public, signed_prekey_public, signed_prekey_signature,
			signed_prekey_id, one_time_prekey_id, registration_id,
			is_active, is_verified
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
		) RETURNING id, created_at, updated_at
	`

	// Execute the query
	err := r.db.QueryRow(ctx, sql,
		device.UserID,
		device.DeviceID,
		device.Name,
		device.IdentityKeyPublic,
		device.SignedPrekeyPublic,
		device.SignedPrekeySignature,
		device.SignedPrekeyID,
		device.OneTimePrekeyID,
		device.RegistrationID,
		device.IsActive,
		device.IsVerified,
	).Scan(&device.ID, &device.CreatedAt, &device.UpdatedAt)

	if err != nil {
		if pgErr, ok := err.(*pgx.Error); ok {
			// Check for unique constraint violation
			if pgErr.Code == "23505" {
				return fmt.Errorf("device already exists for this user")
			}
		}
		return fmt.Errorf("failed to create device: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"device_id": device.ID,
		"user_id":   device.UserID,
		"name":      device.Name,
	}).Info("Device registered successfully")
	return nil
}

// FindByID finds a device by its ID
func (r *DeviceRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Device, error) {
	const sql = `
		SELECT 
			id, user_id, device_id, name,
			identity_key_public, signed_prekey_public, signed_prekey_signature,
			signed_prekey_id, one_time_prekey_id, registration_id,
			is_active, is_verified, created_at, updated_at, last_seen_at
		FROM devices
		WHERE id = $1
	`

	device := &models.Device{}
	err := r.db.QueryRow(ctx, sql, id).Scan(
		&device.ID,
		&device.UserID,
		&device.DeviceID,
		&device.Name,
		&device.IdentityKeyPublic,
		&device.SignedPrekeyPublic,
		&device.SignedPrekeySignature,
		&device.SignedPrekeyID,
		&device.OneTimePrekeyID,
		&device.RegistrationID,
		&device.IsActive,
		&device.IsVerified,
		&device.CreatedAt,
		&device.UpdatedAt,
		&device.LastSeenAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("device not found")
		}
		return nil, fmt.Errorf("failed to find device: %w", err)
	}

	return device, nil
}

// FindByDeviceID finds a device by its device_id string
func (r *DeviceRepository) FindByDeviceID(ctx context.Context, deviceID string) (*models.Device, error) {
	const sql = `
		SELECT 
			id, user_id, device_id, name,
			identity_key_public, signed_prekey_public, signed_prekey_signature,
			signed_prekey_id, one_time_prekey_id, registration_id,
			is_active, is_verified, created_at, updated_at, last_seen_at
		FROM devices
		WHERE device_id = $1
	`

	device := &models.Device{}
	err := r.db.QueryRow(ctx, sql, deviceID).Scan(
		&device.ID,
		&device.UserID,
		&device.DeviceID,
		&device.Name,
		&device.IdentityKeyPublic,
		&device.SignedPrekeyPublic,
		&device.SignedPrekeySignature,
		&device.SignedPrekeyID,
		&device.OneTimePrekeyID,
		&device.RegistrationID,
		&device.IsActive,
		&device.IsVerified,
		&device.CreatedAt,
		&device.UpdatedAt,
		&device.LastSeenAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("device not found")
		}
		return nil, fmt.Errorf("failed to find device by device_id: %w", err)
	}

	return device, nil
}

// FindByUserID finds all devices for a user
func (r *DeviceRepository) FindByUserID(ctx context.Context, userID uuid.UUID) ([]*models.Device, error) {
	const sql = `
		SELECT 
			id, user_id, device_id, name,
			identity_key_public, signed_prekey_public, signed_prekey_signature,
			signed_prekey_id, one_time_prekey_id, registration_id,
			is_active, is_verified, created_at, updated_at, last_seen_at
		FROM devices
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, sql, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query devices: %w", err)
	}
	defer rows.Close()

	var devices []*models.Device
	for rows.Next() {
		device := &models.Device{}
		err := rows.Scan(
			&device.ID,
			&device.UserID,
			&device.DeviceID,
			&device.Name,
			&device.IdentityKeyPublic,
			&device.SignedPrekeyPublic,
			&device.SignedPrekeySignature,
			&device.SignedPrekeyID,
			&device.OneTimePrekeyID,
			&device.RegistrationID,
			&device.IsActive,
			&device.IsVerified,
			&device.CreatedAt,
			&device.UpdatedAt,
			&device.LastSeenAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan device: %w", err)
		}
		devices = append(devices, device)
	}

	return devices, nil
}

// FindActiveByUserID finds all active devices for a user
func (r *DeviceRepository) FindActiveByUserID(ctx context.Context, userID uuid.UUID) ([]*models.Device, error) {
	const sql = `
		SELECT 
			id, user_id, device_id, name,
			identity_key_public, signed_prekey_public, signed_prekey_signature,
			signed_prekey_id, one_time_prekey_id, registration_id,
			is_active, is_verified, created_at, updated_at, last_seen_at
		FROM devices
		WHERE user_id = $1 AND is_active = TRUE
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, sql, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query active devices: %w", err)
	}
	defer rows.Close()

	var devices []*models.Device
	for rows.Next() {
		device := &models.Device{}
		err := rows.Scan(
			&device.ID,
			&device.UserID,
			&device.DeviceID,
			&device.Name,
			&device.IdentityKeyPublic,
			&device.SignedPrekeyPublic,
			&device.SignedPrekeySignature,
			&device.SignedPrekeyID,
			&device.OneTimePrekeyID,
			&device.RegistrationID,
			&device.IsActive,
			&device.IsVerified,
			&device.CreatedAt,
			&device.UpdatedAt,
			&device.LastSeenAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan device: %w", err)
		}
		devices = append(devices, device)
	}

	return devices, nil
}

// Update updates a device's information
func (r *DeviceRepository) Update(ctx context.Context, device *models.Device) error {
	const sql = `
		UPDATE devices
		SET 
			name = $2,
			identity_key_public = $3,
			signed_prekey_public = $4,
			signed_prekey_signature = $5,
			signed_prekey_id = $6,
			one_time_prekey_id = $7,
			is_active = $8,
			is_verified = $9,
			updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at
	`

	err := r.db.QueryRow(ctx, sql,
		device.ID,
		device.Name,
		device.IdentityKeyPublic,
		device.SignedPrekeyPublic,
		device.SignedPrekeySignature,
		device.SignedPrekeyID,
		device.OneTimePrekeyID,
		device.IsActive,
		device.IsVerified,
	).Scan(&device.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to update device: %w", err)
	}

	logrus.WithField("device_id", device.ID).Info("Device updated successfully")
	return nil
}

// UpdateLastSeen updates a device's last seen timestamp
func (r *DeviceRepository) UpdateLastSeen(ctx context.Context, deviceID uuid.UUID) error {
	const sql = `
		UPDATE devices
		SET last_seen_at = NOW()
		WHERE id = $1
	`

	_, err := r.db.Exec(ctx, sql, deviceID)
	if err != nil {
		return fmt.Errorf("failed to update device last seen: %w", err)
	}

	return nil
}

// Deactivate deactivates a device (soft delete)
func (r *DeviceRepository) Deactivate(ctx context.Context, deviceID uuid.UUID) error {
	const sql = `
		UPDATE devices
		SET is_active = FALSE, updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.db.Exec(ctx, sql, deviceID)
	if err != nil {
		return fmt.Errorf("failed to deactivate device: %w", err)
	}

	logrus.WithField("device_id", deviceID).Info("Device deactivated successfully")
	return nil
}

// FindByUserIDAndDeviceID finds a specific device for a user
func (r *DeviceRepository) FindByUserIDAndDeviceID(ctx context.Context, userID uuid.UUID, deviceID string) (*models.Device, error) {
	const sql = `
		SELECT 
			id, user_id, device_id, name,
			identity_key_public, signed_prekey_public, signed_prekey_signature,
			signed_prekey_id, one_time_prekey_id, registration_id,
			is_active, is_verified, created_at, updated_at, last_seen_at
		FROM devices
		WHERE user_id = $1 AND device_id = $2
	`

	device := &models.Device{}
	err := r.db.QueryRow(ctx, sql, userID, deviceID).Scan(
		&device.ID,
		&device.UserID,
		&device.DeviceID,
		&device.Name,
		&device.IdentityKeyPublic,
		&device.SignedPrekeyPublic,
		&device.SignedPrekeySignature,
		&device.SignedPrekeyID,
		&device.OneTimePrekeyID,
		&device.RegistrationID,
		&device.IsActive,
		&device.IsVerified,
		&device.CreatedAt,
		&device.UpdatedAt,
		&device.LastSeenAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("device not found for user")
		}
		return nil, fmt.Errorf("failed to find device by user and device id: %w", err)
	}

	return device, nil
}

// FindActiveDevicesByIDs finds active devices by their IDs
func (r *DeviceRepository) FindActiveDevicesByIDs(ctx context.Context, ids []uuid.UUID) ([]*models.Device, error) {
	if len(ids) == 0 {
		return []*models.Device{}, nil
	}

	const sql = `
		SELECT 
			id, user_id, device_id, name,
			identity_key_public, signed_prekey_public, signed_prekey_signature,
			signed_prekey_id, one_time_prekey_id, registration_id,
			is_active, is_verified, created_at, updated_at, last_seen_at
		FROM devices
		WHERE id = ANY($1) AND is_active = TRUE
	`

	rows, err := r.db.Query(ctx, sql, ids)
	if err != nil {
		return nil, fmt.Errorf("failed to query devices: %w", err)
	}
	defer rows.Close()

	var devices []*models.Device
	for rows.Next() {
		device := &models.Device{}
		err := rows.Scan(
			&device.ID,
			&device.UserID,
			&device.DeviceID,
			&device.Name,
			&device.IdentityKeyPublic,
			&device.SignedPrekeyPublic,
			&device.SignedPrekeySignature,
			&device.SignedPrekeyID,
			&device.OneTimePrekeyID,
			&device.RegistrationID,
			&device.IsActive,
			&device.IsVerified,
			&device.CreatedAt,
			&device.UpdatedAt,
			&device.LastSeenAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan device: %w", err)
		}
		devices = append(devices, device)
	}

	return devices, nil
}
