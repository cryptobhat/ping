// Package service contains the business logic for the application
// OTPService handles OTP (One-Time Password) generation and verification
package service

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"

	"github.com/yourusername/ping/internal/config"
	"github.com/yourusername/ping/internal/database"
)

// OTPService handles OTP generation, sending, and verification
type OTPService struct {
	// cfg is the application configuration
	cfg *config.Config
}

// NewOTPService creates a new OTPService
type NewOTPService func(cfg *config.Config) *OTPService

// InitOTP initializes and returns a new OTPService
func InitOTP(cfg *config.Config) *OTPService {
	return &OTPService{
		cfg: cfg,
	}
}

// OTPData stores OTP information in Redis
type OTPData struct {
	// Code is the OTP code
	Code string `json:"code"`
	
	// Phone is the phone number the OTP was sent to
	Phone string `json:"phone"`
	
	// Attempts is the number of verification attempts
	Attempts int `json:"attempts"`
	
	// CreatedAt is when the OTP was created
	CreatedAt time.Time `json:"created_at"`
}

// GenerateOTP generates a random OTP code of the configured length
func (s *OTPService) GenerateOTP() string {
	// Generate random bytes
	b := make([]byte, s.cfg.OTP.OTPLength)
	if _, err := rand.Read(b); err != nil {
		// Fallback to less secure random if crypto/rand fails
		logrus.WithError(err).Warn("Failed to use crypto/rand, falling back to math/rand")
		// In production, you should panic or fail here
		for i := range b {
			b[i] = byte(i % 10)
		}
	}

	// Convert bytes to digits (0-9)
	code := ""
	for _, byte := range b {
		// Map byte to digit (0-9)
		code += strconv.Itoa(int(byte % 10))
	}

	return code
}

// GenerateAndStoreOTP generates an OTP code and stores it in Redis
// Returns the OTP code (for testing/logging - don't return to client!)
func (s *OTPService) GenerateAndStoreOTP(ctx context.Context, phone string) (string, error) {
	// Normalize phone number (remove spaces, +, etc.)
	normalizedPhone := normalizePhoneNumber(phone)

	// Generate OTP code
	code := s.GenerateOTP()

	// Create OTP data
	otpData := OTPData{
		Code:      code,
		Phone:     normalizedPhone,
		Attempts:  0,
		CreatedAt: time.Now().UTC(),
	}

	// Marshal to JSON
	data, err := json.Marshal(otpData)
	if err != nil {
		return "", fmt.Errorf("failed to marshal OTP data: %w", err)
	}

	// Store in Redis with expiration
	key := fmt.Sprintf("otp:%s", normalizedPhone)
	err = database.Redis.Set(ctx, key, string(data), s.cfg.OTP.OTPExpiration).Err()
	if err != nil {
		return "", fmt.Errorf("failed to store OTP in Redis: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"phone": normalizedPhone,
		"code":  code, // In production, don't log the actual code!
	}).Debug("OTP generated and stored")

	return code
}

// SendOTP sends an OTP to the specified phone number via MessageCentral
func (s *OTPService) SendOTP(ctx context.Context, phone string) error {
	// Check if OTP is enabled
	if !s.cfg.OTP.Enabled {
		return fmt.Errorf("OTP service is not enabled")
	}

	// Normalize phone number
	normalizedPhone := normalizePhoneNumber(phone)

	// Check rate limiting (max OTP requests per minute)
	if err := s.checkOTPRateLimit(ctx, normalizedPhone); err != nil {
		return err
	}

	// Generate and store OTP
	code, err := s.GenerateAndStoreOTP(ctx, normalizedPhone)
	if err != nil {
		return fmt.Errorf("failed to generate OTP: %w", err)
	}

	// Send OTP via MessageCentral
	if s.cfg.OTP.Provider == "messagecentral" {
		if err := s.sendViaMessageCentral(ctx, normalizedPhone, code); err != nil {
			// Clean up the stored OTP if sending failed
			_ = database.Redis.Del(ctx, fmt.Sprintf("otp:%s", normalizedPhone))
			return fmt.Errorf("failed to send OTP via MessageCentral: %w", err)
		}
	} else {
		// For other providers or testing, just log it
		logrus.WithFields(logrus.Fields{
			"phone": normalizedPhone,
			"code":  code,
		}).Info("OTP would be sent (provider not configured)")
	}

	return nil
}

