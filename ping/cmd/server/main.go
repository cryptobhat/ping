// Package main is the entry point for the Ping messaging backend
// This file initializes the application and starts the server

package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"github.com/yourusername/ping/internal/config"
	"github.com/yourusername/ping/internal/database"
	"github.com/yourusername/ping/internal/database/migrations"
	"github.com/yourusername/ping/internal/handlers"
	"github.com/yourusername/ping/internal/middleware"
	"github.com/yourusername/ping/internal/service"
)

// Version of the application
const Version = "1.0.0"

func main() {
	// Initialize logging
	initLogging()

	// Load configuration
	cfg := config.Load()

	// Print startup banner
	printBanner(cfg)

	// Connect to database
	if err := database.Connect(cfg); err != nil {
		logrus.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Run database migrations
	if err := migrations.RunMigrations(context.Background()); err != nil {
		logrus.Fatalf("Failed to run database migrations: %v", err)
	}

	// Connect to Redis
	database.ConnectRedis(cfg)
	defer database.CloseRedis()

	// Initialize services
	authService := service.InitAuth(cfg)
	userService := service.NewUserService()

	// Create Gin router
	router := gin.New()

	// Configure Gin
	configureGin(router, cfg)

	// Set up middleware
	setupMiddleware(router, cfg, authService)

	// Set up routes
	setupRoutes(router, cfg, authService, userService)

	// Create HTTP server
	server := &http.Server{
		Addr:           fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port),
		Handler:        router,
		ReadTimeout:    cfg.Server.ReadTimeout,
		WriteTimeout:   cfg.Server.WriteTimeout,
		MaxHeaderBytes: cfg.Server.MaxHeaderBytes,
	}

	// Start server in a goroutine
	go func() {
		logrus.Infof("Server starting on %s:%d", cfg.Server.Host, cfg.Server.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	// Shutdown gracefully
	logrus.Info("Shutting down server...")

	// Give 30 seconds to finish processing
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logrus.Errorf("Server shutdown error: %v", err)
	}

	logrus.Info("Server shutdown complete")
}

// initLogging initializes the logging configuration
func initLogging() {
	// Configure logrus
	logrus.SetFormatter(&logrus.JSONFormatter{})
	logrus.SetOutput(os.Stdout)
	logrus.SetLevel(logrus.InfoLevel)

	// In development, use text formatter for better readability
	if os.Getenv("ENVIRONMENT") == "development" {
		logrus.SetFormatter(&logrus.TextFormatter{})
		logrus.SetLevel(logrus.DebugLevel)
	}

	logrus.Info("Logging initialized")
}

// printBanner prints the application startup banner
func printBanner(cfg *config.Config) {
	banner := `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   Ping - WhatsApp-Like Messaging Backend                                     ║
║   Privacy-First, Real-Time, End-to-End Encrypted Messaging                   ║
║                                                                              ║
║   Version: %s                                                          ║
║   Environment: %s                                                      ║
║   Port: %d                                                                   ║
║                                                                              ║
║   Built with: Go, PostgreSQL, Redis, Signal Protocol                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`
	fmt.Printf(banner, Version, cfg.Server.Environment, cfg.Server.Port)
}

// configureGin configures the Gin router
func configureGin(router *gin.Engine, cfg *config.Config) {
	// In production, use ReleaseMode for better performance
	if cfg.Server.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Disable console color output in production
	gin.DisableConsoleColor()

	// Custom recovery function
	router.Use(gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		logrus.Errorf("Panic recovered: %v", recovered)
		c.JSON(http.StatusInternalServerError, handlers.NewErrorResponse(
			"Internal server error",
			"An unexpected error occurred. Please try again later.",
		))
	}))
}

// setupMiddleware sets up HTTP middleware
func setupMiddleware(router *gin.Engine, cfg *config.Config, authService *service.AuthService) {
	// CORS middleware
	if cfg.Security.CORSOrigins != "" {
		router.Use(middleware.CORSMiddleware(cfg))
	} else {
		// Default CORS for development
		router.Use(middleware.DefaultCORSMiddleware())
	}

	// Request ID middleware
	router.Use(middleware.RequestIDMiddleware())

	// Logging middleware
	router.Use(middleware.LoggingMiddleware())

	// Rate limiting middleware
	router.Use(middleware.RateLimitMiddleware(cfg))

	// Authentication middleware (will be applied to specific routes)
	// This is set up in the routes configuration
}

