// Package models defines the core data structures for the application
// Message models handle encrypted message storage and delivery
package models

import (
	"time"

	"github.com/google/uuid"
)

// MessageStatus represents the delivery status of a message
type MessageStatus string

const (
	// MessageStatusSent means the message was sent by the sender
	MessageStatusSent MessageStatus = "sent"

	// MessageStatusDelivered means the message was received by the server
	MessageStatusDelivered MessageStatus = "delivered"

	// MessageStatusRead means the message was read by the recipient
	MessageStatusRead MessageStatus = "read"

	// MessageStatusFailed means the message failed to deliver
	MessageStatusFailed MessageStatus = "failed"
)

// MessageType represents the type of message content
type MessageType string

const (
	// MessageTypeText is a plain text message
	MessageTypeText MessageType = "text"

	// MessageTypeImage is an image message
	MessageTypeImage MessageType = "image"

	// MessageTypeVideo is a video message
	MessageTypeVideo MessageType = "video"

	// MessageTypeAudio is an audio/voice note message
	MessageTypeAudio MessageType = "audio"

	// MessageTypeVoiceNote is a voice note message (alias for audio)
	MessageTypeVoiceNote MessageType = "voice_note"

	// MessageTypeFile is a generic file message
	MessageTypeFile MessageType = "file"

	// MessageTypeSticker is a sticker message
	MessageTypeSticker MessageType = "sticker"

	// MessageTypeSystem is a system message (e.g., "user joined", "user left")
	MessageTypeSystem MessageType = "system"

	// MessageTypeLocation is a location message (current location)
	MessageTypeLocation MessageType = "location"

	// MessageTypeLiveLocation is a live location sharing message
	MessageTypeLiveLocation MessageType = "live_location"
)

