// Package handlers contains HTTP handlers for the application
// This file contains user-related handlers (logout, delete, report, location)
package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"

	"github.com/yourusername/ping/internal/models"
	"github.com/yourusername/ping/internal/service"
)

// Logout logs out the current user
// In JWT system, this is mainly for client-side token cleanup
// But we can track it server-side for extra security
func (h *Handler) Logout(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"User not authenticated",
		))
		return
	}

	uid, ok := userID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"Invalid user ID",
		))
		return
	}

	// Call logout service
	err := h.userService.Logout(c.Request.Context(), uid)
	if err != nil {
		logrus.WithError(err).Error("Logout failed")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"internal_error",
			"Logout failed",
		))
		return
	}

	c.JSON(http.StatusOK, NewSuccessResponse(gin.H{
		"message": "Logged out successfully",
	}, "Logout successful"))
}

// DeleteAccount deletes the current user's account
// Requires password confirmation for security
func (h *Handler) DeleteAccount(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"User not authenticated",
		))
		return
	}

	uid, ok := userID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"Invalid user ID",
		))
		return
	}

	var req struct {
		// Password is required for account deletion (security)
		Password string `json:"password" binding:"required,min=8"`
		
		// Reason for deletion (optional)
		Reason string `json:"reason,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			fmt.Sprintf("Invalid request: %v", err),
		))
		return
	}

	// Call delete account service
	err := h.userService.DeleteAccount(c.Request.Context(), uid, req.Password)
	if err != nil {
		logrus.WithError(err).Debug("Account deletion failed")
		
		var code, message string
		var statusCode int

		switch {
		case err == service.ErrUserNotFound:
			statusCode = http.StatusNotFound
			code = "user_not_found"
			message = "User not found"
		case err == service.ErrInvalidPassword:
			statusCode = http.StatusUnauthorized
			code = "invalid_password"
			message = "Invalid password. Account deletion requires password confirmation."
		default:
			statusCode = http.StatusInternalServerError
			code = "deletion_failed"
			message = "Account deletion failed"
		}

		c.JSON(statusCode, NewErrorResponse(code, message))
		return
	}

	// Logout the user after account deletion
	// This ensures the token is invalidated
	_ = h.userService.Logout(c.Request.Context(), uid)

	c.JSON(http.StatusOK, NewSuccessResponse(gin.H{
		"message": "Account deleted successfully",
	}, "Account deleted"))
}

// ReportUser allows a user to report another user
func (h *Handler) ReportUser(c *gin.Context) {
	// Get user ID from context (reporter)
	reporterID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"User not authenticated",
		))
		return
	}

	reporterUID, ok := reporterID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"Invalid user ID",
		))
		return
	}

	var req models.ReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			fmt.Sprintf("Invalid request: %v", err),
		))
		return
	}

	// Call report service
	reportResp, err := h.userService.ReportUser(c.Request.Context(), reporterUID, &req)
	if err != nil {
		logrus.WithError(err).Error("Failed to file report")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"internal_error",
			"Failed to file report",
		))
		return
	}

	c.JSON(http.StatusCreated, NewSuccessResponse(reportResp, "Report filed successfully"))
}

// GetReportStatus gets the status of a report filed by the current user
func (h *Handler) GetReportStatus(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"User not authenticated",
		))
		return
	}

	uid, ok := userID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"Invalid user ID",
		))
		return
	}

	// Get report ID from URL
	reportIDStr := c.Param("id")
	reportID, err := uuid.Parse(reportIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"invalid_id",
			"Invalid report ID",
		))
		return
	}

	// Get report status
	reportResp, err := h.userService.GetReportStatus(c.Request.Context(), reportID, uid)
	if err != nil {
		logrus.WithError(err).Debug("Failed to get report status")
		
		var code, message string
		var statusCode int

		if err.Error() == "unauthorized: you did not file this report" {
			statusCode = http.StatusForbidden
			code = "unauthorized"
			message = "You did not file this report"
		} else {
			statusCode = http.StatusNotFound
			code = "report_not_found"
			message = "Report not found"
		}

		c.JSON(statusCode, NewErrorResponse(code, message))
		return
	}

	c.JSON(http.StatusOK, NewSuccessResponse(reportResp, "Report status retrieved"))
}

// ListMyReports lists all reports filed by the current user
func (h *Handler) ListMyReports(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"User not authenticated",
		))
		return
	}

	uid, ok := userID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"Invalid user ID",
		))
		return
	}

	// Get reports
	reports, err := h.userService.ListMyReports(c.Request.Context(), uid)
	if err != nil {
		logrus.WithError(err).Error("Failed to list reports")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"internal_error",
			"Failed to list reports",
		))
		return
	}

	c.JSON(http.StatusOK, NewSuccessResponse(reports, "Reports retrieved successfully"))
}

// StartLiveLocation starts a live location sharing session
func (h *Handler) StartLiveLocation(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"User not authenticated",
		))
		return
	}

	uid, ok := userID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"Invalid user ID",
		))
		return
	}

	var req struct {
		// ConversationID is where to share the location
		ConversationID uuid.UUID `json:"conversation_id" binding:"required"`
		
		// Duration in minutes (max 60)
		Duration int `json:"duration" binding:"required,min=1,max=60"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			fmt.Sprintf("Invalid request: %v", err),
		))
		return
	}

	// Start live location session
	session, err := h.userService.StartLiveLocation(c.Request.Context(), uid, req.ConversationID, req.Duration)
	if err != nil {
		logrus.WithError(err).Debug("Failed to start live location")
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			err.Error(),
		))
		return
	}

	c.JSON(http.StatusCreated, NewSuccessResponse(session, "Live location session started"))
}

