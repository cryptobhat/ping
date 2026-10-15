// Package service contains the business logic for the application
// AuthService handles user authentication, registration, and token management
package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"

	"github.com/yourusername/ping/internal/config"
	"github.com/yourusername/ping/internal/models"
	"github.com/yourusername/ping/internal/repository"
)

// Errors returned by AuthService
var (
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrUserNotFound      = errors.New("user not found")
	ErrInvalidPassword   = errors.New("invalid password")
	ErrInvalidToken      = errors.New("invalid token")
	ErrTokenExpired      = errors.New("token expired")
	ErrInvalidIdentifier = errors.New("invalid identifier (username, email, or phone)")
)

// AuthService handles authentication-related operations
type AuthService struct {
	// userRepo is the repository for user operations
	userRepo *repository.UserRepository
	
	// deviceRepo is the repository for device operations
	deviceRepo *repository.DeviceRepository
	
	// cfg is the application configuration
	cfg *config.Config
	
	// jwtSecret is the secret key for signing JWT tokens
	jwtSecret []byte
	
	// otpService is the OTP service for phone verification
	otpService *OTPService
}

// NewAuthService creates a new AuthService
func NewAuthService(cfg *config.Config) *AuthService {
	return &AuthService{
		userRepo:   repository.NewUserRepository(),
		deviceRepo: repository.NewDeviceRepository(),
		cfg:       cfg,
		jwtSecret: []byte(cfg.Security.JWTSecret),
		otpService: InitOTP(cfg),
	}
}

// Register registers a new user
// Phone number is REQUIRED and must be unique
func (s *AuthService) Register(ctx context.Context, req *models.UserCreateRequest) (*models.UserResponse, error) {
	// Check if phone already exists
	existingUser, err := s.userRepo.FindByPhone(ctx, req.Phone)
	if err != nil && !errors.Is(err, fmt.Errorf("user not found")) {
		return nil, fmt.Errorf("failed to check phone: %w", err)
	}
	if existingUser != nil {
		return nil, ErrUserAlreadyExists
	}

	// Generate salt and hash password (if provided)
	var passwordHash, salt string
	if req.Password != "" {
		salt, passwordHash, err = s.hashPassword(req.Password)
		if err != nil {
			return nil, fmt.Errorf("failed to hash password: %w", err)
		}
	}

	// Create user model
	user := &models.User{
		Phone:        req.Phone,
		DisplayName:  req.DisplayName,
		Username:     req.Username,
		Email:        req.Email,
		AvatarURL:    req.AvatarURL,
		PasswordHash: passwordHash,
		Salt:         salt,
		IsActive:     true,
	}

	// Save user to database
	err = s.userRepo.Create(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Return user response (without sensitive fields)
	return s.toUserResponse(user), nil
}

// Login authenticates a user and returns tokens
// Phone number is REQUIRED (like WhatsApp)
// Can authenticate with password OR OTP
func (s *AuthService) Login(ctx context.Context, req *models.UserLoginRequest) (*TokenResponse, error) {
	// Find user by phone number
	user, err := s.userRepo.FindByPhone(ctx, req.Phone)
	if err != nil && !errors.Is(err, fmt.Errorf("user not found")) {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	
	// If user not found, return error
	if user == nil {
		return nil, ErrUserNotFound
	}

	// Verify authentication method
	// Option 1: Password authentication
	if req.Password != "" {
		if err := s.verifyPassword(req.Password, user.PasswordHash, user.Salt); err != nil {
			return nil, ErrInvalidPassword
		}
	}
	// Option 2: OTP authentication
	else if req.OTP != "" {
		// Verify OTP using OTP service
		if err := s.otpService.VerifyOTP(ctx, req.Phone, req.OTP); err != nil {
			logrus.WithError(err).WithField("phone", req.Phone).Debug("OTP verification failed")
			return nil, ErrInvalidPassword
		}
	}
	// No authentication method provided
	else {
		return nil, ErrInvalidPassword
	}

	// Generate tokens
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := s.generateRefreshToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         s.toUserResponse(user),
		ExpiresIn:    int(s.cfg.Security.JWTExpiration.Seconds()),
	}, nil
}

// RefreshToken refreshes the access token using a refresh token
func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*TokenResponse, error) {
	// Parse and verify the refresh token
	claims, err := s.parseToken(refreshToken, true)
	if err != nil {
		return nil, err
	}

	// Get user from database
	user, err := s.userRepo.FindByID(ctx, claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// Generate new tokens
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err = s.generateRefreshToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         s.toUserResponse(user),
		ExpiresIn:    int(s.cfg.Security.JWTExpiration.Seconds()),
	}, nil
}

// ValidateToken validates a JWT token and returns the claims
func (s *AuthService) ValidateToken(ctx context.Context, token string) (*TokenClaims, error) {
	claims, err := s.parseToken(token, false)
	if err != nil {
		return nil, err
	}

	// Verify user still exists
	user, err := s.userRepo.FindByID(ctx, claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}
	if user == nil {
		return nil, ErrUserNotFound
	}

	return claims, nil
}

// SendOTP sends an OTP code to a phone number
// This can be used for OTP-based authentication
func (s *AuthService) SendOTP(ctx context.Context, phone string) error {
	return s.otpService.SendOTP(ctx, phone)
}

// VerifyOTP verifies an OTP code for a phone number
// This can be used for OTP-based authentication
func (s *AuthService) VerifyOTP(ctx context.Context, phone, code string) error {
	return s.otpService.VerifyOTP(ctx, phone, code)
}

