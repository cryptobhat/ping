# Ping Messaging Backend Dockerfile
# Multi-stage build for production

# ============================================================================
# STAGE 1: Build the application
# ============================================================================
FROM golang:1.21-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go.mod and go.sum first for better caching
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
# Using CGO_ENABLED=0 for static linking
# This creates a single binary with all dependencies
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o ping ./cmd/server

# ============================================================================
# STAGE 2: Create production image
# ============================================================================
FROM alpine:3.19

# Set working directory
WORKDIR /app

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates tzdata

# Copy binary from builder
COPY --from=builder /app/ping .

# Copy configuration (optional, can be mounted at runtime)
# COPY .env.example .env

# Set environment variables
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=8080
ENV ENVIRONMENT=production

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the application
ENTRYPOINT ["./ping"]

# Default command (can be overridden)
CMD []
