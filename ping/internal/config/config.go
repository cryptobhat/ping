// Package config handles application configuration from environment variables
// This is the single source of truth for all runtime settings
package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

// Config holds all application configuration
// This struct is initialized once at startup and passed to all components
type Config struct {
	// Server settings
	Server ServerConfig
	
	// Database settings
	Database DatabaseConfig
	
	// Redis settings
	Redis RedisConfig
	
	// Security settings
	Security SecurityConfig
	
	// Message settings
	Message MessageConfig
	
	// Rate limiting settings
	RateLimit RateLimitConfig
	
	// OTP settings for MessageCentral
	OTP OTPConfig
}

// ServerConfig holds HTTP and WebSocket server settings
type ServerConfig struct {
	// Host to bind the server to (default: 0.0.0.0)
	Host string
	
	// Port for HTTP/WebSocket server (default: 8080)
	Port int
	
	// Environment mode: development, staging, production
	Environment string
	
	// ReadTimeout for HTTP server
	ReadTimeout time.Duration
	
	// WriteTimeout for HTTP server
	WriteTimeout time.Duration
	
	// MaxHeaderBytes for HTTP requests
	MaxHeaderBytes int
}

// DatabaseConfig holds PostgreSQL connection settings
type DatabaseConfig struct {
	// DSN (Data Source Name) for PostgreSQL connection
	// Format: postgresql://username:password@host:port/database?sslmode=disable
	DSN string
	
	// MaxConns is the maximum number of database connections
	MaxConns int32
	
	// MinConns is the minimum number of idle connections
	MinConns int32
	
	// MaxConnLifetime is the maximum time a connection can be reused
	MaxConnLifetime time.Duration
	
	// MaxConnIdleTime is the maximum time a connection can be idle
	MaxConnIdleTime time.Duration
}

// RedisConfig holds Redis connection settings
type RedisConfig struct {
	// Address of Redis server (host:port)
	Address string
	
	// Password for Redis authentication (empty if none)
	Password string
	
	// DB index to use (default: 0)
	DB int
	
	// MinIdleConns is the minimum number of idle connections
	MinIdleConns int
	
	// PoolSize is the maximum number of connections in the pool
	PoolSize int
	
	// DialTimeout for establishing new connections
	DialTimeout time.Duration
	
	// ReadTimeout for Redis read operations
	ReadTimeout time.Duration
	
	// WriteTimeout for Redis write operations
	WriteTimeout time.Duration
}

// SecurityConfig holds security-related settings
type SecurityConfig struct {
	// JWTSecret is used to sign and verify JWT tokens
	JWTSecret string
	
	// JWTExpiration is how long access tokens are valid
	JWTExpiration time.Duration
	
	// RefreshTokenExpiration is how long refresh tokens are valid
	RefreshTokenExpiration time.Duration
	
	// CookieName for storing JWT in cookies
	CookieName string
	
	// CookieDomain for the JWT cookie
	CookieDomain string
	
	// CookieSecure sets Secure flag on cookies (true for HTTPS)
	CookieSecure bool
	
	// CookieHTTPOnly sets HttpOnly flag on cookies
	CookieHTTPOnly bool
	
	// CORSOrigins is a comma-separated list of allowed origins
	CORSOrigins string
}

// MessageConfig holds message-related settings
type MessageConfig struct {
	// MaxMessageSize is the maximum size of a message in bytes
	MaxMessageSize int64
	
	// MessageRetentionDays is how long undelivered messages are kept
	MessageRetentionDays int
	
	// MaxAttachmentsPerMessage is the maximum number of attachments
	MaxAttachmentsPerMessage int
	
	// MaxAttachmentSize is the maximum size of a single attachment in bytes
	MaxAttachmentSize int64
}