// Message represents an encrypted message in the system
// IMPORTANT: The server NEVER sees the plaintext content
// Only encrypted ciphertext is stored and transmitted
type Message struct {
	// ID is the unique identifier for the message
	// This is a UUIDv7 for time-sortable ordering
	ID uuid.UUID `json:"id" db:"id"`

	// ConversationID is the conversation this message belongs to
	ConversationID uuid.UUID `json:"conversation_id" db:"conversation_id"`

	// SenderID is the user who sent the message
	SenderID uuid.UUID `json:"sender_id" db:"sender_id"`

	// SenderDeviceID is the specific device that sent the message
	SenderDeviceID uuid.UUID `json:"sender_device_id" db:"sender_device_id"`

	// Type indicates what kind of content this is (text, image, etc.)
	// This metadata is NOT encrypted so clients know how to handle the ciphertext
	Type MessageType `json:"type" db:"type"`

	// Content is the ENCRYPTED message content
	// This is ciphertext only - the server cannot read it
	// Format: Signal Protocol message ciphertext
	Content []byte `json:"content" db:"content"`

	// CiphertextType indicates the encryption scheme used
	// This helps clients know how to decrypt the content
	CiphertextType string `json:"ciphertext_type" db:"ciphertext_type"`

	// Status is the current delivery status of the message
	Status MessageStatus `json:"status" db:"status"`

	// Timestamp is when the message was sent (client-generated)
	// This is used for ordering and display
	Timestamp time.Time `json:"timestamp" db:"timestamp"`

	// ServerTimestamp is when the server received the message
	ServerTimestamp time.Time `json:"server_timestamp" db:"server_timestamp"`

	// IdempotencyKey is used to prevent duplicate messages
	// Client generates this to ensure retries don't create duplicates
	IdempotencyKey string `json:"idempotency_key" db:"idempotency_key"`

	// ReplyToMessageID is the ID of the message this is replying to (if any)
	ReplyToMessageID *uuid.UUID `json:"reply_to_message_id,omitempty" db:"reply_to_message_id"`

	// IsEdited indicates if the message has been edited
	IsEdited bool `json:"is_edited" db:"is_edited"`

	// EditedAt is when the message was last edited
	EditedAt *time.Time `json:"edited_at,omitempty" db:"edited_at"`

	// IsDeleted indicates if the message has been deleted
	IsDeleted bool `json:"is_deleted" db:"is_deleted"`

	// DeletedAt is when the message was deleted
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`

	// IsForwarded indicates if this message was forwarded from another conversation
	IsForwarded bool `json:"is_forwarded" db:"is_forwarded"`

	// CreatedAt is when the message record was created in the database
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// MessageCreateRequest is the request body for sending a new message
// The client encrypts the content before sending it to the server
type MessageCreateRequest struct {
	// ConversationID is the conversation to send the message to
	ConversationID uuid.UUID `json:"conversation_id" binding:"required"`

	// Type of message (text, image, etc.)
	Type MessageType `json:"type" binding:"required"`

	// Content is the ENCRYPTED message content
	// The client must encrypt this using Signal Protocol before sending
	Content []byte `json:"content" binding:"required"`

	// CiphertextType indicates the encryption scheme
	// e.g., "signal_message_v3" for Signal Protocol version 3
	CiphertextType string `json:"ciphertext_type" binding:"required"`

	// Timestamp is when the message was created (client-generated)
	Timestamp time.Time `json:"timestamp" binding:"required"`

	// IdempotencyKey is used to prevent duplicate messages
	// Generate a unique key for each message attempt
	IdempotencyKey string `json:"idempotency_key" binding:"required"`

	// ReplyToMessageID is the ID of the message this is replying to (if any)
	ReplyToMessageID *uuid.UUID `json:"reply_to_message_id,omitempty"`

	// IsForwarded indicates if this message was forwarded
	IsForwarded bool `json:"is_forwarded,omitempty"`
}

// MessageResponse is the response when returning message information
type MessageResponse struct {
	ID               uuid.UUID        `json:"id"`
	ConversationID   uuid.UUID        `json:"conversation_id"`
	SenderID         uuid.UUID        `json:"sender_id"`
	SenderDeviceID   uuid.UUID        `json:"sender_device_id"`
	Type             MessageType      `json:"type"`
	Content          []byte           `json:"content"`
	CiphertextType   string           `json:"ciphertext_type"`
	Status           MessageStatus    `json:"status"`
	Timestamp        time.Time        `json:"timestamp"`
	ServerTimestamp  time.Time        `json:"server_timestamp"`
	IdempotencyKey   string           `json:"idempotency_key"`
	ReplyToMessageID *uuid.UUID       `json:"reply_to_message_id,omitempty"`
	IsEdited         bool             `json:"is_edited"`
	EditedAt         *time.Time       `json:"edited_at,omitempty"`
	IsDeleted        bool             `json:"is_deleted"`
	DeletedAt        *time.Time       `json:"deleted_at,omitempty"`
	IsForwarded      bool             `json:"is_forwarded"`
	CreatedAt        time.Time        `json:"created_at"`
	Sender           *UserResponse    `json:"sender,omitempty"`
	ReplyToMessage   *MessageResponse `json:"reply_to_message,omitempty"`
}

// MessageRecipient represents the delivery state of a message to a specific recipient
type MessageRecipient struct {
	// ID is the unique identifier for this delivery record
	ID uuid.UUID `json:"id" db:"id"`

	// MessageID is the message being delivered
	MessageID uuid.UUID `json:"message_id" db:"message_id"`

	// UserID is the recipient user
	UserID uuid.UUID `json:"user_id" db:"user_id"`

	// DeviceID is the specific device of the recipient
	DeviceID uuid.UUID `json:"device_id" db:"device_id"`

	// Status is the delivery status for this recipient
	Status MessageStatus `json:"status" db:"status"`

	// ReadAt is when the recipient read the message (if Status is "read")
	ReadAt *time.Time `json:"read_at,omitempty" db:"read_at"`

	// DeliveredAt is when the message was delivered to this recipient
	DeliveredAt *time.Time `json:"delivered_at,omitempty" db:"delivered_at"`

	// Error is any error that occurred during delivery
	Error string `json:"error,omitempty" db:"error"`

	// RetryCount is how many times delivery has been attempted
	RetryCount int `json:"retry_count" db:"retry_count"`

	// NextRetryAt is when the next delivery attempt should be made
	NextRetryAt *time.Time `json:"next_retry_at,omitempty" db:"next_retry_at"`

	// CreatedAt is when this delivery record was created
	CreatedAt time.Time `json:"created_at" db:"created_at"`

	// UpdatedAt is when this delivery record was last updated
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// MessageRecipientResponse is the response for message recipient status
type MessageRecipientResponse struct {
	ID         uuid.UUID      `json:"id"`
	MessageID  uuid.UUID      `json:"message_id"`
	UserID     uuid.UUID      `json:"user_id"`
	DeviceID   uuid.UUID      `json:"device_id"`
	Status     MessageStatus  `json:"status"`
	ReadAt     *time.Time     `json:"read_at,omitempty"`
	DeliveredAt *time.Time    `json:"delivered_at,omitempty"`
	Error      string         `json:"error,omitempty"`
	RetryCount int            `json:"retry_count"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	User       *UserResponse  `json:"user,omitempty"`
	Device     *DeviceResponse `json:"device,omitempty"`
}

