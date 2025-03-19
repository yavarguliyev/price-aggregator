#!/bin/bash

# Exit on error
set -e

# Display help message
display_help() {
  echo "Price Aggregator Deployment Script"
  echo ""
  echo "Usage:"
  echo "  ./deploy.sh [option]"
  echo ""
  echo "Options:"
  echo "  --dev          Start in development mode"
  echo "  --prod         Start in production mode"
  echo "  --build        Build the containers"
  echo "  --down         Stop the containers"
  echo "  --clean        Remove containers, images, and volumes"
  echo "  --prune        Remove unused Docker resources (images, volumes, networks)"
  echo "  --logs         Show container logs"
  echo "  --restart      Restart containers"
  echo "  --status       Show container status"
  echo "  --help         Display this help message"
  echo ""
}

# Check if .env file exists, if not, create it
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cp .env.example .env || echo "API_KEY=test-api-key-1234" > .env
  echo ".env file created. Please edit it with your configurations."
fi

# Parse command-line arguments
COMMAND=""
BUILD=""
CLEAN=""
PRUNE=""
RESTART=""
STATUS=""

if [ "$#" -eq 0 ]; then
  display_help
  exit 0
fi

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dev)
      COMMAND="docker compose up -d postgres redis"
      echo "Starting development environment..."
      ;;
    --prod)
      COMMAND="docker compose up -d"
      echo "Starting production environment..."
      ;;
    --build)
      BUILD="--build"
      echo "Building containers..."
      ;;
    --down)
      COMMAND="docker compose down"
      echo "Stopping containers..."
      ;;
    --clean)
      CLEAN=true
      echo "Removing containers, images, and volumes..."
      ;;
    --prune)
      PRUNE=true
      echo "Pruning unused Docker resources..."
      ;;
    --logs)
      COMMAND="docker compose logs -f"
      echo "Showing logs..."
      ;;
    --restart)
      RESTART=true
      echo "Restarting containers..."
      ;;
    --status)
      STATUS=true
      echo "Showing container status..."
      ;;
    --help)
      display_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      display_help
      exit 1
      ;;
  esac
  shift
done

# Execute command for status (doesn't affect other commands)
if [ "$STATUS" = true ]; then
  docker compose ps
fi

# Clean up containers, images, and volumes
if [ "$CLEAN" = true ]; then
  echo "Stopping and removing containers..."
  docker compose down --rmi all --volumes --remove-orphans
  echo "Cleanup completed!"
fi

# Prune unused Docker resources
if [ "$PRUNE" = true ]; then
  echo "Pruning unused Docker resources..."
  docker system prune -af --volumes
  echo "Pruning completed!"
fi

# Restart containers
if [ "$RESTART" = true ]; then
  echo "Restarting containers..."
  docker compose restart
  echo "Restart completed!"
fi

# Execute main command
if [ -n "$COMMAND" ]; then
  if [ -n "$BUILD" ] && [ "$COMMAND" != "docker compose down" ] && [ "$COMMAND" != "docker compose logs -f" ]; then
    $COMMAND $BUILD
  else
    $COMMAND
  fi
fi

# If we're in dev mode, start the app after the services
if [ "$COMMAND" = "docker compose up -d postgres redis" ]; then
  echo "Starting application in development mode..."
  npm run start:dev
fi

echo "Deployment completed!" 