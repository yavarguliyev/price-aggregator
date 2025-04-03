# Product Price Aggregator

A NestJS-based API that aggregates product pricing and availability data from multiple providers in real-time, with history tracking, filtering capabilities, and visualization.

## Project Overview

This service aggregates pricing and availability data for digital products (e-books, software licenses, digital courses) from multiple simulated third-party providers. The API collects data in real-time, normalizes it into a consistent format, stores it efficiently using Prisma and PostgreSQL, and provides RESTful endpoints for consumers to query the aggregated data.

### Key Features

- **Real-time data aggregation** from multiple providers with configurable intervals
- **Concurrent data fetching** with proper error handling and retries
- **Price and availability history** tracking with timestamps
- **Comprehensive filtering capabilities** by name, price range, availability, and provider
- **Stale data detection** to identify outdated product information
- **Server-Sent Events (SSE)** for real-time data visualization without WebSockets
- **Circuit breaker pattern** for resilient provider connections
- **API key authentication** for secure access to endpoints
- **Swagger documentation** for easy API exploration

## Architecture

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Provider APIs  │───▶│  Aggregator API  │───▶│  Client Apps    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                             │     ▲
                             ▼     │
                        ┌──────────────────┐
                        │   PostgreSQL     │
                        │   Database       │
                        └──────────────────┘
```

### Tech Stack

- **Backend Framework**: NestJS with TypeScript
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Cache**: Redis (via NestJS CacheManager)
- **Authentication**: API Key
- **Documentation**: Swagger/OpenAPI
- **Visualization**: Server-Sent Events (SSE)
- **Testing**: Jest

### Design Patterns

- **Repository Pattern**: Separation of data access logic (ProductRepository)
- **Service Layer**: Business logic encapsulation (AggregatorService, ProductService)
- **Circuit Breaker**: For resilient provider communication (CircuitBreakerService)
- **Retry Pattern**: Automatic retry with exponential backoff (RetryConfig)
- **Event-Based Architecture**: For real-time updates via EventEmitter
- **Dependency Injection**: NestJS's core pattern for loose coupling

## Setup and Installation

### Prerequisites

- Node.js (v16 or later)
- PostgreSQL
- Docker and Docker Compose (recommended)

### Environment Configuration

1. Clone the repository
2. Copy the `.env.example` file to `.env` and update values as needed:

```
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/price_aggregator?schema=public"

# API Security
API_KEY="your-secret-api-key"

# Redis Cache Configuration
REDIS_HOST="localhost"
REDIS_PORT=6379
CACHE_TTL=60
CACHE_MAX_ITEMS=100

# HTTP Client Configuration
HTTP_TIMEOUT=5000
HTTP_MAX_RETRIES=3
HTTP_MAX_REDIRECTS=5
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RESET_TIMEOUT=60000
CIRCUIT_BREAKER_HALF_OPEN_TIMEOUT=30000

# Application Settings
PORT=3000
NODE_ENV=development
FETCH_INTERVAL=10000
DEFAULT_TIMEFRAME=3600000
APP_URL="http://localhost:3000"
```

### Installation

#### Using Docker (Recommended)

1. Make sure Docker and Docker Compose are installed
2. Run:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- The NestJS application

#### Manual Installation

1. Install dependencies:

```bash
npm install
```

2. Set up the database:

```bash
npx prisma migrate dev
```

3. Build the application:

```bash
npm run build
```

4. Start the application:

```bash
npm run start:dev
```

## Running the Application

### Development Mode

```bash
npm run start:dev
```

### Production Mode

```bash
npm run build
npm run start:prod
```

### Running Tests

```bash
npm run test
```

## API Documentation

### Swagger UI

Swagger UI is available at `/api/docs` when the application is running:

```
http://localhost:3000/api/docs
```

### API Endpoints

#### Products

- `GET /api/products` - Get a list of all products with filtering options
  - Query Parameters:
    - `name`: Filter by product name (case insensitive)
    - `minPrice`: Filter by minimum price
    - `maxPrice`: Filter by maximum price
    - `availability`: Filter by availability status (true/false)
    - `provider`: Filter by provider name
    - `includeStale`: Include stale products (true/false)
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)
  - Response: List of products with pagination info

- `GET /api/products/:id` - Get detailed product information including price history
  - Response: Product details with price and availability history

- `GET /api/products/changes` - Get products with recent price or availability changes
  - Query Parameters:
    - `timeframe`: Time frame in minutes to check for changes (default: 60)
  - Response: List of products with recent changes

- `GET /api/products/stale` - Get products that have not been updated recently
  - Response: List of stale products

#### Live Data View

- `GET /api/live` - Simple HTML page for real-time data visualization
- `GET /api/live/events` - Server-Sent Events endpoint for real-time updates

#### Health Check

- `GET /api/health` - Basic health check endpoint to verify service status

### Authentication

API endpoints are protected by API key authentication. Include the API key in the request header:

```
X-API-KEY: your-api-key
```

## Database Schema

### Main Tables

- **Product**: Core product information
- **Price**: Historical price records
- **Availability**: Historical availability records

### Schema Overview

```prisma
// Product model to store aggregated product data
model Product {
  id            String        @id @default(uuid())
  name          String
  description   String?
  price         Float
  currency      String
  isAvailable   Boolean       @default(true)
  provider      String
  providerId    String
  lastFetchedAt DateTime      @default(now())
  isStale       Boolean       @default(false)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  prices        Price[]
  availability  Availability[]

  @@index([providerId])
  @@index([lastFetchedAt])
}