// MessageListRequest is the request for fetching messages from a conversation
type MessageListRequest struct {
	// ConversationID is the conversation to fetch messages from
	ConversationID uuid.UUID `json:"conversation_id" binding:"required"`

	// Before is the message ID to fetch messages before (for pagination)
	Before *uuid.UUID `json:"before,omitempty"`

	// After is the message ID to fetch messages after (for pagination)
	After *uuid.UUID `json:"after,omitempty"`

	// Limit is the maximum number of messages to return
	Limit int `json:"limit,omitempty" binding:"omitempty,min=1,max=100"`

	// IncludeDeleted indicates if deleted messages should be included
	IncludeDeleted bool `json:"include_deleted,omitempty"`
}

// MessageListResponse is the response when listing messages
type MessageListResponse struct {
	Messages    []MessageResponse `json:"messages"`
	TotalCount  int                `json:"total_count"`
	HasMore     bool               `json:"has_more"`
	NextBefore  *uuid.UUID         `json:"next_before,omitempty"`
	NextAfter   *uuid.UUID         `json:"next_after,omitempty"`
}

// MessageDeleteRequest is the request body for deleting a message
type MessageDeleteRequest struct {
	// DeleteForAll indicates if the message should be deleted for all participants
	// If false, only the requester's copy is deleted
	DeleteForAll bool `json:"delete_for_all"`
}

// MessageEditRequest is the request body for editing a message
type MessageEditRequest struct {
	// Content is the NEW ENCRYPTED content
	Content []byte `json:"content" binding:"required"`

	// CiphertextType indicates the encryption scheme
	CiphertextType string `json:"ciphertext_type" binding:"required"`
}

// LocationMessage represents a location shared in a message
type LocationMessage struct {
	// Latitude of the location
	Latitude float64 `json:"latitude"`
	
	// Longitude of the location
	Longitude float64 `json:"longitude"`
	
	// Accuracy in meters (optional)
	Accuracy float64 `json:"accuracy,omitempty"`
	
	// Address or place name (optional, for display)
	Address string `json:"address,omitempty"`
	
	// Map URL or thumbnail (optional)
	MapURL string `json:"map_url,omitempty"`
	
	// Timestamp when location was captured
	Timestamp time.Time `json:"timestamp"`
}

// LiveLocationMessage represents a live location sharing session
type LiveLocationMessage struct {
	// SessionID is the unique identifier for this live location session
	SessionID uuid.UUID `json:"session_id"`
	
	// UserID is who is sharing their location
	UserID uuid.UUID `json:"user_id"`
	
	// ConversationID is where the live location is shared
	ConversationID uuid.UUID `json:"conversation_id"`
	
	// StartedAt is when the live location sharing started
	StartedAt time.Time `json:"started_at"`
	
	// ExpiresAt is when the live location sharing will stop
	ExpiresAt time.Time `json:"expires_at"`
	
	// IsActive indicates if the live location sharing is currently active
	IsActive bool `json:"is_active"`
	
	// LastUpdate is the most recent location update
	LastUpdate *time.Time `json:"last_update,omitempty"`
	
	// CurrentLocation is the latest location in the session
	CurrentLocation *LocationMessage `json:"current_location,omitempty"`
}

// LiveLocationUpdate represents a location update in a live session
type LiveLocationUpdate struct {
	// SessionID is the live location session
	SessionID uuid.UUID `json:"session_id"`
	
	// Location is the new location data
	Location LocationMessage `json:"location"`
	
	// Timestamp is when this update was sent
	Timestamp time.Time `json:"timestamp"`
}

