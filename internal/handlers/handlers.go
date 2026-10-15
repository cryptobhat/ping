// Package handlers contains HTTP handlers for the application
// Each handler processes an HTTP request and returns a response
package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"

	"github.com/yourusername/ping/internal/config"
	"github.com/yourusername/ping/internal/database"
	"github.com/yourusername/ping/internal/database/migrations"
	"github.com/yourusername/ping/internal/models"
	"github.com/yourusername/ping/internal/service"
)

// Handler contains dependencies for HTTP handlers
type Handler struct {
	// authService is the authentication service
	authService *service.AuthService
	
	// userService is the user management service
	userService *service.UserService
	
	// cfg is the application configuration
	cfg *config.Config
}

// NewHandler creates a new Handler with dependencies
func NewHandler(authService *service.AuthService, userService *service.UserService, cfg *config.Config) *Handler {
	return &Handler{
		authService: authService,
		userService: userService,
		cfg:       cfg,
	}
}

// Response is the standard response format for successful requests
type Response struct {
	// Success indicates if the request was successful
	Success bool `json:"success"`
	
	// Data contains the response data
	Data interface{} `json:"data,omitempty"`
	
	// Message is an optional message
	Message string `json:"message,omitempty"`
}

// NewSuccessResponse creates a new success response
func NewSuccessResponse(data interface{}, message string) *Response {
	return &Response{
		Success: true,
		Data:    data,
		Message: message,
	}
}

// ErrorResponse is the standard response format for errors
type ErrorResponse struct {
	// Success indicates if the request was successful (always false for errors)
	Success bool `json:"success"`
	
	// Error contains error information
	Error *ErrorInfo `json:"error"`
}

// ErrorInfo contains error details
type ErrorInfo struct {
	// Code is a unique error code
	Code string `json:"code"`
	
	// Message is a human-readable error message
	Message string `json:"message"`
	
	// Details contains additional error details (optional)
	Details interface{} `json:"details,omitempty"`
}

// NewErrorResponse creates a new error response
func NewErrorResponse(code, message string) *ErrorResponse {
	return &ErrorResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    code,
			Message: message,
		},
	}
}

// NewErrorResponseWithDetails creates a new error response with details
func NewErrorResponseWithDetails(code, message string, details interface{}) *ErrorResponse {
	return &ErrorResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    code,
			Message: message,
			Details: details,
		},
	}
}

// HealthCheck returns the health status of the application
func (h *Handler) HealthCheck(c *gin.Context) {
	// Check database connection
	dbHealthy := database.DB != nil
	if dbHealthy {
		// Test the connection
		err := database.DB.Ping(c.Request.Context())
		if err != nil {
			dbHealthy = false
		}
	}

	// Check Redis connection
	resdisHealthy := database.Redis != nil
	if redisHealthy {
		// Test the connection
		ctx := c.Request.Context()
		_, err := database.Redis.Ping(ctx).Result()
		if err != nil {
			resdisHealthy = false
		}
	}

	// Get database stats
	var dbStats map[string]interface{}
	if dbHealthy {
		dbStats = database.GetDatabaseStats()
	}

	// Get Redis stats
	var redisStats map[string]interface{}
	if redisHealthy {
		resdisStats = database.GetRedisStats()
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"status": "healthy",
			"database": gin.H{
				"healthy": dbHealthy,
				"stats":   dbStats,
			},
			"redis": gin.H{
				"healthy": redisHealthy,
				"stats":   redisStats,
			},
			"version": "1.0.0",
			"environment": h.cfg.Server.Environment,
		},
	})
}

