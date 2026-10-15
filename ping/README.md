# Ping - WhatsApp-Like Messaging Backend

A phone-first, real-time messaging platform with end-to-end encryption (E2EE), built for speed, security, and scalability.

## Features

- **End-to-End Encryption**: All messages are encrypted using Signal Protocol - the server never sees plaintext
- **Phone-First**: Phone number is the primary identifier (like WhatsApp)
- **OTP Authentication**: Login with phone number and OTP (like WhatsApp)
- **Real-Time**: WebSocket support for instant message delivery
- **Scalable**: Modular architecture that can grow from 1,000 to millions of users
- **Low Cost**: Efficient design to minimize infrastructure costs
- **Clean Code**: Human-written, well-commented, maintainable Go code

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Applications                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │ React Native │    │   Next.js   │    │ Other Clients   │  │
│  │  (Mobile)    │    │   (Web)      │    │                 │  │
│  └──────┬──────┘    └──────┬──────┘    └─────────┬───────┘  │
└─────────┼─────────────────┼──────────────────────┼──────────┘
          │                 │                  │
          │    HTTPS        │    HTTPS         │
          ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend Server                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 Modular Monolith                         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │ │
│  │  │  Auth    │ │ Messaging│ │  Devices │ │ Convers- │  │ │
│  │  │ Service │ │  Service │ │  Service │ │ ations   │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │ │
│  │  ┌───────────────────────────────────────────────────┐  │ │
│  │  │               WebSocket Gateway                     │  │ │
│  │  └───────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Data Storage:                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ PostgreSQL  │  │   Redis      │  │   R2/S3      │           │
│  │ (Messages,  │  │ (Presence,   │  │ (Media       │           │
│  │  Users)     │  │  Cache)      │  │  Files)      │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Backend | Go | High-performance, concurrent server |
| Database | PostgreSQL | Reliable message storage |
| Cache | Redis | Presence, session management |
| Auth | JWT | Stateless authentication |
| Encryption | Signal Protocol | End-to-end encryption |
| HTTP | Gin | Fast HTTP framework |
| WebSocket | Gorilla WebSocket | Real-time communication |
| Logging | Logrus | Structured logging |
| Config | godotenv | Environment configuration |

## Getting Started

### Prerequisites

- Go 1.21+
- PostgreSQL 14+
- Redis 7+
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/ping.git
   cd ping
   ```

2. **Install dependencies:**
   ```bash
   go mod download
   ```

3. **Configure environment:**
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your settings:
   ```env
   # Server
   SERVER_HOST=0.0.0.0
   SERVER_PORT=8080
   ENVIRONMENT=development
   
   # Database
   DATABASE_DSN=postgresql://username:password@localhost:5432/ping?sslmode=disable
   
   # Redis
   REDIS_ADDRESS=localhost:6379
   REDIS_PASSWORD=
   REDIS_DB=0
   
   # Security
   JWT_SECRET=your-very-secure-random-secret-here
   JWT_EXPIRATION_HOURS=24
   CORS_ORIGINS=*
   ```

4. **Set up PostgreSQL:**
   ```bash
   # Create database
   createdb ping
   
   # Create user
   createuser -P ping_user
   
   # Grant permissions
   psql -d ping -c "GRANT ALL PRIVILEGES ON DATABASE ping TO ping_user;"
   ```

5. **Run the server:**
   ```bash
   go run cmd/server/main.go
   ```

6. **Test the API:**
   ```bash
   # Health check
   curl http://localhost:8080/health
   
   # API info
   curl http://localhost:8080/
   ```

### Using Docker

1. **Build the Docker image:**
   ```bash
   docker build -t ping .
   ```

2. **Run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

## API Documentation

### Authentication

#### Register
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "phone": "+1234567890",           // REQUIRED
  "display_name": "John Doe",       // Optional
  "password": "secure_password_123", // Optional (for password auth)
  "avatar_url": "https://..."       // Optional (profile photo)
}
```

#### Login (Phone + OTP or Password)
```
POST /api/v1/auth/login
Content-Type: application/json

// Option 1: Login with password
{
  "phone": "+1234567890",
  "password": "secure_password_123"
}

// Option 2: Login with OTP
{
  "phone": "+1234567890",
  "otp": "123456"
}
```

#### Refresh Token
```
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your_refresh_token"
}
```

### Users

#### Get Current User
```
GET /api/v1/users/me
Authorization: Bearer <access_token>
```

