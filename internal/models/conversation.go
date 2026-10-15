// Package models defines the core data structures for the application
// Conversation models handle group chats and 1-to-1 conversations
package models

import (
	"time"

	"github.com/google/uuid"
)

// ConversationType defines the type of conversation
type ConversationType string

const (
	// ConversationTypeDirect is a 1-to-1 conversation between two users
	ConversationTypeDirect ConversationType = "direct"

	// ConversationTypeGroup is a group conversation with multiple participants
	ConversationTypeGroup ConversationType = "group"
)

// Conversation represents a chat conversation (1-to-1 or group)
type Conversation struct {
	// ID is the unique identifier for the conversation
	// For direct conversations, this can be derived from participant IDs
	ID uuid.UUID `json:"id" db:"id"`

	// Type indicates if this is a direct or group conversation
	Type ConversationType `json:"type" db:"type"`

	// CreatorID is the user who created the conversation
	// For direct conversations, this is one of the participants
	CreatorID uuid.UUID `json:"creator_id" db:"creator_id"`

	// Title is the name of the conversation (mainly for groups)
	// For direct conversations, this can be the other user's name
	Title string `json:"title,omitempty" db:"title"`

	// AvatarURL is the conversation avatar (for groups)
	AvatarURL string `json:"avatar_url,omitempty" db:"avatar_url"`

	// Description is an optional description for group conversations
	Description string `json:"description,omitempty" db:"description"`

	// IsEncrypted indicates if messages in this conversation are encrypted
	// In our system, this should always be true
	IsEncrypted bool `json:"is_encrypted" db:"is_encrypted"`

	// IsArchived indicates if the conversation is archived
	IsArchived bool `json:"is_archived" db:"is_archived"`

	// IsMuted indicates if notifications are muted for this conversation
	IsMuted bool `json:"is_muted" db:"is_muted"`

	// MutedUntil is when the mute expires (if IsMuted is true)
	MutedUntil *time.Time `json:"muted_until,omitempty" db:"muted_until"`

	// CreatedAt is when the conversation was created
	CreatedAt time.Time `json:"created_at" db:"created_at"`

	// UpdatedAt is when the conversation was last updated
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	// LastMessageAt is when the last message was sent
	LastMessageAt *time.Time `json:"last_message_at,omitempty" db:"last_message_at"`

	// LastMessageID is the ID of the last message
	LastMessageID *uuid.UUID `json:"last_message_id,omitempty" db:"last_message_id"`
}

// ConversationCreateRequest is the request body for creating a new conversation
type ConversationCreateRequest struct {
	// Type of conversation (direct or group)
	Type ConversationType `json:"type" binding:"required"`

	// ParticipantIDs are the user IDs to include in the conversation
	// For direct: exactly 2 participants (creator + 1 other)
	// For group: 2 or more participants
	ParticipantIDs []uuid.UUID `json:"participant_ids" binding:"required,min=1"`

	// Title is required for group conversations
	Title string `json:"title,omitempty" binding:"omitempty,min=1,max=100"`

	// AvatarURL is optional
	AvatarURL string `json:"avatar_url,omitempty"`

	// Description is optional
	Description string `json:"description,omitempty" binding:"omitempty,max=500"`
}

// ConversationResponse is the response when returning conversation information
type ConversationResponse struct {
	ID            uuid.UUID         `json:"id"`
	Type          ConversationType `json:"type"`
	CreatorID     uuid.UUID         `json:"creator_id"`
	Title         string             `json:"title,omitempty"`
	AvatarURL     string             `json:"avatar_url,omitempty"`
	Description   string             `json:"description,omitempty"`
	IsEncrypted   bool               `json:"is_encrypted"`
	IsArchived    bool               `json:"is_archived"`
	IsMuted       bool               `json:"is_muted"`
	MutedUntil    *time.Time         `json:"muted_until,omitempty"`
	CreatedAt     time.Time          `json:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at"`
	LastMessageAt *time.Time         `json:"last_message_at,omitempty"`
	LastMessageID *uuid.UUID         `json:"last_message_id,omitempty"`
	Participants  []UserResponse     `json:"participants,omitempty"`
}

// ConversationListResponse is a simplified response for listing conversations
type ConversationListResponse struct {
	ID            uuid.UUID         `json:"id"`
	Type          ConversationType `json:"type"`
	Title         string             `json:"title"`
	AvatarURL     string             `json:"avatar_url,omitempty"`
	IsArchived    bool               `json:"is_archived"`
	IsMuted       bool               `json:"is_muted"`
	LastMessageAt *time.Time         `json:"last_message_at,omitempty"`
	LastMessage   string             `json:"last_message,omitempty"`
	UnreadCount   int                `json:"unread_count"`
}

// Membership represents a user's participation in a conversation
type Membership struct {
	// ID is the unique identifier for the membership
	ID uuid.UUID `json:"id" db:"id"`

	// ConversationID is the conversation the user is part of
	ConversationID uuid.UUID `json:"conversation_id" db:"conversation_id"`

	// UserID is the user who is part of the conversation
	UserID uuid.UUID `json:"user_id" db:"user_id"`

	// DeviceID is the specific device of the user (optional, can be null for all devices)
	DeviceID *uuid.UUID `json:"device_id,omitempty" db:"device_id"`

	// Role indicates the user's permissions in the conversation
	Role MembershipRole `json:"role" db:"role"`

	// JoinedAt is when the user joined the conversation
	JoinedAt time.Time `json:"joined_at" db:"joined_at"`

	// LeftAt is when the user left (if they are no longer a member)
	LeftAt *time.Time `json:"left_at,omitempty" db:"left_at"`

	// IsActive indicates if the membership is currently active
	IsActive bool `json:"is_active" db:"is_active"`
}

// MembershipRole defines the role of a participant in a conversation
type MembershipRole string

const (
	// RoleMember is a regular participant
	RoleMember MembershipRole = "member"

	// RoleAdmin can manage conversation settings and members
	RoleAdmin MembershipRole = "admin"

	// RoleOwner is the creator of the conversation (special admin)
	RoleOwner MembershipRole = "owner"
)

// MembershipResponse is the response when returning membership information
type MembershipResponse struct {
	ID            uuid.UUID      `json:"id"`
	ConversationID uuid.UUID      `json:"conversation_id"`
	UserID        uuid.UUID      `json:"user_id"`
	DeviceID      *uuid.UUID     `json:"device_id,omitempty"`
	Role          MembershipRole `json:"role"`
	JoinedAt      time.Time      `json:"joined_at"`
	LeftAt        *time.Time     `json:"left_at,omitempty"`
	IsActive      bool           `json:"is_active"`
	User          *UserResponse  `json:"user,omitempty"`
}