// StopLiveLocation stops a live location sharing session
func (h *Handler) StopLiveLocation(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"User not authenticated",
		))
		return
	}

	uid, ok := userID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"Invalid user ID",
		))
		return
	}

	// Get session ID from URL
	sessionIDStr := c.Param("id")
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"invalid_id",
			"Invalid session ID",
		))
		return
	}

	// Stop live location session
	err = h.userService.StopLiveLocation(c.Request.Context(), uid, sessionID)
	if err != nil {
		logrus.WithError(err).Error("Failed to stop live location")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"internal_error",
			"Failed to stop live location",
		))
		return
	}

	c.JSON(http.StatusOK, NewSuccessResponse(gin.H{
		"message": "Live location session stopped",
		"session_id": sessionID,
	}, "Live location stopped"))
}

// UpdateLiveLocation updates the location in a live session
func (h *Handler) UpdateLiveLocation(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"User not authenticated",
		))
		return
	}

	uid, ok := userID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"Invalid user ID",
		))
		return
	}

	// Get session ID from URL
	sessionIDStr := c.Param("id")
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"invalid_id",
			"Invalid session ID",
		))
		return
	}

	var req struct {
		// Latitude is required
		Latitude float64 `json:"latitude" binding:"required"`
		
		// Longitude is required
		Longitude float64 `json:"longitude" binding:"required"`
		
		// Accuracy in meters (optional)
		Accuracy float64 `json:"accuracy,omitempty"`
		
		// Address or place name (optional)
		Address string `json:"address,omitempty"`
		
		// Map URL (optional)
		MapURL string `json:"map_url,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			fmt.Sprintf("Invalid request: %v", err),
		))
		return
	}

	// Create location message
	location := &models.LocationMessage{
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
		Accuracy:  req.Accuracy,
		Address:   req.Address,
		MapURL:    req.MapURL,
		Timestamp: time.Now().UTC(),
	}

	// Update live location
	update, err := h.userService.UpdateLiveLocation(c.Request.Context(), sessionID, uid, location)
	if err != nil {
		logrus.WithError(err).Error("Failed to update live location")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"internal_error",
			"Failed to update live location",
		))
		return
	}

	c.JSON(http.StatusOK, NewSuccessResponse(update, "Live location updated"))
}

// SendLocation sends a current location message
func (h *Handler) SendLocation(c *gin.Context) {
	// This will be implemented in the messages handler
	// For now, this is a placeholder
	c.JSON(http.StatusOK, NewSuccessResponse(gin.H{
		"message": "Use the messages endpoint to send location messages",
	}, "Location feature available"))
}