// APIInfo returns information about the API
func (h *Handler) APIInfo(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"name":        "WhatsApp-Like Messaging API",
			"version":     "1.0.0",
			"description": "Privacy-first, real-time, end-to-end encrypted messaging",
			"environment": h.cfg.Server.Environment,
			"endpoints": gin.H{
				"auth": gin.H{
					"register": "POST /api/v1/auth/register",
					"login":    "POST /api/v1/auth/login",
					"refresh":  "POST /api/v1/auth/refresh",
					"otp_send": "POST /api/v1/auth/otp/send",
					"otp_verify": "POST /api/v1/auth/otp/verify",
				},
				"users": gin.H{
					"get_current": "GET /api/v1/users/me",
					"update":     "PUT /api/v1/users/me",
					"get_by_id":  "GET /api/v1/users/:id",
					"search":     "GET /api/v1/users/search",
					"logout":     "POST /api/v1/users/logout",
					"delete":     "DELETE /api/v1/users/me",
					"report":     "POST /api/v1/users/report",
					"list_reports": "GET /api/v1/users/reports",
					"get_report":  "GET /api/v1/users/reports/:id",
				},
				"devices": gin.H{
					"register": "POST /api/v1/devices/register",
					"list":     "GET /api/v1/devices",
					"get":      "GET /api/v1/devices/:id",
				},
				"prekeys": gin.H{
					"get_bundle": "GET /api/v1/prekeys/:device_id",
				},
				"conversations": gin.H{
					"create":   "POST /api/v1/conversations",
					"create_group": "POST /api/v1/conversations/groups",
					"list":     "GET /api/v1/conversations",
					"get":      "GET /api/v1/conversations/:id",
					"update":   "PUT /api/v1/conversations/:id",
					"delete":   "DELETE /api/v1/conversations/:id",
				},
				"groups": gin.H{
					"invite":       "POST /api/v1/groups/:id/invite",
					"join":         "POST /api/v1/groups/join",
					"revoke_invite": "DELETE /api/v1/groups/:id/invite",
					"list_invites":  "GET /api/v1/groups/:id/invites",
				},
				"messages": gin.H{
					"send":     "POST /api/v1/messages",
					"get":      "GET /api/v1/messages/:id",
					"list":     "GET /api/v1/messages/conversation/:conversation_id",
					"update":   "PUT /api/v1/messages/:id",
					"delete":   "DELETE /api/v1/messages/:id",
					"mark_read": "POST /api/v1/messages/:id/read",
					"websocket": "GET /api/v1/messages/ws",
				},
				"live_locations": gin.H{
					"start": "POST /api/v1/live-locations",
					"stop":  "DELETE /api/v1/live-locations/:id",
					"update": "PUT /api/v1/live-locations/:id",
				},
			},
			"documentation": "https://github.com/yourusername/ping",
		},
	})
}

// Version returns the application version
func (h *Handler) Version(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"version": "1.0.0",
			"build_date": "2024-01-01",
			"commit":    "unknown",
		},
	})
}

// Metrics returns application metrics for monitoring
func (h *Handler) Metrics(c *gin.Context) {
	// In production, you would integrate with Prometheus or similar
	// For now, return basic metrics
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"requests_total": 0, // Would be incremented by middleware
			"errors_total":   0, // Would be incremented by error handler
			"users_online":   0, // Would be tracked by presence service
			"messages_sent":  0, // Would be tracked by message service
		},
	})
}

// DatabaseStats returns database connection statistics
func (h *Handler) DatabaseStats(c *gin.Context) {
	stats := database.GetDatabaseStats()
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": stats,
	})
}

// RedisStats returns Redis connection statistics
func (h *Handler) RedisStats(c *gin.Context) {
	stats := database.GetRedisStats()
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": stats,
	})
}

// MigrationInfo returns information about database migrations
func (h *Handler) MigrationInfo(c *gin.Context) {
	ctx := c.Request.Context()
	infos, err := migrations.GetMigrationInfo(ctx)
	if err != nil {
		logrus.WithError(err).Error("Failed to get migration info")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"internal_error",
			"Failed to get migration info",
		))
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"migrations": infos,
			"count":     len(infos),
		},
	})
}

// Register registers a new user
// Phone number is REQUIRED (like WhatsApp)
func (h *Handler) Register(c *gin.Context) {
	var req struct {
		// Phone is REQUIRED
		Phone string `json:"phone" binding:"required,min=10,max=15"`
		
		// DisplayName is optional
		DisplayName string `json:"display_name,omitempty" binding:"omitempty,min=1,max=100"`
		
		// Username is optional
		Username string `json:"username,omitempty" binding:"omitempty,min=3,max=32"`
		
		// Email is optional
		Email string `json:"email,omitempty" binding:"omitempty,email"`
		
		// AvatarURL is optional
		AvatarURL string `json:"avatar_url,omitempty"`
		
		// Password is optional (can use OTP instead)
		Password string `json:"password,omitempty" binding:"omitempty,min=8"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			fmt.Sprintf("Invalid request: %v", err),
		))
		return
	}

	// Convert to service request
	userReq := &models.UserCreateRequest{
		Phone:       req.Phone,
		DisplayName: req.DisplayName,
		Username:    req.Username,
		Email:       req.Email,
		AvatarURL:   req.AvatarURL,
		Password:    req.Password,
	}

	userResp, err := h.authService.Register(c.Request.Context(), userReq)
	if err != nil {
		logrus.WithError(err).Debug("Registration failed")
		
		var code, message string
		var statusCode int
		
		switch {
		case err == service.ErrUserAlreadyExists:
			statusCode = http.StatusConflict
			code = "phone_already_exists"
			message = "Phone number already registered"
		default:
			statusCode = http.StatusBadRequest
			code = "registration_error"
			message = "Registration failed"
		}

		c.JSON(statusCode, NewErrorResponse(code, message))
		return
	}

	c.JSON(http.StatusCreated, NewSuccessResponse(userResp, "User registered successfully"))
}

// Login authenticates a user and returns tokens
// Phone number is REQUIRED (like WhatsApp)
// Can authenticate with password OR OTP
func (h *Handler) Login(c *gin.Context) {
	var req struct {
		// Phone is REQUIRED
		Phone string `json:"phone" binding:"required,min=10,max=15"`
		
		// Password is optional (can use OTP instead)
		Password string `json:"password,omitempty" binding:"omitempty,min=8"`
		
		// OTP is optional (can use password instead)
		OTP string `json:"otp,omitempty" binding:"omitempty,len=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			fmt.Sprintf("Invalid request: %v", err),
		))
		return
	}

	// Convert to service request
	loginReq := &models.UserLoginRequest{
		Phone:   req.Phone,
		Password: req.Password,
		OTP:     req.OTP,
	}

	tokenResp, err := h.authService.Login(c.Request.Context(), loginReq)
	if err != nil {
		logrus.WithError(err).Debug("Login failed")
		
		var code, message string
		var statusCode int

		switch {
		case err == service.ErrUserNotFound:
			statusCode = http.StatusNotFound
			code = "user_not_found"
			message = "User not found"
		case err == service.ErrInvalidPassword:
			statusCode = http.StatusUnauthorized
			code = "invalid_credentials"
			message = "Invalid phone, password, or OTP"
		default:
			statusCode = http.StatusUnauthorized
			code = "authentication_failed"
			message = "Authentication failed"
		}

		c.JSON(statusCode, NewErrorResponse(code, message))
		return
	}

	c.JSON(http.StatusOK, NewSuccessResponse(tokenResp, "Login successful"))
}

