// Package models defines the core data structures for the application
// All database records and API request/response types are defined here
package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user account in the system
// Each user has a unique ID and can have multiple devices
// Phone number is the primary identifier (like WhatsApp)
type User struct {
	// ID is the unique identifier for the user
	// This is a UUIDv7 (time-sortable) for better database performance
	ID uuid.UUID `json:"id" db:"id"`

	// Phone is the unique identifier for the user (REQUIRED)
	// This is the primary way users are identified
	Phone string `json:"phone" db:"phone"`

	// DisplayName is the name shown to other users
	// This can be set after registration and changed anytime
	DisplayName string `json:"display_name" db:"display_name"`

	// Username is optional - can be set for convenience
	// Not used for authentication, only for display
	Username string `json:"username,omitempty" db:"username"`

	// Email is optional and used for account recovery
	Email string `json:"email,omitempty" db:"email"`

	// PasswordHash stores the hashed password (never plaintext)
	PasswordHash string `json:"-" db:"password_hash"`

	// Salt is used in password hashing
	Salt string `json:"-" db:"salt"`

	// AvatarURL points to the user's profile picture
	// Stored in encrypted object storage
	AvatarURL string `json:"avatar_url,omitempty" db:"avatar_url"`

	// Status is a short text the user can set (like "Hey there!")
	Status string `json:"status,omitempty" db:"status"`

	// IsActive indicates if the account is active
	IsActive bool `json:"is_active" db:"is_active"`

	// CreatedAt is when the user account was created
	CreatedAt time.Time `json:"created_at" db:"created_at"`

	// UpdatedAt is when the user account was last updated
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	// LastSeenAt is when the user was last active
	// This can be hidden by user privacy settings
	LastSeenAt *time.Time `json:"last_seen_at,omitempty" db:"last_seen_at"`
}

// UserCreateRequest is the request body for creating a new user
// Phone number is REQUIRED (like WhatsApp)
type UserCreateRequest struct {
	// Phone is REQUIRED and must be unique
	// This is the primary identifier for the user
	Phone string `json:"phone" binding:"required,min=10,max=15"`

	// DisplayName is the user's visible name (optional, can be set later)
	DisplayName string `json:"display_name,omitempty" binding:"omitempty,min=1,max=100"`

	// Username is optional - for display purposes only
	Username string `json:"username,omitempty" binding:"omitempty,min=3,max=32"`

	// Email is optional - for account recovery
	Email string `json:"email,omitempty" binding:"omitempty,email"`

	// AvatarURL is optional - profile picture
	AvatarURL string `json:"avatar_url,omitempty"`

	// Password is optional - can use OTP instead
	// If provided, will be used for password-based auth
	Password string `json:"password,omitempty" binding:"omitempty,min=8"`
}

// UserLoginRequest is the request body for user login
// Phone number is the identifier (like WhatsApp)
type UserLoginRequest struct {
	// Phone is REQUIRED for login
	Phone string `json:"phone" binding:"required,min=10,max=15"`

	// Password for authentication (optional if using OTP)
	Password string `json:"password,omitempty" binding:"omitempty,min=8"`

	// OTP code for phone verification (optional if using password)
	OTP string `json:"otp,omitempty" binding:"omitempty,len=6"`
}

// UserResponse is the response when returning user information
// This excludes sensitive fields like password hash
type UserResponse struct {
	ID          uuid.UUID  `json:"id"`
	Username    string     `json:"username"`
	DisplayName string     `json:"display_name"`
	Email       string     `json:"email,omitempty"`
	Phone       string     `json:"phone,omitempty"`
	AvatarURL   string     `json:"avatar_url,omitempty"`
	Status      string     `json:"status,omitempty"`
	IsActive    bool       `json:"is_active"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	LastSeenAt  *time.Time `json:"last_seen_at,omitempty"`
}

// UserUpdateRequest is the request body for updating user profile
type UserUpdateRequest struct {
	// DisplayName can be updated anytime
	DisplayName string `json:"display_name,omitempty" binding:"omitempty,min=1,max=100"`

	// AvatarURL can be updated anytime (profile photo)
	AvatarURL string `json:"avatar_url,omitempty"`

	// Status can be updated anytime
	Status string `json:"status,omitempty" binding:"omitempty,max=200"`

	// Email is optional
	Email string `json:"email,omitempty" binding:"omitempty,email"`

	// Note: Phone cannot be changed (primary identifier)
}
