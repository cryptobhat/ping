// Package database handles the Redis connection for caching and presence
// Redis is used for fast operations that don't need persistent storage
package database

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"

	"github.com/yourusername/ping/internal/config"
)

// Redis is the main Redis client
// This is exported so it can be used by other packages
var Redis *redis.Client

// ConnectRedis establishes a connection to Redis
// This should be called once at application startup
func ConnectRedis(cfg *config.Config) {
	// Create Redis client
	Redis = redis.NewClient(&redis.Options{
		Addr:         cfg.Redis.Address,
		Password:     cfg.Redis.Password,
		DB:           cfg.Redis.DB,
		MinIdleConns: cfg.Redis.MinIdleConns,
		PoolSize:     cfg.Redis.PoolSize,
		DialTimeout:  cfg.Redis.DialTimeout,
		ReadTimeout:  cfg.Redis.ReadTimeout,
		WriteTimeout: cfg.Redis.WriteTimeout,
	})

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := Redis.Ping(ctx).Result()
	if err != nil {
		logrus.Fatalf("Failed to connect to Redis: %v", err)
	}

	logrus.Info("Redis connection established successfully")
}

// CloseRedis closes the Redis connection
// This should be called when the application shuts down
func CloseRedis() {
	if Redis != nil {
		Redis.Close()
		logrus.Info("Redis connection closed")
	}
}

// RedisPrefixes defines the prefixes used for Redis keys
// This helps organize and avoid collisions in the Redis namespace
var RedisPrefixes = struct {
	// Presence keys track which users/devices are online
	Presence string
	
	// WebSocket connection keys map connection IDs to user/device IDs
	WebSocketConn string
	
	// User device connection keys map user+device to connection IDs
	UserDeviceConn string
	
	// Rate limit keys track request counts for rate limiting
	RateLimit string
	
	// Message queue keys for pending deliveries
	MessageQueue string
	
	// Sync cursor keys for client sync state
	SyncCursor string
	
	// Prekey cache for device prekeys
	PrekeyCache string
	
	// Session cache for Signal Protocol sessions (optional, for performance)
	SessionCache string
}{
	Presence:       "pres:",
	WebSocketConn:  "ws:conn:",
	UserDeviceConn: "ws:user_dev:",
	RateLimit:      "rate:",
	MessageQueue:   "msg:queue:",
	SyncCursor:     "sync:cursor:",
	PrekeyCache:    "prekey:",
	SessionCache:   "session:",
}

// GetRedisKey constructs a Redis key with the appropriate prefix
func GetRedisKey(prefix, id string) string {
	return prefix + id
}

// GetPresenceKey returns the Redis key for a user's presence status
func GetPresenceKey(userID string) string {
	return GetRedisKey(RedisPrefixes.Presence, userID)
}

// GetWebSocketConnKey returns the Redis key for a WebSocket connection
func GetWebSocketConnKey(connID string) string {
	return GetRedisKey(RedisPrefixes.WebSocketConn, connID)
}

// GetUserDeviceConnKey returns the Redis key for a user+device connection
func GetUserDeviceConnKey(userID, deviceID string) string {
	return GetRedisKey(RedisPrefixes.UserDeviceConn, userID+":"+deviceID)
}

// GetRateLimitKey returns the Redis key for rate limiting
func GetRateLimitKey(identifier string) string {
	return GetRedisKey(RedisPrefixes.RateLimit, identifier)
}

// GetMessageQueueKey returns the Redis key for a user's message queue
func GetMessageQueueKey(userID string) string {
	return GetRedisKey(RedisPrefixes.MessageQueue, userID)
}

// GetSyncCursorKey returns the Redis key for a device's sync cursor
func GetSyncCursorKey(deviceID string) string {
	return GetRedisKey(RedisPrefixes.SyncCursor, deviceID)
}

// GetPrekeyCacheKey returns the Redis key for a device's prekey cache
func GetPrekeyCacheKey(deviceID string) string {
	return GetRedisKey(RedisPrefixes.PrekeyCache, deviceID)
}

// GetSessionCacheKey returns the Redis key for a Signal Protocol session cache
func GetSessionCacheKey(sessionID string) string {
	return GetRedisKey(RedisPrefixes.SessionCache, sessionID)
}

// GetRedisStats returns basic statistics about the Redis connection
// This is useful for monitoring and debugging
func GetRedisStats() map[string]interface{} {
	if Redis == nil {
		return map[string]interface{}{
			"connected": false,
		}
	}

	stats := Redis.PoolStats()
	return map[string]interface{}{
		"connected":            true,
		"total_conns":         stats.TotalConns,
		"idle_conns":         stats.IdleConns,
		"active_conns":        stats.TotalConns - stats.IdleConns,
		"hits":               stats.Hits,
		"misses":             stats.Misses,
		"timeouts":           stats.Timeouts,
		"stale_conns":        stats.StaleConns,
	}
}

// FlushRedis clears all data from Redis
// WARNING: This is destructive and should only be used in tests
func FlushRedis(ctx context.Context) error {
	if Redis == nil {
		return fmt.Errorf("Redis not connected")
	}

	// Use FLUSHDB to clear only the current database
	// This is safer than FLUSHALL which clears all databases
	_, err := Redis.FlushDB(ctx).Result()
	return err
}

// SetWithExpiration sets a key with an expiration
func SetWithExpiration(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return Redis.Set(ctx, key, value, expiration).Err()
}

// GetString gets a string value from Redis
func GetString(ctx context.Context, key string) (string, error) {
	return Redis.Get(ctx, key).Result()
}

// Delete removes a key from Redis
func Delete(ctx context.Context, key string) error {
	return Redis.Del(ctx, key).Err()
}

// Exists checks if a key exists in Redis
func Exists(ctx context.Context, key string) (bool, error) {
	result, err := Redis.Exists(ctx, key).Result()
	return result == 1, err
}

// Increment increments an integer value in Redis
func Increment(ctx context.Context, key string) (int64, error) {
	return Redis.Incr(ctx, key).Result()
}

// Expire sets an expiration on a key
func Expire(ctx context.Context, key string, expiration time.Duration) (bool, error) {
	return Redis.Expire(ctx, key, expiration).Result()
}

// Publish publishes a message to a Redis channel (for pub/sub)
func Publish(ctx context.Context, channel string, message interface{}) error {
	return Redis.Publish(ctx, channel, message).Err()
}

// Subscribe subscribes to a Redis channel
// Returns a *redis.PubSub for receiving messages
func Subscribe(ctx context.Context, channel string) *redis.PubSub {
	return Redis.Subscribe(ctx, channel)
}