// RefreshToken refreshes the access token using a refresh token
func (h *Handler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			fmt.Sprintf("Invalid request: %v", err),
		))
		return
	}

	tokenResp, err := h.authService.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		logrus.WithError(err).Debug("Token refresh failed")
		
		var code, message string
		var statusCode int

		switch {
		case err == service.ErrInvalidToken:
			statusCode = http.StatusUnauthorized
			code = "invalid_token"
			message = "Invalid refresh token"
		case err == service.ErrUserNotFound:
			statusCode = http.StatusUnauthorized
			code = "user_not_found"
			message = "User not found"
		default:
			statusCode = http.StatusUnauthorized
			code = "token_refresh_failed"
			message = "Token refresh failed"
		}

		c.JSON(statusCode, NewErrorResponse(code, message))
		return
	}

	c.JSON(http.StatusOK, NewSuccessResponse(tokenResp, "Token refreshed successfully"))
}

// GetCurrentUser returns information about the current user
func (h *Handler) GetCurrentUser(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"User not authenticated",
		))
		return
	}

	// Convert to uuid.UUID
	uid, ok := userID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"Invalid user ID",
		))
		return
	}

	userResp, err := h.authService.GetUserByID(c.Request.Context(), uid)
	if err != nil {
		logrus.WithError(err).Error("Failed to get current user")
		c.JSON(http.StatusNotFound, NewErrorResponse("user_not_found", "User not found"))
		return
	}

	c.JSON(http.StatusOK, NewSuccessResponse(userResp, "User retrieved successfully"))
}

// UpdateCurrentUser updates the current user's profile
// Users can change display name and photo anytime
func (h *Handler) UpdateCurrentUser(c *gin.Context) {
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
		// DisplayName can be updated anytime
		DisplayName string `json:"display_name,omitempty" binding:"omitempty,min=1,max=100"`
		
		// AvatarURL can be updated anytime (profile photo)
		AvatarURL string `json:"avatar_url,omitempty"`
		
		// Status can be updated anytime
		Status string `json:"status,omitempty" binding:"omitempty,max=200"`
		
		// Email is optional
		Email string `json:"email,omitempty" binding:"omitempty,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			fmt.Sprintf("Invalid request: %v", err),
		))
		return
	}

	// Call user service to update profile
	userResp, err := h.userService.UpdateProfile(c.Request.Context(), uid, &models.UserUpdateRequest{
		DisplayName: req.DisplayName,
		AvatarURL:   req.AvatarURL,
		Status:      req.Status,
		Email:       req.Email,
	})
	if err != nil {
		logrus.WithError(err).Error("Failed to update user profile")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"update_failed",
			"Failed to update profile",
		))
		return
	}

	c.JSON(http.StatusOK, NewSuccessResponse(userResp, "Profile updated successfully"))
}

// GetUserByID returns a user by their ID
func (h *Handler) GetUserByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"invalid_id",
			"Invalid user ID",
		))
		return
	}

	userResp, err := h.authService.GetUserByID(c.Request.Context(), id)
	if err != nil {
		logrus.WithError(err).Error("Failed to get user by ID")
		c.JSON(http.StatusNotFound, NewErrorResponse("user_not_found", "User not found"))
		return
	}

	c.JSON(http.StatusOK, NewSuccessResponse(userResp, "User retrieved successfully"))
}

// SearchUsers searches for users by username prefix
func (h *Handler) SearchUsers(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			"Query parameter 'q' is required",
		))
		return
	}

	// In a real implementation, you would call the user repository
	// For now, return an empty list
	c.JSON(http.StatusOK, NewSuccessResponse([]interface{}{}, "Search results"))
}
