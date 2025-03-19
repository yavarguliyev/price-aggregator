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
  echo "  --logs         Show container logs"
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

if [ "$#" -eq 0 ]; then
  display_help
  exit 0
fi

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dev)
      COMMAND="docker-compose up -d postgres redis"
      echo "Starting development environment..."
      ;;
    --prod)
      COMMAND="docker-compose up -d"
      echo "Starting production environment..."
      ;;
    --build)
      BUILD="--build"
      echo "Building containers..."
      ;;
    --down)
      COMMAND="docker-compose down"
      echo "Stopping containers..."
      ;;
    --logs)
      COMMAND="docker-compose logs -f"
      echo "Showing logs..."
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

# Execute command
if [ -n "$COMMAND" ]; then
  if [ -n "$BUILD" ] && [ "$COMMAND" != "docker-compose down" ] && [ "$COMMAND" != "docker-compose logs -f" ]; then
    $COMMAND $BUILD
  else
    $COMMAND
  fi
fi

# If we're in dev mode, start the app after the services
if [ "$COMMAND" = "docker-compose up -d postgres redis" ]; then
  echo "Starting application in development mode..."
  npm run start:dev
fi

echo "Deployment completed!" 