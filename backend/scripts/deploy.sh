#!/bin/bash

# Production deployment script
set -e

echo "íº€ Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="portfolio-enterprise"
DOCKER_IMAGE="$PROJECT_NAME:latest"
BACKUP_DIR="/backups"
COMPOSE_FILE="docker-compose.yml"

echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}docker-compose is not installed. Please install it and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}Prerequisites check passed!${NC}"

echo -e "${YELLOW}Creating backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup database
BACKUP_FILE="$BACKUP_DIR/db-backup-$(date +%Y%m%d-%H%M%S).gz"
if docker-compose exec -T mongodb mongodump --archive --gzip > $BACKUP_FILE; then
    echo -e "${GREEN}Database backup created: $BACKUP_FILE${NC}"
else
    echo -e "${RED}Database backup failed!${NC}"
    exit 1
fi

echo -e "${YELLOW}Building application...${NC}"

# Build Docker image
if docker build -t $DOCKER_IMAGE .; then
    echo -e "${GREEN}Docker image built successfully!${NC}"
else
    echo -e "${RED}Docker build failed!${NC}"
    exit 1
fi

echo -e "${YELLOW}Running tests...${NC}"

# Run tests in Docker container
if docker run --rm $DOCKER_IMAGE npm test; then
    echo -e "${GREEN}All tests passed!${NC}"
else
    echo -e "${RED}Tests failed! Deployment aborted.${NC}"
    exit 1
fi

echo -e "${YELLOW}Deploying application...${NC}"

# Stop existing containers
docker-compose down

# Start new containers
if docker-compose -f $COMPOSE_FILE up -d; then
    echo -e "${GREEN}Application deployed successfully!${NC}"
else
    echo -e "${RED}Deployment failed!${NC}"
    exit 1
fi

echo -e "${YELLOW}Running post-deployment tasks...${NC}"

# Wait for application to be ready
echo "Waiting for application to start..."
sleep 30

# Check if application is healthy
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}Application is healthy!${NC}"
else
    echo -e "${RED}Application health check failed!${NC}"
    exit 1
fi

# Run database migrations
if docker-compose exec app npm run migrate; then
    echo -e "${GREEN}Database migrations completed!${NC}"
else
    echo -e "${YELLOW}Database migrations failed or not needed.${NC}"
fi

# Clean up old Docker images
echo -e "${YELLOW}Cleaning up old images...${NC}"
docker image prune -f

echo -e "${GREEN}í¾‰ Deployment completed successfully!${NC}"
echo -e "${GREEN}Application is running at: http://localhost:5000${NC}"
echo -e "${GREEN}Health check: http://localhost:5000/health${NC}"
echo -e "${GREEN}API documentation: http://localhost:5000/docs${NC}"