#### Update Current User
```
PUT /api/v1/users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "display_name": "John Doe Updated",
  "status": "Hey there!",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

#### Get User by ID
```
GET /api/v1/users/:id
Authorization: Bearer <access_token>
```

#### Search Users by Phone
```
GET /api/v1/users/search?phone=+123
Authorization: Bearer <access_token>
```

### Devices

#### Register Device (for Signal Protocol)
```
POST /api/v1/devices/register
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "device_id": "device_123",
  "name": "iPhone 13",
  "identity_key_public": "...",
  "signed_prekey_public": "...",
  "signed_prekey_signature": "...",
  "signed_prekey_id": 1,
  "registration_id": "..."
}
```

#### List Devices
```
GET /api/v1/devices
Authorization: Bearer <access_token>
```

### Prekeys

#### Get Prekey Bundle
```
GET /api/v1/prekeys/:device_id
Authorization: Bearer <access_token>
```

### Conversations

#### Create Conversation
```
POST /api/v1/conversations
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "direct",
  "participant_ids": ["user_id_1", "user_id_2"],
  "title": "My Chat"
}
```

#### List Conversations
```
GET /api/v1/conversations
Authorization: Bearer <access_token>
```

### Messages

#### Send Message
```
POST /api/v1/messages
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "conversation_id": "conv_id_123",
  "type": "text",
  "content": "...encrypted ciphertext...",
  "ciphertext_type": "signal_message_v3",
  "timestamp": "2024-01-01T12:00:00Z",
  "idempotency_key": "unique_key_123"
}
```

#### List Messages
```
GET /api/v1/messages/conversation/:conversation_id
Authorization: Bearer <access_token>
```

### WebSocket

Connect to WebSocket for real-time updates:
```
ws://localhost:8080/api/v1/messages/ws
```

## Signal Protocol Integration

This backend supports Signal Protocol for end-to-end encryption. The server stores:

1. **Public keys only**: Device identity keys, signed prekeys, one-time prekeys
2. **Never private keys**: Private keys stay on client devices
3. **Encrypted messages**: All message content is encrypted ciphertext

### Client-Side Implementation

Clients must implement:
- Signal Protocol for encryption/decryption
- Key generation and management
- Session establishment using X3DH
- Message encryption using Double Ratchet

## Security Considerations

### Encryption
- All messages are encrypted with Signal Protocol
- The server NEVER has access to plaintext or private keys
- Use proper key management on client devices

### Authentication
- JWT tokens with expiration
- Strong password hashing (bcrypt)
- Rate limiting to prevent brute force

### Privacy
- Phone-first authentication with OTP (like WhatsApp)
- Minimal metadata collection
- Clear data retention policies

## Scaling

The architecture is designed to scale:

| Scale | Configuration |
|-------|--------------|
| 1K-10K users | Single server, managed PostgreSQL, Redis |
| 10K-100K users | Multiple server replicas, shared Redis |
| 100K-1M users | Dedicated WebSocket gateways, DB partitioning |
| 1M-10M users | Regional routing, sharded storage |

### Scaling Strategies

1. **Horizontal Scaling**: Deploy multiple server instances behind a load balancer
2. **Database Scaling**: Use read replicas for queries, partition by user ID
3. **Caching**: Use Redis for presence, session state, and frequently accessed data
4. **WebSocket Scaling**: Dedicated WebSocket servers with Redis pub/sub
5. **Async Processing**: Offload non-critical tasks to background workers

## Project Structure

```
ping/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── config/                 # Configuration management
│   ├── database/               # Database connections & migrations
│   │   └── migrations/         # SQL migration files
│   ├── crypto/                 # Signal Protocol implementation
│   ├── handlers/               # HTTP request handlers
│   ├── middleware/             # HTTP middleware
│   ├── models/                 # Data models (structs)
│   ├── repository/            # Database repositories
│   └── service/                # Business logic services
├── pkg/
│   └── utils/                  # Utility functions
├── api/                       # API specifications
├── scripts/                   # Helper scripts
├── go.mod
├── go.sum
└── README.md
```

## Configuration

All configuration is done through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| SERVER_HOST | Host to bind to | 0.0.0.0 |
| SERVER_PORT | Port to listen on | 8080 |
| ENVIRONMENT | Environment mode | development |
| DATABASE_DSN | PostgreSQL connection string | - |
| REDIS_ADDRESS | Redis server address | localhost:6379 |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRATION_HOURS | JWT expiration in hours | 24 |
| CORS_ORIGINS | Allowed CORS origins | * |

## Monitoring

### Health Check
```bash
curl http://localhost:8080/health
```

### Metrics
```bash
curl http://localhost:8080/metrics
```

### Database Stats
```bash
curl http://localhost:8080/admin/db/stats
```

### Redis Stats
```bash
curl http://localhost:8080/admin/redis/stats
```

## Best Practices

1. **Always use HTTPS in production**
2. **Keep JWT_SECRET secure** - never commit to version control
3. **Use proper database backups**
4. **Monitor server health**
5. **Rate limit sensitive endpoints**
6. **Rotate secrets regularly**
7. **Use managed services** for PostgreSQL and Redis in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License

## Acknowledgements

- Signal Protocol by Open Whisper Systems
- Gin HTTP framework
- PostgreSQL and Redis communities
- All contributors to open-source Go libraries

## Contact

For questions or support, please open an issue on GitHub.

---

**Note**: This is a backend implementation only. You'll need to build mobile/web clients that implement the Signal Protocol for end-to-end encryption.
