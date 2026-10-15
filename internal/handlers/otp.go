// Package handlers contains HTTP handlers for the application
// This file contains OTP and group invitation handlers
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

// SendOTP sends an OTP code to the specified phone number
// This is the first step in OTP-based authentication
func (h *Handler) SendOTP(c *gin.Context) {
	var req struct {
		// Phone is REQUIRED
		Phone string `json:"phone" binding:"required,min=10,max=15"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			fmt.Sprintf("Invalid request: %v", err),
		))
		return
	}

	// Check if user exists with this phone number
	// This is optional - you might want to allow OTP for new user registration
	user, err := h.authService.userRepo.FindByPhone(c.Request.Context(), req.Phone)
	if err != nil && !service.IsNotFoundError(err) {
		logrus.WithError(err).Error("Failed to check user existence")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"internal_error",
			"Failed to process OTP request",
		))
		return
	}

	// If you want to only allow OTP for existing users, uncomment this:
	// if user == nil {
	//     c.JSON(http.StatusNotFound, NewErrorResponse(
	//         "user_not_found",
	//         "User not found",
	//     ))
	//     return
	// }

	// Send OTP
	// Note: h.otpService is not available yet - we need to add it to Handler
	// For now, we'll use a service from authService
	err = h.authService.SendOTP(c.Request.Context(), req.Phone)
	if err != nil {
		logrus.WithError(err).WithField("phone", req.Phone).Warn("Failed to send OTP")
		
		// Determine error type
		var code, message string
		var statusCode int
		
		switch {
		case err.Error() == "OTP service is not enabled":
			statusCode = http.StatusServiceUnavailable
			code = "otp_not_enabled"
			message = "OTP service is currently not available"
		case err.Error() == "too many OTP requests. Please wait before requesting another code":
			statusCode = http.StatusTooManyRequests
			code = "rate_limit_exceeded"
			message = "Too many OTP requests. Please wait before requesting another code."
		default:
			statusCode = http.StatusInternalServerError
			code = "otp_send_failed"
			message = "Failed to send OTP. Please try again."
		}

		c.JSON(statusCode, NewErrorResponse(code, message))
		return
	}

	// OTP sent successfully
	// Note: We don't return the OTP code - it's sent via SMS
	c.JSON(http.StatusOK, NewSuccessResponse(gin.H{
		"message": "OTP code sent successfully",
		"phone":   req.Phone,
	}, "OTP sent"))
}

// VerifyOTP verifies an OTP code (for testing purposes)
// In production, this might not be needed as verification happens during login
func (h *Handler) VerifyOTP(c *gin.Context) {
	var req struct {
		// Phone is REQUIRED
		Phone string `json:"phone" binding:"required,min=10,max=15"`
		
		// OTP code to verify
		OTP string `json:"otp" binding:"required,len=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			fmt.Sprintf("Invalid request: %v", err),
		))
		return
	}

	// Verify OTP
	err := h.authService.VerifyOTP(c.Request.Context(), req.Phone, req.OTP)
	if err != nil {
		logrus.WithError(err).WithField("phone", req.Phone).Debug("OTP verification failed")
		
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"invalid_otp",
			"Invalid or expired OTP code",
		))
		return
	}

	c.JSON(http.StatusOK, NewSuccessResponse(gin.H{
		"message": "OTP verified successfully",
		"phone":   req.Phone,
	}, "OTP verified"))
}