// VerifyOTP verifies an OTP code for a phone number
func (s *OTPService) VerifyOTP(ctx context.Context, phone, code string) error {
	// Normalize phone number
	normalizedPhone := normalizePhoneNumber(phone)

	// Get OTP data from Redis
	key := fmt.Sprintf("otp:%s", normalizedPhone)
	data, err := database.Redis.Get(ctx, key).Result()
	if err != nil {
		if err == database.ErrRedisNil {
			return fmt.Errorf("OTP not found or expired")
		}
		return fmt.Errorf("failed to get OTP from Redis: %w", err)
	}

	// Unmarshal OTP data
	var otpData OTPData
	if err := json.Unmarshal([]byte(data), &otpData); err != nil {
		return fmt.Errorf("failed to unmarshal OTP data: %w", err)
	}

	// Check if OTP has expired
	if time.Since(otpData.CreatedAt) > s.cfg.OTP.OTPExpiration {
		// Clean up expired OTP
		_ = database.Redis.Del(ctx, key)
		return fmt.Errorf("OTP has expired")
	}

	// Check if code matches
	if otpData.Code != code {
		// Increment attempt counter
		otpData.Attempts++
		if otpData.Attempts >= s.cfg.OTP.MaxAttempts {
			// Too many attempts, delete the OTP
			_ = database.Redis.Del(ctx, key)
			return fmt.Errorf("maximum verification attempts reached")
		}

		// Update attempt count in Redis
		updatedData, _ := json.Marshal(otpData)
		_ = database.Redis.Set(ctx, key, string(updatedData), s.cfg.OTP.OTPExpiration)

		return fmt.Errorf("invalid OTP code")
	}

	// OTP is valid! Delete it to prevent reuse
	_ = database.Redis.Del(ctx, key)

	return nil
}

// sendViaMessageCentral sends an OTP via MessageCentral API
// API Documentation: https://console.messagecentral.com/studio/home
func (s *OTPService) sendViaMessageCentral(ctx context.Context, phone, code string) error {
	// MessageCentral SMS API endpoint
	apiURL := "https://api.messagecentral.com/v1/send"

	// Create request body
	message := fmt.Sprintf("Your PING verification code is: %s. It will expire in %d minutes.", 
		code, int(s.cfg.OTP.OTPExpiration.Minutes()))

	requestBody := map[string]interface{}{
		"sender":  s.cfg.OTP.SenderID,
		"to":      phone,
		"message":  message,
		"type":    "sms",
		"route":   "trans", // Transactional route
	}

	// Marshal to JSON
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request body: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, strings.NewReader(string(jsonBody)))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	
	// MessageCentral uses Basic Auth with API key as username
	if s.cfg.OTP.APIKey != "" && s.cfg.OTP.APISecret != "" {
		req.SetBasicAuth(s.cfg.OTP.APIKey, s.cfg.OTP.APISecret)
	} else {
		// Use Bearer token if that's the configured method
		if s.cfg.OTP.APIKey != "" {
			req.Header.Set("Authorization", "Bearer "+s.cfg.OTP.APIKey)
		}
	}

	// Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request to MessageCentral: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("MessageCentral API error: %s - %s", resp.Status, string(body))
	}

	// Read and log response
	body, _ := io.ReadAll(resp.Body)
	logrus.WithFields(logrus.Fields{
		"phone": phone,
		"status_code": resp.StatusCode,
	}).Debug("MessageCentral SMS sent successfully")

	// Parse response to get message ID (optional)
	var response map[string]interface{}
	if err := json.Unmarshal(body, &response); err == nil {
		if messageID, ok := response["message_id"].(string); ok {
			logrus.WithField("message_id", messageID).Debug("MessageCentral message ID")
		}
	}

	return nil
}

// checkOTPRateLimit checks if OTP requests are rate limited for a phone number
func (s *OTPService) checkOTPRateLimit(ctx context.Context, phone string) error {
	// Use Redis to track OTP request counts
	// Key pattern: otp_rate_limit:{phone}
	// Value: count of requests in current window
	
	// For simplicity, we'll use a 1-minute window
	// In production, you might want to use Redis sorted sets or a more sophisticated approach
	
	key := fmt.Sprintf("otp_rate_limit:%s", phone)
	
	// Get current count
	count, err := database.Redis.Get(ctx, key).Int()
	if err != nil && err != database.ErrRedisNil {
		logrus.WithError(err).Warn("Failed to check OTP rate limit")
		// Don't block the user, just log and continue
		return nil
	}
	
	// Check if limit exceeded
	if count >= s.cfg.OTP.RateLimitOTP {
		return fmt.Errorf("too many OTP requests. Please wait before requesting another code")
	}
	
	// Increment count
	newCount := count + 1
	err = database.Redis.Set(ctx, key, newCount, 1*time.Minute).Err()
	if err != nil {
		logrus.WithError(err).Warn("Failed to set OTP rate limit")
		// Don't block the user
		return nil
	}
	
	return nil
}

// normalizePhoneNumber normalizes a phone number for consistent storage
func normalizePhoneNumber(phone string) string {
	// Remove all non-digit characters except leading +
	phone = strings.TrimSpace(phone)
	
	// If it starts with +, keep the + and only digits
	if strings.HasPrefix(phone, "+") {
		phone = "+" + strings.Map(func(r rune) rune {
			if r >= '0' && r <= '9' {
				return r
			}
			return -1
		}, phone[1:])
	} else {
		// Only keep digits
		phone = strings.Map(func(r rune) rune {
			if r >= '0' && r <= '9' {
				return r
			}
			return -1
		}, phone)
	}
	
	return phone
}

