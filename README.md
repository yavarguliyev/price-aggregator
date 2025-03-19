# Product Price Aggregator

A NestJS application that aggregates pricing and availability data for digital products from multiple external APIs, built with Clean Architecture principles.

## Features

- Real-time price and availability aggregation from multiple providers
- Clean Architecture implementation for better maintainability
- REST API with Swagger documentation
- Server-Sent Events (SSE) for real-time updates
- API key authentication
- Rate limiting
- Health monitoring
- Docker support for easy deployment
- Price history tracking with timestamps
- Stale data detection and marking
- Efficient data normalization from various providers
- Concurrent data fetching with resilience patterns

## Tech Stack

- NestJS (TypeScript)
- PostgreSQL with Prisma ORM
- Redis for caching
- Docker & Docker Compose
- Swagger for API documentation

## Quick Start

### Prerequisites

- Node.js (v20+)
- npm
- Docker and Docker Compose

### Running the Application

1. Clone the repository:
```bash
git clone <repository-url>
cd price-aggregator-nest
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Choose one of the following deployment options:

The application uses a deployment script with various options:

```bash
# Start only database services (PostgreSQL + Redis)
./deployment/deploy.sh --dev

# Start the full application stack in production mode
./deployment/deploy.sh --prod

# Build containers with latest changes
./deployment/deploy.sh --prod --build

# Stop all containers
./deployment/deploy.sh --down

# View container logs
./deployment/deploy.sh --logs

# Check container status
./deployment/deploy.sh --status

# Restart containers
./deployment/deploy.sh --restart

# Clean up containers, images, and volumes
./deployment/deploy.sh --clean

# Remove unused Docker resources
./deployment/deploy.sh --prune

# Create a new database migration
./deployment/deploy.sh --migrate <migration_name>

# Skip database migrations during deployment
./deployment/deploy.sh --prod --skip-migrations
```

## Project Structure

The project follows Clean Architecture principles:

```
src/
├── api/              # API layer (controllers, routes)
├── application/      # Application layer (use cases, services)
├── core/             # Core layer (interfaces, shared code)
├── domain/           # Domain layer (entities, value objects)
└── infrastructure/   # Infrastructure layer (repositories, external services)
```

## API Endpoints

### Authentication
All endpoints except `/api-docs`, `/visualize`, and `/api/health` require an API key.

**Header**: `x-api-key: your-api-key`

### Available Endpoints

#### Products
```http
# Get all products
GET /api/products
Query Parameters:
  - name: string (optional) - Filter by product name
  - minPrice: number (optional) - Minimum price filter
  - maxPrice: number (optional) - Maximum price filter
  - availability: boolean (optional) - Filter by availability
  - provider: string (optional) - Filter by provider
  - includeStale: boolean (optional) - Include stale products
  - page: number (optional) - Page number for pagination
  - limit: number (optional) - Items per page

# Get product by ID
GET /api/products/:id

# Get products with changes
GET /api/products/changes
Query Parameters:
  - timeframe: number (optional) - Time window in minutes (default: 1440)

# Get stale products
GET /api/products/stale
```

#### Provider Endpoints (Simulated External APIs)
```http
# Provider One products
GET /api/provider-one

# Provider Two products
GET /api/provider-two

# Provider Three products
GET /api/provider-three

# Provider Four products
GET /api/provider-four
```

#### Data Visualization
```http
# View real-time product changes
GET /api/visualize

# SSE endpoint for real-time updates
GET /api/visualize/events
```

#### Health & Documentation
```http
# Health check
GET /api/health

# Swagger documentation
GET /api-docs
```

## Database Management

```bash
# View database UI
npm run prisma:studio

# Generate Prisma client
npm run prisma:generate

# Apply database migrations
npm run prisma:migrate

# Create a new migration
npx prisma migrate dev --name <migration_name>
```

## Architecture

This application implements:

1. **Clean Architecture**: Separation of concerns with distinct layers (domain, application, infrastructure)
2. **Repository Pattern**: Abstracting data access behind repository interfaces
3. **Dependency Injection**: NestJS's built-in DI container for managing dependencies
4. **Event-Driven Architecture**: Using NestJS event emitter for real-time updates
5. **Resilience Patterns**: Error handling, retries, and graceful degradation

### Data Flow

1. Provider Simulator Services: Simulate external provider APIs with random product data
2. Provider Service: Fetches data from all providers concurrently at configurable intervals
3. Product Repository: Normalizes and stores product data, tracking price and availability history
4. Aggregator Service: Presents unified product data to API consumers

## Development

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

### Code Quality
```bash
# Format code
npm run format

# Lint code
npm run lint
```

## Environment Variables

The project uses environment variables for configuration. A `.env.example` file is provided as a template that you need to copy (as mentioned in step 3 above).

Edit your `.env` file with appropriate values:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/price-aggregator"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
PORT=3000
API_KEY=your-api-key
FETCH_INTERVAL=10000
STALENESS_THRESHOLD=60000
```

**Note**: The `.env` file is excluded from Git in `.gitignore` to prevent committing sensitive information.

## Error Handling and Resilience

The application implements the following resilience patterns:

1. **Automatic Retries**: Failed provider requests are retried with exponential backoff
2. **Circuit Breaker**: Prevents cascading failures when a provider is consistently failing
3. **Fallbacks**: Default values are used when provider data is unavailable
4. **Graceful Degradation**: The system continues to operate (with reduced functionality) when some providers are down
5. **Comprehensive Logging**: Detailed logs for debugging and monitoring

## Performance Optimization

1. **Concurrent Processing**: All provider requests are executed in parallel
2. **Caching**: Frequently accessed data is cached in Redis
3. **Database Indexing**: Appropriate indexes for efficient querying
4. **Query Optimization**: Efficient database queries with proper joining and filtering
5. **Rate Limiting**: Protection against excessive API usage

## License

This project is licensed under the MIT License - see the LICENSE file for details.
