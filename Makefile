# TASC Blog Article Agent v2 - Docker Management

.PHONY: help dev prod stop clean logs

# Default target
help:
	@echo "TASC Blog Article Agent v2 - Docker Commands"
	@echo ""
	@echo "Available commands:"
	@echo "  make dev     - Start development environment"
	@echo "  make prod    - Start production environment"
	@echo "  make stop    - Stop all services"
	@echo "  make clean   - Remove containers and volumes"
	@echo "  make logs    - Show logs for all services"
	@echo "  make restart - Restart all services"
	@echo ""

# Development environment
dev:
	@echo "Starting TASC Blog Article Agent v2 in development mode..."
	docker-compose -f docker-compose.dev.yml up --build

# Production environment
prod:
	@echo "Starting TASC Blog Article Agent v2 in production mode..."
	docker-compose up --build -d

# Stop all services
stop:
	@echo "Stopping all services..."
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

# Clean up containers and volumes
clean:
	@echo "Cleaning up containers and volumes..."
	docker-compose down -v --remove-orphans
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f

# Show logs
logs:
	docker-compose logs -f

# Restart services
restart: stop dev