// setupRoutes sets up all the HTTP routes
func setupRoutes(router *gin.Engine, cfg *config.Config, authService *service.AuthService, userService *service.UserService) {
	// Create handler with dependencies
	handler := handlers.NewHandler(authService, userService, cfg)

	// Health check endpoint (no authentication required)
	router.GET("/health", handler.HealthCheck)

	// API info endpoint
	router.GET("/", handler.APIInfo)

	// Version endpoint
	router.GET("/version", handler.Version)

	// Metrics endpoint (for monitoring)
	router.GET("/metrics", handler.Metrics)

	// API v1 routes
	apiV1 := router.Group("/api/v1")
	{
		// Authentication routes
		auth := apiV1.Group("/auth")
		{
			auth.POST("/register", handler.Register)
			auth.POST("/login", handler.Login)
			auth.POST("/refresh", handler.RefreshToken)
			
			// OTP routes (some may not require auth for initial request)
			auth.POST("/otp/send", handler.SendOTP)
			auth.POST("/otp/verify", handler.VerifyOTP)
		}

		// User routes (require authentication)
		users := apiV1.Group("/users", middleware.AuthMiddleware(authService))
		{
			users.GET("/me", handler.GetCurrentUser)
			users.PUT("/me", handler.UpdateCurrentUser)
			users.GET("/:id", handler.GetUserByID)
			users.GET("/search", handler.SearchUsers)
			users.POST("/logout", handler.Logout)
			users.DELETE("/me", handler.DeleteAccount)
			users.POST("/report", handler.ReportUser)
			users.GET("/reports", handler.ListMyReports)
			users.GET("/reports/:id", handler.GetReportStatus)
		}

		// Device routes
		devices := apiV1.Group("/devices", middleware.AuthMiddleware(authService))
		{
			devices.POST("/register", handler.RegisterDevice)
			devices.GET("/", handler.ListDevices)
			devices.GET("/:id", handler.GetDevice)
		}

		// Prekey routes
		prekeys := apiV1.Group("/prekeys", middleware.AuthMiddleware(authService))
		{
			prekeys.GET("/:device_id", handler.GetPrekeyBundle)
		}

		// Conversation routes
		conversations := apiV1.Group("/conversations", middleware.AuthMiddleware(authService))
		{
			conversations.POST("/", handler.CreateConversation)
			conversations.GET("/", handler.ListConversations)
			conversations.GET("/:id", handler.GetConversation)
			conversations.PUT("/:id", handler.UpdateConversation)
			conversations.DELETE("/:id", handler.DeleteConversation)
			
			// Group-specific routes
			conversations.POST("/groups", handler.CreateGroup)
		}

		// Message routes
		messages := apiV1.Group("/messages", middleware.AuthMiddleware(authService))
		{
			messages.POST("/", handler.SendMessage)
			messages.GET("/:id", handler.GetMessage)
			messages.GET("/conversation/:conversation_id", handler.ListMessages)
			messages.PUT("/:id", handler.UpdateMessage)
			messages.DELETE("/:id", handler.DeleteMessage)
			messages.POST("/:id/read", handler.MarkMessageAsRead)
		}

		// WebSocket route for real-time messaging
		messages.GET("/ws", handler.WebSocketHandler)

		// Live location routes
		liveLocations := apiV1.Group("/live-locations", middleware.AuthMiddleware(authService))
		{
			liveLocations.POST("/", handler.StartLiveLocation)
			liveLocations.DELETE("/:id", handler.StopLiveLocation)
			liveLocations.PUT("/:id", handler.UpdateLiveLocation)
		}

		// Group invitation routes
		groupInvites := apiV1.Group("/groups", middleware.AuthMiddleware(authService))
		{
			// Generate invite link for a group
			groupInvites.POST("/:id/invite", handler.GenerateInviteLink)
			
			// Join a group using invite token
			groupInvites.POST("/join", handler.JoinGroup)
			
			// Revoke an invite link
			groupInvites.DELETE("/:id/invite", handler.RevokeInviteLink)
			
			// List all invite links for a group
			groupInvites.GET("/:id/invites", handler.ListInviteLinks)
		}
	}

	// Admin routes (for monitoring and administration)
	// These are only available in non-production environments or with special auth
	if cfg.Server.Environment != "production" {
		admin := router.Group("/admin")
		{
			admin.GET("/db/stats", handler.DatabaseStats)
			admin.GET("/redis/stats", handler.RedisStats)
			admin.GET("/migrations", handler.MigrationInfo)
		}
	}

	// 404 handler
	router.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, handlers.NewErrorResponse(
			"Not found",
			"The requested resource was not found.",
		))
	})
}
