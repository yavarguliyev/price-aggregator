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
