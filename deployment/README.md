# Deployment

This directory contains deployment-related files for the Price Aggregator application.

## Files

- `docker-compose.yml` - Docker Compose configuration for running the application and its dependencies
- `deploy.sh` - Deployment script with various options for managing the application environment

## Usage

### Docker Compose

To run the application with Docker Compose:

```bash
# Start just the dependencies (Postgres and Redis) for development
docker-compose -f deployment/docker-compose.yml up -d postgres redis

# Start the entire stack including the API
docker-compose -f deployment/docker-compose.yml up -d
```

### Deployment Script

The deployment script provides various options for managing the application:

```bash
# To see all available options
./deployment/deploy.sh --help

# Start in development mode (starts Postgres and Redis only)
./deployment/deploy.sh --dev

# Start in production mode (starts all services)
./deployment/deploy.sh --prod

# Stop all containers
./deployment/deploy.sh --down
```