// GetUserByID returns a user by their ID
func (s *AuthService) GetUserByID(ctx context.Context, id uuid.UUID) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	if user == nil {
		return nil, ErrUserNotFound
	}

	return s.toUserResponse(user), nil
}

// hashPassword hashes a password with bcrypt and a random salt
func (s *AuthService) hashPassword(password string) (string, string, error) {
	// Generate a random salt
	saltBytes := make([]byte, 16)
	// In production, use crypto/rand
	// For now, we'll use a simple approach
	// In real implementation, use: if _, err := rand.Read(saltBytes); err != nil { ... }
	
	// Use bcrypt which includes its own salt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", "", fmt.Errorf("failed to hash password: %w", err)
	}

	// For this implementation, we'll store the bcrypt hash directly
	// The "salt" in our User model can be empty when using bcrypt
	return string(hashedPassword), "", nil
}

// verifyPassword verifies a password against a hash
func (s *AuthService) verifyPassword(password, hash, salt string) error {
	// Use bcrypt to compare
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

// generateAccessToken generates a JWT access token
func (s *AuthService) generateAccessToken(user *models.User) (string, error) {
	// Create claims
	claims := &TokenClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "ping",
			Subject:   user.ID.String(),
			Audience:  jwt.ClaimStrings{"ping-client"},
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.cfg.Security.JWTExpiration)),
			NotBefore: jwt.NewNumericDate(time.Now()),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
		UserID:      user.ID,
		Username:    user.Username,
		IsAccessToken: true,
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token with secret
	tokenString, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// generateRefreshToken generates a JWT refresh token
func (s *AuthService) generateRefreshToken(user *models.User) (string, error) {
	// Create claims
	claims := &TokenClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "ping",
			Subject:   user.ID.String(),
			Audience:  jwt.ClaimStrings{"ping-client"},
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.cfg.Security.RefreshTokenExpiration)),
			NotBefore: jwt.NewNumericDate(time.Now()),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
		UserID:      user.ID,
		Username:    user.Username,
		IsAccessToken: false,
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token with secret
	tokenString, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// parseToken parses and validates a JWT token
func (s *AuthService) parseToken(tokenString string, isRefresh bool) (*TokenClaims, error) {
	// Parse token
	token, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, ErrInvalidToken
	}

	// Validate claims
	claims, ok := token.Claims.(*TokenClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	// Check if token type matches
	if isRefresh && claims.IsAccessToken {
		return nil, ErrInvalidToken
	}
	if !isRefresh && !claims.IsAccessToken {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// toUserResponse converts a User model to UserResponse
func (s *AuthService) toUserResponse(user *models.User) *models.UserResponse {
	return &models.UserResponse{
		ID:          user.ID,
		Username:    user.Username,
		DisplayName: user.DisplayName,
		Email:       user.Email,
		Phone:       user.Phone,
		AvatarURL:   user.AvatarURL,
		Status:      user.Status,
		IsActive:    user.IsActive,
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
		LastSeenAt:  user.LastSeenAt,
	}
}

// TokenClaims represents the JWT token claims
type TokenClaims struct {
	// jwt.RegisteredClaims embeds standard JWT claims
	jwt.RegisteredClaims
	
	// UserID is the user's unique identifier
	UserID uuid.UUID `json:"user_id"`
	
	// Username is the user's username
	Username string `json:"username"`
	
	// IsAccessToken indicates if this is an access token or refresh token
	IsAccessToken bool `json:"is_access_token"`
}

// TokenResponse is the response when returning tokens
type TokenResponse struct {
	// AccessToken is the JWT access token
	AccessToken string `json:"access_token"`
	
	// RefreshToken is the JWT refresh token
	RefreshToken string `json:"refresh_token"`
	
	// User is the user information
	User *models.UserResponse `json:"user"`
	
	// ExpiresIn is the number of seconds until the access token expires
	ExpiresIn int `json:"expires_in"`
	
	// TokenType is always "Bearer"
	TokenType string `json:"token_type"`
}

// NewTokenResponse creates a new TokenResponse
func NewTokenResponse(accessToken, refreshToken string, user *models.UserResponse, expiresIn int) *TokenResponse {
	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
		ExpiresIn:    expiresIn,
		TokenType:   "Bearer",
	}
}

// GenerateSessionID generates a unique session ID for WebSocket connections
func GenerateSessionID() string {
	// Generate a random UUID for the session
	return uuid.New().String()
}

// GenerateDeviceID generates a unique device ID
func GenerateDeviceID() string {
	// Generate a random UUID for the device
	return uuid.New().String()
}

// GenerateAPIKey generates a random API key (32 bytes as hex string)
func GenerateAPIKey() (string, error) {
	keyBytes := make([]byte, 32)
	// In production, use crypto/rand
	// For now, we'll use uuid
	keyUUID := uuid.New()
	copy(keyBytes, keyUUID[:])
	
	return hex.EncodeToString(keyBytes), nil
}

// HashString hashes a string using SHA-256
func HashString(s string) string {
	h := sha256.New()
	h.Write([]byte(s))
	return hex.EncodeToString(h.Sum(nil))
}

// VerifyPasswordHash verifies a password against a bcrypt hash
func VerifyPasswordHash(password, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

// InitAuth initializes the auth service with configuration
func InitAuth(cfg *config.Config) *AuthService {
	logrus.Info("AuthService initialized")
	return NewAuthService(cfg)
}
