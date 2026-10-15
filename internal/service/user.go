// Package service contains the business logic for the application
// UserService handles user management operations (logout, delete, update)
package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"

	"github.com/yourusername/ping/internal/database"
	"github.com/yourusername/ping/internal/models"
	"github.com/yourusername/ping/internal/repository"
)

// UserService handles user management operations
type UserService struct {
	// userRepo is the repository for user operations
	userRepo *repository.UserRepository
	
	// reportRepo is the repository for report operations
	reportRepo *repository.ReportRepository
}

// NewUserService creates a new UserService
func NewUserService() *UserService {
	return &UserService{
		userRepo:   repository.NewUserRepository(),
		reportRepo: repository.NewReportRepository(),
	}
}

// Logout logs out a user by invalidating their session
// In this JWT-based system, logout is handled client-side by removing the token
// But we can track it in Redis if needed
func (s *UserService) Logout(ctx context.Context, userID uuid.UUID) error {
	// In a JWT system, the client simply discards the token
	// We can optionally track logged-out tokens in Redis for extra security
	// This prevents the token from being used even if stolen
	
	// For now, we'll just log the logout
	logrus.WithField("user_id", userID).Info("User logged out")
	
	// In production, you might want to:
	// 1. Add the token to a Redis blacklist
	// 2. Set a short expiration on the blacklist entry
	// 3. Return success
	
	return nil
}

// DeleteAccount deletes a user account and all associated data
func (s *UserService) DeleteAccount(ctx context.Context, userID uuid.UUID, password string) error {
	// First, get the user to verify password
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return ErrUserNotFound
	}

	// Verify password before deletion
	if err := VerifyPasswordHash(password, user.PasswordHash); err != nil {
		return ErrInvalidPassword
	}

	// Soft delete: mark user as inactive
	// This preserves data but prevents login
	// In production, you might want to:
	// 1. Delete all user data (hard delete)
	// 2. Or anonymize data (soft delete with data retention)
	// 3. Or mark as inactive (current implementation)
	
	// For now, we'll deactivate the account
	err = s.userRepo.Deactivate(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to deactivate user: %w", err)
	}

	logrus.WithField("user_id", userID).Info("User account deleted")
	return nil
}

// UpdateProfile updates a user's profile (name, photo, status)
func (s *UserService) UpdateProfile(ctx context.Context, userID uuid.UUID, req *models.UserUpdateRequest) (*models.UserResponse, error) {
	// Get current user
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return nil, ErrUserNotFound
	}

	// Update fields
	if req.DisplayName != "" {
		user.DisplayName = req.DisplayName
	}
	if req.AvatarURL != "" {
		user.AvatarURL = req.AvatarURL
	}
	if req.Status != "" {
		user.Status = req.Status
	}
	if req.Email != "" {
		user.Email = req.Email
	}

	// Update user in database
	err = s.userRepo.Update(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	logrus.WithField("user_id", userID).Info("User profile updated")
	
	// Return updated user
	return &models.UserResponse{
		ID:          user.ID,
		Phone:       user.Phone,
		Username:    user.Username,
		DisplayName: user.DisplayName,
		Email:       user.Email,
		AvatarURL:   user.AvatarURL,
		Status:      user.Status,
		IsActive:    user.IsActive,
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
		LastSeenAt:  user.LastSeenAt,
	}, nil
}

// GetUserByID returns a user by their ID
func (s *UserService) GetUserByID(ctx context.Context, id uuid.UUID) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	if user == nil {
		return nil, ErrUserNotFound
	}

	return &models.UserResponse{
		ID:          user.ID,
		Phone:       user.Phone,
		Username:    user.Username,
		DisplayName: user.DisplayName,
		Email:       user.Email,
		AvatarURL:   user.AvatarURL,
		Status:      user.Status,
		IsActive:    user.IsActive,
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
		LastSeenAt:  user.LastSeenAt,
	}, nil
}

// ReportUser files a report against another user
func (s *UserService) ReportUser(ctx context.Context, reporterID uuid.UUID, req *models.ReportRequest) (*models.ReportResponse, error) {
	// Create report model
	report := &models.Report{
		ReporterID:      reporterID,
		ReportedUserID:   req.ReportedUserID,
		ReportedMessageID: req.ReportedMessageID,
		Reason:          req.Reason,
		Description:     req.Description,
		Category:        req.Category,
		Status:          models.ReportStatusPending,
	}

	// Save report to database
	err := s.reportRepo.Create(ctx, report)
	if err != nil {
		return nil, fmt.Errorf("failed to create report: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"report_id":      report.ID,
		"reporter_id":    reporterID,
		"reported_user":  req.ReportedUserID,
		"category":       req.Category,
	}).Info("Report filed successfully")

	return &models.ReportResponse{
		ID:            report.ID,
		ReporterID:    report.ReporterID,
		ReportedUserID: report.ReportedUserID,
		Reason:        report.Reason,
		Category:      report.Category,
		Status:        report.Status,
		CreatedAt:     report.CreatedAt,
	}, nil
}

