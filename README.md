# Product Price Aggregator

A NestJS application that aggregates pricing and availability data for digital products from multiple external APIs.

## Project Overview

This service collects, processes, and serves pricing and availability data from multiple third-party providers. It features:

- Real-time data collection from simulated provider APIs
- Data normalization and storage
- REST API endpoints for querying the aggregated data
- Price history tracking
- Change monitoring
- Simple HTML visualization of product data

## Tech Stack

- NestJS (TypeScript)
- PostgreSQL with Prisma ORM
- Docker for containerization
- Swagger for API documentation
- Server-Sent Events (SSE) for real-time updates

## Setup and Installation

### Prerequisites

- Node.js (v20+)
- npm
- Docker and Docker Compose

### Installation Steps

1. Clone the repository

```bash
git clone <repository-url>
cd price-aggregator-nest
```

2. Install dependencies

```bash
npm install
```

3. Start the PostgreSQL database using Docker

```bash
docker-compose up -d
```

4. Apply database migrations

```bash
npx prisma migrate dev --name init
```

5. Start the application

```bash
npm run start:dev
```

The application will be available at http://localhost:3000

## API Endpoints

The following endpoints are available:

- `GET /api/products` - Get a list of all aggregated products
  - Query parameters: `name`, `minPrice`, `maxPrice`, `availability`, `provider`
- `GET /api/products/:id` - Get detailed information for a specific product
- `GET /api/products/changes` - Get products with price or availability changes
  - Query parameters: `timeframe` (in minutes)

### Provider Simulators

The application simulates two product providers:

- `GET /api/provider-one/products` - Get products from Provider One
- `GET /api/provider-two/products` - Get products from Provider Two

### Visualization

A simple HTML visualization of products is available at:

- `GET /visualize` - View product updates in real-time

## Documentation

API documentation is available using Swagger at:

- `GET /api` - Swagger UI

## Configuration

Configuration is handled through environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Application port (default: 3000)

These variables can be set in the `.env` file at the root of the project.

## Docker

The application includes Docker Compose configuration for running PostgreSQL:

```bash
docker-compose up -d
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