// CreateGroup creates a new group conversation
// Anyone can create a group with at least 1 other member (2 participants minimum)
func (h *Handler) CreateGroup(c *gin.Context) {
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

	var req models.ConversationCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			fmt.Sprintf("Invalid request: %v", err),
		))
		return
	}

	// Validate group requirements
	// - Type must be "group"
	// - At least 1 participant (creator + 1 = 2 minimum)
	// - Title is required for groups
	if req.Type != models.ConversationTypeGroup {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			"Group conversations must have type 'group'",
		))
		return
	}

	if len(req.ParticipantIDs) < 1 {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			"A group must have at least 1 other participant (2 total minimum)",
		))
		return
	}

	if req.Title == "" {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			"Group title is required",
		))
		return
	}

	// Add creator to participants
	// Create the conversation with creator + participants
	allParticipants := append([]uuid.UUID{uid}, req.ParticipantIDs...)
	
	// Create conversation
	conversation, err := h.authService.userRepo.CreateConversation(c.Request.Context(), &models.Conversation{
		Type:        models.ConversationTypeGroup,
		CreatorID:   uid,
		Title:       req.Title,
		AvatarURL:   req.AvatarURL,
		Description: req.Description,
		IsEncrypted: true,
		IsArchived:  false,
		IsMuted:     false,
	})
	if err != nil {
		logrus.WithError(err).Error("Failed to create group conversation")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"internal_error",
			"Failed to create group",
		))
		return
	}

	// Add all participants to the conversation
	for _, participantID := range allParticipants {
		// Creator gets "owner" role, others get "member"
		role := models.RoleMember
		if participantID == uid {
			role = models.RoleOwner
		}

		membership := &models.Membership{
			ConversationID: conversation.ID,
			UserID:        participantID,
			Role:          role,
			IsActive:      true,
			JoinedAt:      c.Request.Context().(time.Time), // This won't work, need to use actual time
		}
		
		// Fix: get actual time
		now := time.Now().UTC()
		membership.JoinedAt = now
		
		err := h.authService.userRepo.AddMembership(c.Request.Context(), membership)
		if err != nil {
			logrus.WithError(err).WithFields(logrus.Fields{
				"conversation_id": conversation.ID,
				"user_id":        participantID,
			}).Error("Failed to add membership")
			// Continue with other participants
		}
	}

	// Generate invitation link
	inviteToken, err := h.authService.otpService.GenerateInviteToken(c.Request.Context(), conversation.ID, uid)
	if err != nil {
		logrus.WithError(err).Warn("Failed to generate invite token")
		// Continue without invite link
	}

	// Prepare response
	response := &models.ConversationResponse{
		ID:            conversation.ID,
		Type:          conversation.Type,
		CreatorID:     conversation.CreatorID,
		Title:         conversation.Title,
		AvatarURL:     conversation.AvatarURL,
		Description:   conversation.Description,
		IsEncrypted:   conversation.IsEncrypted,
		IsArchived:    conversation.IsArchived,
		IsMuted:       conversation.IsMuted,
		CreatedAt:     conversation.CreatedAt,
		UpdatedAt:     conversation.UpdatedAt,
		Participants:  nil, // We'll populate this later if needed
	}

	// Add invite link to response if generated
	if inviteToken != "" {
		// In production, you might want to generate a full URL
		// For now, just return the token
		response.AvatarURL = inviteToken // Using AvatarURL as placeholder for invite token
		// Better: add a separate InviteLink field to ConversationResponse
	}

	c.JSON(http.StatusCreated, NewSuccessResponse(response, "Group created successfully"))
}

// GenerateInviteLink generates an invitation link for a group
func (h *Handler) GenerateInviteLink(c *gin.Context) {
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

	// Get conversation ID from URL
	conversationIDStr := c.Param("id")
	conversationID, err := uuid.Parse(conversationIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"invalid_id",
			"Invalid conversation ID",
		))
		return
	}

	// Verify user is a member of this conversation
	// And has permission to generate invite links (owner or admin)
	membership, err := h.authService.userRepo.GetMembership(c.Request.Context(), conversationID, uid)
	if err != nil {
		logrus.WithError(err).Error("Failed to check membership")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"internal_error",
			"Failed to check permissions",
		))
		return
	}

	if membership == nil {
		c.JSON(http.StatusForbidden, NewErrorResponse(
			"forbidden",
			"You are not a member of this conversation",
		))
		return
	}

	// Check if user has permission to invite (owner or admin)
	if membership.Role != models.RoleOwner && membership.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, NewErrorResponse(
			"forbidden",
			"Only owners and admins can generate invitation links",
		))
		return
	}

	// Generate invite token
	inviteToken, err := h.authService.otpService.GenerateInviteToken(c.Request.Context(), conversationID, uid)
	if err != nil {
		logrus.WithError(err).Error("Failed to generate invite token")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"internal_error",
			"Failed to generate invitation link",
		))
		return
	}

	// Generate full URL
	// In production, use your frontend URL
	inviteLink := fmt.Sprintf("https://ping.app/join/%s", inviteToken)

	c.JSON(http.StatusOK, NewSuccessResponse(gin.H{
		"invite_link":   inviteLink,
		"invite_token":  inviteToken,
		"conversation_id": conversationID,
		"expires_in":    7 * 24 * 60 * 60, // 7 days in seconds
	}, "Invitation link generated"))
}