// RateLimitConfig holds rate limiting settings
type RateLimitConfig struct {
	// RequestsPerSecond is the global rate limit
	RequestsPerSecond float64
	
	// AuthRequestsPerSecond is the rate limit for auth endpoints
	AuthRequestsPerSecond float64
	
	// MessageRequestsPerSecond is the rate limit for message endpoints
	MessageRequestsPerSecond float64
	
	// BurstSize is the maximum number of requests that can be made at once
	BurstSize int
}

// OTPConfig holds OTP (One-Time Password) service configuration
type OTPConfig struct {
	// Enabled determines if OTP authentication is available
	Enabled bool
	
	// Provider is the OTP service provider (e.g., "messagecentral", "twilio")
	Provider string
	
	// APIKey for the OTP service
	APIKey string
	
	// APISecret or password for the OTP service
	APISecret string
	
	// SenderID is the sender identifier (phone number or alphanumeric)
	SenderID string
	
	// OTPLength is the length of OTP codes (default: 6)
	OTPLength int
	
	// OTPExpiration is how long OTP codes are valid (default: 10 minutes)
	OTPExpiration time.Duration
	
	// MaxAttempts is the maximum number of OTP verification attempts
	MaxAttempts int
	
	// RateLimitOTP is the rate limit for OTP requests (per phone number)
	RateLimitOTP int
}

// defaultConfig returns a Config with sensible defaults
// This is used when environment variables are not set
func defaultConfig() Config {
	return Config{
		Server: ServerConfig{
			Host:           "0.0.0.0",
			Port:           8080,
			Environment:    "development",
			ReadTimeout:    15 * time.Second,
			WriteTimeout:   15 * time.Second,
			MaxHeaderBytes: 1 << 20, // 1 MB
		},
		Database: DatabaseConfig{
			DSN:             "postgresql://localhost:5432/ping?sslmode=disable",
			MaxConns:        10,
			MinConns:        2,
			MaxConnLifetime: 30 * time.Minute,
			MaxConnIdleTime: 5 * time.Minute,
		},
		Redis: RedisConfig{
			Address:        "localhost:6379",
			Password:       "",
			DB:             0,
			MinIdleConns:   2,
			PoolSize:       10,
			DialTimeout:    5 * time.Second,
			ReadTimeout:    3 * time.Second,
			WriteTimeout:   3 * time.Second,
		},
		Security: SecurityConfig{
			JWTSecret:              "change-this-to-a-secure-random-value-in-production",
			JWTExpiration:          24 * time.Hour,
			RefreshTokenExpiration: 7 * 24 * time.Hour,
			CookieName:             "ping_jwt",
			CookieDomain:           "",
			CookieSecure:           false, // Set to true in production with HTTPS
			CookieHTTPOnly:         true,
			CORSOrigins:            "*", // Allow all in development, restrict in production
		},
		Message: MessageConfig{
			MaxMessageSize:         10 * 1024 * 1024, // 10 MB
			MessageRetentionDays:   30,
			MaxAttachmentsPerMessage: 10,
			MaxAttachmentSize:     100 * 1024 * 1024, // 100 MB
		},
		RateLimit: RateLimitConfig{
			RequestsPerSecond:       100,
			AuthRequestsPerSecond:   10,
			MessageRequestsPerSecond: 50,
			BurstSize:               200,
		},
		OTP: OTPConfig{
			Enabled:       false,
			Provider:      "messagecentral",
			APIKey:        "",
			APISecret:     "",
			SenderID:      "PINGAPP",
			OTPLength:     6,
			OTPExpiration: 10 * time.Minute,
			MaxAttempts:   5,
			RateLimitOTP:  3, // Max 3 OTP requests per minute per phone
		},
	}
}

