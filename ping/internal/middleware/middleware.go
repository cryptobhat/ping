// Package middleware provides HTTP middleware for the application
// Middleware functions process requests before they reach the handlers
package middleware

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"

	"github.com/yourusername/ping/internal/config"
	"github.com/yourusername/ping/internal/database"
	"github.com/yourusername/ping/internal/service"
)

// CORSMiddleware creates a CORS middleware with custom configuration
func CORSMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Set CORS headers
		c.Header("Access-Control-Allow-Origin", cfg.Security.CORSOrigins)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Request-ID, X-Device-ID")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400") // 24 hours

		// Handle OPTIONS requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// DefaultCORSMiddleware creates a default CORS middleware for development
func DefaultCORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Allow all origins in development
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Request-ID, X-Device-ID")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// RequestIDMiddleware adds a unique request ID to each request
// This is useful for tracing and debugging
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Generate or get request ID
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}

		// Set request ID in context and response header
		c.Set("request_id", requestID)
		c.Header("X-Request-ID", requestID)

		c.Next()
	}
}

// LoggingMiddleware logs HTTP requests
func LoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Start timer
		start := time.Now()

		// Process request
		c.Next()

		// Calculate duration
		duration := time.Since(start)

		// Get request ID
		requestID := c.GetString("request_id")
		if requestID == "" {
			requestID = "unknown"
		}

		// Get status code
		statusCode := c.Writer.Status()

		// Log request
		logrus.WithFields(logrus.Fields{
			"request_id":   requestID,
			"method":       c.Request.Method,
			"path":         c.Request.URL.Path,
			"status":       statusCode,
			"duration":     duration.String(),
			"remote_ip":    c.ClientIP(),
			"user_agent":   c.Request.UserAgent(),
			"size":         c.Writer.Size(),
		}).Info("HTTP request")
	}
}

// RateLimitMiddleware applies rate limiting to requests
func RateLimitMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip rate limiting for certain paths
		path := c.Request.URL.Path
		if strings.HasPrefix(path, "/health") ||
			strings.HasPrefix(path, "/metrics") ||
			strings.HasPrefix(path, "/version") {
			c.Next()
			return
		}

		// Get client identifier (IP address or user ID)
		clientIP := c.ClientIP()

		// Check rate limit in Redis
		redisKey := database.GetRateLimitKey(clientIP)

		// Use Redis to track request count
		// This is a simple token bucket implementation
		ctx := c.Request.Context()
		
		// Increment request count
		count, err := database.Redis.Incr(ctx, redisKey).Result()
		if err != nil {
			// If Redis is down, we could either fail or skip rate limiting
			// For resilience, we'll skip rate limiting if Redis is unavailable
			logrus.WithError(err).Warn("Redis error in rate limiter, skipping rate limiting")
			c.Next()
			return
		}

		// Set expiration on first request
		if count == 1 {
			// Expire after 1 minute
			database.Redis.Expire(ctx, redisKey, time.Minute)
		}

		// Check if we've exceeded the limit
		// For now, use a simple global limit
		// In production, you might have different limits for different endpoints
		maxRequests := int64(cfg.RateLimit.RequestsPerSecond * 60) // Per minute
		if count > maxRequests {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": gin.H{
					"code":    "rate_limit_exceeded",
					"message": "Too many requests. Please try again later.",
				},
			})
			c.Abort()
			return
		}

		// Add rate limit headers
		c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", maxRequests))
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", maxRequests-count))

		c.Next()
	}
}

// AuthMiddleware authenticates requests using JWT tokens
func AuthMiddleware(authService *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "unauthorized",
					"message": "Authorization header is required",
				},
			})
			c.Abort()
			return
		}

		// Parse token from header
		// Format: "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "unauthorized",
					"message": "Invalid authorization header format. Expected: Bearer <token>",
				},
			})
			c.Abort()
			return
		}

		token := parts[1]

		// Validate token
		claims, err := authService.ValidateToken(c.Request.Context(), token)
		if err != nil {
			logrus.WithError(err).Debug("Token validation failed")
			
			var statusCode int
			var code, message string

			if errors.Is(err, service.ErrTokenExpired) {
				statusCode = http.StatusUnauthorized
				code = "token_expired"
				message = "Token has expired. Please refresh your token."
			} else if errors.Is(err, service.ErrInvalidToken) {
				statusCode = http.StatusUnauthorized
				code = "invalid_token"
				message = "Invalid token. Please log in again."
			} else if errors.Is(err, service.ErrUserNotFound) {
				statusCode = http.StatusUnauthorized
				code = "user_not_found"
				message = "User not found. Please log in again."
			} else {
				statusCode = http.StatusUnauthorized
				code = "unauthorized"
				message = "Authentication failed."
			}

			c.JSON(statusCode, gin.H{
				"error": gin.H{
					"code":    code,
					"message": message,
				},
			})
			c.Abort()
			return
		}

		// Set user in context
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("is_access_token", claims.IsAccessToken)

		// Add user info to request context
		c.Request = c.Request.WithContext(context.WithValue(
			c.Request.Context(),
			"user_id",
			claims.UserID,
		))

		c.Next()
	}
}

// DeviceMiddleware extracts device information from the request
// This is used for Signal Protocol to identify which device is making the request
func DeviceMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get device ID from header
		deviceID := c.GetHeader("X-Device-ID")
		if deviceID != "" {
			c.Set("device_id", deviceID)
			c.Request = c.Request.WithContext(context.WithValue(
				c.Request.Context(),
				"device_id",
				deviceID,
			))
		}

		c.Next()
	}
}

// ErrorHandler is a middleware that handles errors consistently
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Check if there were any errors
		if len(c.Errors) > 0 {
			logrus.WithField("errors", c.Errors).Error("Request had errors")
			
			// Get the first error
			err := c.Errors[0].Err
			
			// Determine status code
			var statusCode int
			var code, message string

			switch {
			case errors.Is(err, service.ErrUserNotFound):
				statusCode = http.StatusNotFound
				code = "user_not_found"
				message = "User not found"
			case errors.Is(err, service.ErrInvalidPassword):
				statusCode = http.StatusUnauthorized
				code = "invalid_password"
				message = "Invalid password"
			case errors.Is(err, service.ErrUserAlreadyExists):
				statusCode = http.StatusConflict
				code = "user_already_exists"
				message = "User already exists"
			case errors.Is(err, service.ErrInvalidToken):
				statusCode = http.StatusUnauthorized
				code = "invalid_token"
				message = "Invalid token"
			default:
				statusCode = http.StatusInternalServerError
				code = "internal_error"
				message = "An internal error occurred"
			}

			c.JSON(statusCode, gin.H{
				"error": gin.H{
					"code":    code,
					"message": message,
				},
			})
			c.Abort()
		}
	}
}