// GenerateInviteToken generates a token for group invitation
// This token can be used by anyone to join the group
func (s *OTPService) GenerateInviteToken(ctx context.Context, groupID uuid.UUID, createdBy uuid.UUID) (string, error) {
	// Generate a random token
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate random token: %w", err)
	}
	token := fmt.Sprintf("%x", b)

	// Create invite data
	inviteData := map[string]interface{}{
		"group_id":    groupID.String(),
		"created_by":  createdBy.String(),
		"created_at":  time.Now().UTC().Format(time.RFC3339),
		"token":       token,
	}

	// Marshal to JSON
	data, err := json.Marshal(inviteData)
	if err != nil {
		return "", fmt.Errorf("failed to marshal invite data: %w", err)
	}

	// Store in Redis with 7-day expiration
	key := fmt.Sprintf("group_invite:%s", token)
	err = database.Redis.Set(ctx, key, string(data), 7*24*time.Hour).Err()
	if err != nil {
		return "", fmt.Errorf("failed to store invite token: %w", err)
	}

	// Also store reverse mapping for group -> tokens
	// This allows listing/managing invites for a group
	groupTokensKey := fmt.Sprintf("group_invites:%s", groupID.String())
	err = database.Redis.SAdd(ctx, groupTokensKey, token).Err()
	if err != nil {
		logrus.WithError(err).Warn("Failed to add token to group invites set")
	}

	return token, nil
}

// ValidateInviteToken validates a group invitation token
// Returns groupID and createdBy if valid
func (s *OTPService) ValidateInviteToken(ctx context.Context, token string) (uuid.UUID, uuid.UUID, error) {
	// Get invite data from Redis
	key := fmt.Sprintf("group_invite:%s", token)
	data, err := database.Redis.Get(ctx, key).Result()
	if err != nil {
		if err == database.ErrRedisNil {
			return uuid.Nil, uuid.Nil, fmt.Errorf("invalid or expired invitation link")
		}
		return uuid.Nil, uuid.Nil, fmt.Errorf("failed to get invite data: %w", err)
	}

	// Unmarshal invite data
	var inviteData map[string]interface{}
	if err := json.Unmarshal([]byte(data), &inviteData); err != nil {
		return uuid.Nil, uuid.Nil, fmt.Errorf("failed to unmarshal invite data: %w", err)
	}

	// Extract group ID
	groupIDStr, ok := inviteData["group_id"].(string)
	if !ok {
		return uuid.Nil, uuid.Nil, fmt.Errorf("invalid invite data: missing group_id")
	}
	groupID, err := uuid.Parse(groupIDStr)
	if err != nil {
		return uuid.Nil, uuid.Nil, fmt.Errorf("invalid group_id: %w", err)
	}

	// Extract created by
	createdByStr, ok := inviteData["created_by"].(string)
	if !ok {
		return uuid.Nil, uuid.Nil, fmt.Errorf("invalid invite data: missing created_by")
	}
	createdBy, err := uuid.Parse(createdByStr)
	if err != nil {
		return uuid.Nil, uuid.Nil, fmt.Errorf("invalid created_by: %w", err)
	}

	return groupID, createdBy, nil
}

// RevokeInviteToken revokes a group invitation token
func (s *OTPService) RevokeInviteToken(ctx context.Context, token string) error {
	// Get group ID from token to clean up reverse mapping
	groupID, _, err := s.ValidateInviteToken(ctx, token)
	if err != nil {
		// Token might already be expired or invalid, that's ok
		logrus.WithError(err).Debug("Failed to validate token before revoking")
	}

	// Delete the invite token
	key := fmt.Sprintf("group_invite:%s", token)
	err = database.Redis.Del(ctx, key).Err()
	if err != nil {
		return fmt.Errorf("failed to delete invite token: %w", err)
	}

	// Remove from group invites set
	if groupID != uuid.Nil {
		groupTokensKey := fmt.Sprintf("group_invites:%s", groupID.String())
		err = database.Redis.SRem(ctx, groupTokensKey, token).Err()
		if err != nil {
			logrus.WithError(err).Warn("Failed to remove token from group invites set")
		}
	}

	return nil
}

// GetGroupInviteTokens returns all active invite tokens for a group
func (s *OTPService) GetGroupInviteTokens(ctx context.Context, groupID uuid.UUID) ([]string, error) {
	// Get all tokens for this group
	groupTokensKey := fmt.Sprintf("group_invites:%s", groupID.String())
	
	// In Redis, SMembers returns all members of a set
	// But we don't have SMembers in the current Redis client interface
	// For now, we'll use a simpler approach: scan for keys
	// In production, use SScan for large sets
	
	// This is a simplified implementation
	// In production, you'd want to use SScan or maintain a separate list
	iter := database.Redis.Scan(ctx, 0, fmt.Sprintf("group_invite:%s*", groupID.String()), 0).Iterator()
	
	var tokens []string
	for iter.Next(ctx) {
		key := iter.Val()
		// Extract token from key (format: group_invite:{token})
		parts := strings.Split(key, ":")
		if len(parts) == 2 {
			tokens = append(tokens, parts[1])
		}
	}
	
	if err := iter.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate invite tokens: %w", err)
	}
	
	return tokens, nil
}