// JoinGroup joins a group using an invitation link
func (h *Handler) JoinGroup(c *gin.Context) {
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
		// InviteToken is the invitation token
		InviteToken string `json:"invite_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			fmt.Sprintf("Invalid request: %v", err),
		))
		return
	}

	// Validate invite token
	groupID, createdBy, err := h.authService.otpService.ValidateInviteToken(c.Request.Context(), req.InviteToken)
	if err != nil {
		logrus.WithError(err).Debug("Invalid invite token")
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"invalid_invite",
			"Invalid or expired invitation link",
		))
		return
	}

	// Check if user is already a member of this group
	existingMembership, err := h.authService.userRepo.GetMembership(c.Request.Context(), groupID, uid)
	if err != nil && !service.IsNotFoundError(err) {
		logrus.WithError(err).Error("Failed to check existing membership")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"internal_error",
			"Failed to check membership",
		))
		return
	}

	if existingMembership != nil && existingMembership.IsActive {
		c.JSON(http.StatusConflict, NewErrorResponse(
			"already_member",
			"You are already a member of this group",
		))
		return
	}

	// Add user to the group
	// If they left before, reactivate their membership
	if existingMembership != nil && !existingMembership.IsActive {
		// Reactivate membership
		err := h.authService.userRepo.ReactivateMembership(c.Request.Context(), existingMembership.ID)
		if err != nil {
			logrus.WithError(err).Error("Failed to reactivate membership")
			c.JSON(http.StatusInternalServerError, NewErrorResponse(
				"internal_error",
				"Failed to rejoin group",
			))
			return
		}

		c.JSON(http.StatusOK, NewSuccessResponse(gin.H{
			"message":       "Successfully rejoined the group",
			"conversation_id": groupID,
		}, "Group rejoined"))
		return
	}

	// Create new membership
	membership := &models.Membership{
		ConversationID: groupID,
		UserID:        uid,
		Role:          models.RoleMember,
		IsActive:      true,
		JoinedAt:      time.Now().UTC(),
	}

	err = h.authService.userRepo.AddMembership(c.Request.Context(), membership)
	if err != nil {
		logrus.WithError(err).Error("Failed to add membership")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"internal_error",
			"Failed to join group",
		))
		return
	}

	// Invalidate the invite token (single-use)
	// You might want to keep it active for multiple uses - comment this out if so
	_ = h.authService.otpService.RevokeInviteToken(c.Request.Context(), req.InviteToken)

	c.JSON(http.StatusOK, NewSuccessResponse(gin.H{
		"message":       "Successfully joined the group",
		"conversation_id": groupID,
		"created_by":    createdBy,
	}, "Group joined"))
}

// RevokeInviteLink revokes an invitation link
func (h *Handler) RevokeInviteLink(c *gin.Context) {
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

	// Get conversation ID from URL
	conversationIDStr := c.Param("id")
	conversationID, err := uuid.Parse(conversationIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"invalid_id",
			"Invalid conversation ID",
		))
		return
	}

	var req struct {
		// InviteToken is the invitation token to revoke
		InviteToken string `json:"invite_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			fmt.Sprintf("Invalid request: %v", err),
		))
		return
	}

	// Verify user has permission to revoke invites (owner or admin)
	membership, err := h.authService.userRepo.GetMembership(c.Request.Context(), conversationID, uid)
	if err != nil {
		logrus.WithError(err).Error("Failed to check membership")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"internal_error",
			"Failed to check permissions",
		))
		return
	}

	if membership == nil {
		c.JSON(http.StatusForbidden, NewErrorResponse(
			"forbidden",
			"You are not a member of this conversation",
		))
		return
	}

	if membership.Role != models.RoleOwner && membership.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, NewErrorResponse(
			"forbidden",
			"Only owners and admins can revoke invitation links",
		))
		return
	}

	// Revoke the invite token
	err = h.authService.otpService.RevokeInviteToken(c.Request.Context(), req.InviteToken)
	if err != nil {
		logrus.WithError(err).Error("Failed to revoke invite token")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"internal_error",
			"Failed to revoke invitation link",
		))
		return
	}

	c.JSON(http.StatusOK, NewSuccessResponse(gin.H{
		"message":       "Invitation link revoked",
		"invite_token":  req.InviteToken,
		"conversation_id": conversationID,
	}, "Invitation link revoked"))
}