// Price model to track price history
model Price {
  id        String   @id @default(uuid())
  amount    Float
  currency  String
  createdAt DateTime @default(now())
  product   Product  @relation(fields: [productId], references: [id])
  productId String

  @@index([productId])
}

// Availability model to track availability history
model Availability {
  id          String   @id @default(uuid())
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now())
  product     Product  @relation(fields: [productId], references: [id])
  productId   String

  @@index([productId])
}
```

## Data Flow

1. **Provider Simulation**:
   - Four simulated providers (ProviderOneService, ProviderTwoService, etc.) generate product data
   - Each provider has its own data structure and update frequency
   - Prices and availability are randomly updated at intervals

2. **Data Collection**:
   - `ProviderService` orchestrates fetching data from all providers concurrently
   - Circuit breaker pattern helps handle provider outages or slow responses
   - Data is fetched at intervals defined by `FETCH_INTERVAL` environment variable

3. **Data Processing and Normalization**:
   - Data from different providers is normalized to a consistent format
   - Products are stored using efficient upsert operations
   - Price and availability history is preserved in separate tables
   - Stale products are marked based on their `lastFetchedAt` timestamp

4. **Data Access via API**:
   - RESTful endpoints provide filtered access to the data
   - Caching improves response times for common queries
   - Server-Sent Events (SSE) provide real-time updates to clients

## Design Decisions and Trade-offs

### Provider Simulation

- **Decision**: Implemented provider simulation as part of the main application
- **Alternative**: Separate microservices for each provider
- **Rationale**: Simplifies deployment for the MVP; could be separated later for more realistic simulation

### Data Storage Strategy

- **Decision**: Store latest values in Product table with history in separate tables
- **Alternative**: Event sourcing pattern with only history tables
- **Rationale**: Balances query performance with historical data needs

### Caching Strategy

- **Decision**: Use NestJS's CacheInterceptor with Redis
- **Alternative**: More granular caching at the repository level
- **Rationale**: Provides good performance with minimal code complexity

### Resilience Patterns

- **Decision**: Circuit breaker with retry mechanism
- **Alternative**: More complex patterns like bulkheads or rate limiting
- **Rationale**: Good balance of resilience without over-engineering

### Error Handling

- **Decision**: Graceful error handling with logging
- **Alternative**: More sophisticated error tracking and recovery
- **Rationale**: Adequate for an MVP while maintaining service stability

## Performance Considerations

- **Database Indexing**: Indexes on frequently queried fields
- **Connection Pooling**: Prisma handles connection pooling efficiently
- **Caching**: Frequently-accessed data is cached
- **Pagination**: Results are paginated to avoid large payloads
- **Concurrent Fetching**: Providers are queried concurrently

## Testing Strategy

- **Unit Tests**: Test individual services and repositories in isolation
- **Integration Tests**: Test API endpoints with a test database
- **End-to-End Tests**: Simulate real user flows (optional)

## Future Enhancements

1. **Advanced Filtering**: More sophisticated query capabilities
2. **Analytics**: Price trend analysis and prediction
3. **Webhooks**: Allow consumers to subscribe to price/availability changes
4. **Admin Interface**: Web UI for managing providers and monitoring data quality
5. **Performance Optimizations**: More sophisticated caching and indexing

## Acknowledgements

This project was developed as a technical assignment to demonstrate real-time data aggregation capabilities using NestJS and Prisma.