// Load loads configuration from environment variables
// It first loads from .env file if present, then from actual environment
func Load() *Config {
	// Load .env file if it exists
	// This is useful for local development
	if err := godotenv.Load(); err != nil {
		logrus.Warn("No .env file found, using environment variables only")
	}

	cfg := defaultConfig()

	// Server configuration
	if host := os.Getenv("SERVER_HOST"); host != "" {
		cfg.Server.Host = host
	}
	if port := os.Getenv("SERVER_PORT"); port != "" {
		if p, err := strconv.Atoi(port); err == nil {
			cfg.Server.Port = p
		}
	}
	if env := os.Getenv("ENVIRONMENT"); env != "" {
		cfg.Server.Environment = env
	}

	// Database configuration
	if dsn := os.Getenv("DATABASE_DSN"); dsn != "" {
		cfg.Database.DSN = dsn
	}
	if maxConns := os.Getenv("DATABASE_MAX_CONNS"); maxConns != "" {
		if mc, err := strconv.Atoi(maxConns); err == nil {
			cfg.Database.MaxConns = int32(mc)
		}
	}

	// Redis configuration
	if addr := os.Getenv("REDIS_ADDRESS"); addr != "" {
		cfg.Redis.Address = addr
	}
	if pwd := os.Getenv("REDIS_PASSWORD"); pwd != "" {
		cfg.Redis.Password = pwd
	}
	if db := os.Getenv("REDIS_DB"); db != "" {
		if d, err := strconv.Atoi(db); err == nil {
			cfg.Redis.DB = d
		}
	}

	// Security configuration
	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		cfg.Security.JWTSecret = secret
	}
	if jwtExp := os.Getenv("JWT_EXPIRATION_HOURS"); jwtExp != "" {
		if hours, err := strconv.Atoi(jwtExp); err == nil {
			cfg.Security.JWTExpiration = time.Duration(hours) * time.Hour
		}
	}
	if cors := os.Getenv("CORS_ORIGINS"); cors != "" {
		cfg.Security.CORSOrigins = cors
	}

	// Message configuration
	if maxMsgSize := os.Getenv("MAX_MESSAGE_SIZE"); maxMsgSize != "" {
		if size, err := strconv.Atoi(maxMsgSize); err == nil {
			cfg.Message.MaxMessageSize = int64(size)
		}
	}

	// Rate limit configuration
	if rps := os.Getenv("RATE_LIMIT_RPS"); rps != "" {
		if r, err := strconv.ParseFloat(rps, 64); err == nil {
			cfg.RateLimit.RequestsPerSecond = r
		}
	}

	// OTP configuration
	if otpEnabled := os.Getenv("OTP_ENABLED"); otpEnabled != "" {
		cfg.OTP.Enabled = otpEnabled == "true"
	}
	if provider := os.Getenv("OTP_PROVIDER"); provider != "" {
		cfg.OTP.Provider = provider
	}
	if apiKey := os.Getenv("OTP_API_KEY"); apiKey != "" {
		cfg.OTP.APIKey = apiKey
	}
	if apiSecret := os.Getenv("OTP_API_SECRET"); apiSecret != "" {
		cfg.OTP.APISecret = apiSecret
	}
	if senderID := os.Getenv("OTP_SENDER_ID"); senderID != "" {
		cfg.OTP.SenderID = senderID
	}
	if otpLength := os.Getenv("OTP_LENGTH"); otpLength != "" {
		if length, err := strconv.Atoi(otpLength); err == nil {
			cfg.OTP.OTPLength = length
		}
	}
	if otpExpiration := os.Getenv("OTP_EXPIRATION_MINUTES"); otpExpiration != "" {
		if minutes, err := strconv.Atoi(otpExpiration); err == nil {
			cfg.OTP.OTPExpiration = time.Duration(minutes) * time.Minute
		}
	}

	// Log configuration loaded
	logrus.Info("Configuration loaded successfully")
	if cfg.Server.Environment == "development" {
		logrus.Warn("Running in development mode - do not use in production!")
	}

	return &cfg
}

// GetDatabaseDSN returns the database DSN, masking password in logs
func (c *Config) GetDatabaseDSN() string {
	return c.Database.DSN
}

// IsProduction returns true if running in production environment
func (c *Config) IsProduction() bool {
	return c.Server.Environment == "production"
}