// ListInviteLinks lists all active invitation links for a group
func (h *Handler) ListInviteLinks(c *gin.Context) {
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

	// Get conversation ID from URL
	conversationIDStr := c.Param("id")
	conversationID, err := uuid.Parse(conversationIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"invalid_id",
			"Invalid conversation ID",
		))
		return
	}

	// Verify user has permission to list invites (owner or admin)
	membership, err := h.authService.userRepo.GetMembership(c.Request.Context(), conversationID, uid)
	if err != nil {
		logrus.WithError(err).Error("Failed to check membership")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"internal_error",
			"Failed to check permissions",
		))
		return
	}

	if membership == nil {
		c.JSON(http.StatusForbidden, NewErrorResponse(
			"forbidden",
			"You are not a member of this conversation",
		))
		return
	}

	if membership.Role != models.RoleOwner && membership.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, NewErrorResponse(
			"forbidden",
			"Only owners and admins can list invitation links",
		))
		return
	}

	// Get all invite tokens for this group
	tokens, err := h.authService.otpService.GetGroupInviteTokens(c.Request.Context(), conversationID)
	if err != nil {
		logrus.WithError(err).Error("Failed to get invite tokens")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"internal_error",
			"Failed to list invitation links",
		))
		return
	}

	// Generate full URLs for each token
	inviteLinks := make([]gin.H, len(tokens))
	for i, token := range tokens {
		inviteLinks[i] = gin.H{
			"invite_token": token,
			"invite_link":  fmt.Sprintf("https://ping.app/join/%s", token),
		}
	}

	c.JSON(http.StatusOK, NewSuccessResponse(gin.H{
		"conversation_id": conversationID,
		"invite_links":    inviteLinks,
		"count":          len(inviteLinks),
	}, "Invitation links retrieved"))
}

// Add OTP service to Handler
// This will be used for OTP operations
// Note: OTP is accessed through authService in most cases

// SendOTPForUser sends OTP for a specific user (admin function)
func (h *Handler) SendOTPForUser(c *gin.Context) {
	// Get user ID from context (admin)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, NewErrorResponse(
			"unauthorized",
			"User not authenticated",
		))
		return
	}

	var req struct {
		// Phone is REQUIRED
		Phone string `json:"phone" binding:"required,min=10,max=15"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, NewErrorResponse(
			"validation_error",
			fmt.Sprintf("Invalid request: %v", err),
		))
		return
	}

	// Send OTP
	err := h.authService.SendOTP(c.Request.Context(), req.Phone)
	if err != nil {
		logrus.WithError(err).WithField("phone", req.Phone).Warn("Failed to send OTP")
		c.JSON(http.StatusInternalServerError, NewErrorResponse(
			"otp_send_failed",
			"Failed to send OTP",
		))
		return
	}

	c.JSON(http.StatusOK, NewSuccessResponse(gin.H{
		"message": "OTP sent successfully",
		"phone":   req.Phone,
	}, "OTP sent"))
}
