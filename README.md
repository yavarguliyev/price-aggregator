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

4. Start the database services (PostgreSQL and Redis):
```bash
npm run docker:db
```

5. Apply database migrations:
```bash
npm run prisma:migrate
```

6. Start the application:
```bash
npm run start:dev
```

The application will be available at http://localhost:3000

## Project Structure

The project follows Clean Architecture principles:

```
src/
├── api/              # API layer (controllers, routes)
├── application/      # Application layer (use cases, services)
├── core/            # Core layer (interfaces, shared code)
├── domain/          # Domain layer (entities, value objects)
└── infrastructure/  # Infrastructure layer (repositories, external services)
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
  - provider: string (optional) - Filter by provider name
  - page: number (optional) - Page number (default: 1)
  - limit: number (optional) - Items per page (default: 10)
  - includeStale: boolean (optional) - Include stale products

# Get product by ID
GET /api/products/:id

# Get products with changes
GET /api/products/changes
Query Parameters:
  - timeframe: number (optional) - Time window in minutes (default: 60)

# Get stale products
GET /api/products/stale
```

#### Provider Simulators
```http
# Provider One products
GET /api/provider-one/products

# Provider Two products
GET /api/provider-two/products

# Provider Three products
GET /api/provider-three/products
```

#### Health & Documentation
```http
# Health check
GET /api/health

# Swagger documentation
GET /api-docs

# Real-time visualization
GET /visualize
```

## Docker Commands

The application includes convenient npm scripts for Docker operations:

```bash
# Start database services (PostgreSQL + Redis)
npm run docker:db

# View database UI
npm run prisma:studio

# Generate Prisma client
npm run prisma:generate

# Apply database migrations
npm run prisma:migrate
```

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.