// Report represents a user report
type Report struct {
	// ID is the unique identifier for the report
	ID uuid.UUID `json:"id" db:"id"`
	
	// ReporterID is the user who filed the report
	ReporterID uuid.UUID `json:"reporter_id" db:"reporter_id"`
	
	// ReportedUserID is the user being reported
	ReportedUserID uuid.UUID `json:"reported_user_id" db:"reported_user_id"`
	
	// ReportedMessageID is the message being reported (optional)
	ReportedMessageID *uuid.UUID `json:"reported_message_id,omitempty" db:"reported_message_id"`
	
	// Reason is why the user is being reported
	Reason string `json:"reason" db:"reason"`
	
	// Description is additional details (optional)
	Description string `json:"description,omitempty" db:"description"`
	
	// Category is the type of report (spam, abuse, harassment, etc.)
	Category ReportCategory `json:"category" db:"category"`
	
	// Status is the current status of the report
	Status ReportStatus `json:"status" db:"status"`
	
	// CreatedAt is when the report was filed
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	
	// UpdatedAt is when the report was last updated
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// ReportCategory represents the type of report
type ReportCategory string

const (
	// ReportCategorySpam is for spam messages
	ReportCategorySpam ReportCategory = "spam"
	
	// ReportCategoryAbuse is for abusive content
	ReportCategoryAbuse ReportCategory = "abuse"
	
	// ReportCategoryHarassment is for harassment
	ReportCategoryHarassment ReportCategory = "harassment"
	
	// ReportCategoryScam is for scams or fraud
	ReportCategoryScam ReportCategory = "scam"
	
	// ReportCategoryFake is for fake accounts
	ReportCategoryFake ReportCategory = "fake_account"
	
	// ReportCategoryInappropriate is for inappropriate content
	ReportCategoryInappropriate ReportCategory = "inappropriate"
	
	// ReportCategoryOther is for other reasons
	ReportCategoryOther ReportCategory = "other"
)

// ReportStatus represents the status of a report
type ReportStatus string

const (
	// ReportStatusPending is for reports waiting to be reviewed
	ReportStatusPending ReportStatus = "pending"
	
	// ReportStatusInReview is for reports being reviewed
	ReportStatusInReview ReportStatus = "in_review"
	
	// ReportStatusResolved is for reports that have been resolved
	ReportStatusResolved ReportStatus = "resolved"
	
	// ReportStatusDismissed is for reports that were dismissed
	ReportStatusDismissed ReportStatus = "dismissed"
	
	// ReportStatusActioned is for reports that resulted in action
	ReportStatusActioned ReportStatus = "actioned"
)

// ReportRequest is the request body for reporting a user
type ReportRequest struct {
	// ReportedUserID is the user being reported
	ReportedUserID uuid.UUID `json:"reported_user_id" binding:"required"`
	
	// ReportedMessageID is the message being reported (optional)
	ReportedMessageID *uuid.UUID `json:"reported_message_id,omitempty"`
	
	// Reason is why the user is being reported
	Reason string `json:"reason" binding:"required,min=1,max=500"`
	
	// Category is the type of report
	Category ReportCategory `json:"category" binding:"required"`
	
	// Description is additional details (optional)
	Description string `json:"description,omitempty" binding:"omitempty,max=2000"`
}

// ReportResponse is the response when a report is filed
type ReportResponse struct {
	ID            uuid.UUID      `json:"id"`
	ReporterID    uuid.UUID      `json:"reporter_id"`
	ReportedUserID uuid.UUID     `json:"reported_user_id"`
	Reason        string         `json:"reason"`
	Category      ReportCategory `json:"category"`
	Status        ReportStatus   `json:"status"`
	CreatedAt     time.Time      `json:"created_at"`
}

// DeliveryReceipt represents a receipt for message delivery
type DeliveryReceipt struct {
	// MessageID is the message that was delivered
	MessageID uuid.UUID `json:"message_id"`

	// UserID is the user who received the message
	UserID uuid.UUID `json:"user_id"`

	// DeviceID is the device that received the message
	DeviceID uuid.UUID `json:"device_id"`

	// Timestamp is when the receipt was generated
	Timestamp time.Time `json:"timestamp"`
}

// ReadReceipt represents a receipt for message read
type ReadReceipt struct {
	// MessageID is the message that was read
	MessageID uuid.UUID `json:"message_id"`

	// UserID is the user who read the message
	UserID uuid.UUID `json:"user_id"`

	// DeviceID is the device that read the message
	DeviceID uuid.UUID `json:"device_id"`

	// Timestamp is when the receipt was generated
	Timestamp time.Time `json:"timestamp"`
}