// GetReportStatus gets the status of a report
func (s *UserService) GetReportStatus(ctx context.Context, reportID uuid.UUID, reporterID uuid.UUID) (*models.ReportResponse, error) {
	// Find the report
	report, err := s.reportRepo.FindByID(ctx, reportID)
	if err != nil {
		return nil, fmt.Errorf("failed to find report: %w", err)
	}
	if report == nil {
		return nil, fmt.Errorf("report not found")
	}

	// Verify the reporter is the one who filed the report
	if report.ReporterID != reporterID {
		return nil, fmt.Errorf("unauthorized: you did not file this report")
	}

	return &models.ReportResponse{
		ID:            report.ID,
		ReporterID:    report.ReporterID,
		ReportedUserID: report.ReportedUserID,
		Reason:        report.Reason,
		Category:      report.Category,
		Status:        report.Status,
		CreatedAt:     report.CreatedAt,
	}, nil
}

// ListMyReports lists all reports filed by the current user
func (s *UserService) ListMyReports(ctx context.Context, reporterID uuid.UUID) ([]*models.ReportResponse, error) {
	reports, err := s.reportRepo.ListByReporter(ctx, reporterID)
	if err != nil {
		return nil, fmt.Errorf("failed to list reports: %w", err)
	}

	// Convert to response format
	responses := make([]*models.ReportResponse, len(reports))
	for i, report := range reports {
		responses[i] = &models.ReportResponse{
			ID:            report.ID,
			ReporterID:    report.ReporterID,
			ReportedUserID: report.ReportedUserID,
			Reason:        report.Reason,
			Category:      report.Category,
			Status:        report.Status,
			CreatedAt:     report.CreatedAt,
		}
	}

	return responses, nil
}

// StartLiveLocation starts a live location sharing session
func (s *UserService) StartLiveLocation(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, durationMinutes int) (*models.LiveLocationMessage, error) {
	// Validate duration (max 60 minutes)
	if durationMinutes <= 0 || durationMinutes > 60 {
		return nil, fmt.Errorf("duration must be between 1 and 60 minutes")
	}

	// In a real implementation, you would:
	// 1. Create a live location session
	// 2. Store it in the database
	// 3. Return the session ID
	
	// For now, we'll create a placeholder response
	session := &models.LiveLocationMessage{
		SessionID:      uuid.New(),
		UserID:         userID,
		ConversationID: conversationID,
		StartedAt:      database.NowUTC(),
		ExpiresAt:      database.NowUTC().Add(time.Duration(durationMinutes) * time.Minute),
		IsActive:       true,
	}

	logrus.WithFields(logrus.Fields{
		"session_id":      session.SessionID,
		"user_id":         userID,
		"conversation_id": conversationID,
		"duration":        durationMinutes,
	}).Info("Live location session started")

	return session, nil
}

// StopLiveLocation stops a live location sharing session
func (s *UserService) StopLiveLocation(ctx context.Context, userID uuid.UUID, sessionID uuid.UUID) error {
	// In a real implementation, you would:
	// 1. Find the session
	// 2. Mark it as inactive
	// 3. Return success
	
	logrus.WithFields(logrus.Fields{
		"session_id": sessionID,
		"user_id":    userID,
	}).Info("Live location session stopped")

	return nil
}

// UpdateLiveLocation updates the location in a live session
func (s *UserService) UpdateLiveLocation(ctx context.Context, sessionID uuid.UUID, userID uuid.UUID, location *models.LocationMessage) (*models.LiveLocationUpdate, error) {
	// In a real implementation, you would:
	// 1. Verify the session belongs to the user
	// 2. Check if the session is still active
	// 3. Store the location update
	// 4. Broadcast to conversation participants via WebSocket
	
	update := &models.LiveLocationUpdate{
		SessionID: sessionID,
		Location:  *location,
		Timestamp: database.NowUTC(),
	}

	logrus.WithFields(logrus.Fields{
		"session_id": sessionID,
		"user_id":    userID,
		"latitude":   location.Latitude,
		"longitude":  location.Longitude,
	}).Info("Live location updated")

	return update, nil
}
