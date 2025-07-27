# Docker Setup for TASC Blog Article Agent v2

This document explains how to run the TASC Blog Article Agent v2 using Docker for consistent development and testing environments.

## Architecture

The application is containerized into three main services:

1. **Frontend** (Next.js) - Port 3000
2. **Mastra Backend** - Port 4111  
3. **Deep Research Agent** - Port 4112

## Prerequisites

- Docker and Docker Compose installed
- Environment variables configured (see `.env.example`)

## Quick Start

### Development Environment

```bash
# Start development environment with hot reloading
make dev

# Or manually:
docker-compose -f docker-compose.dev.yml up --build
```

### Production Environment

```bash
# Start production environment
make prod

# Or manually:
docker-compose up --build -d
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key
EXA_API_KEY=your_exa_api_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database (automatically configured for Docker)
DATABASE_URL=file:/app/data/storage.db
```

## Available Commands

```bash
make help     # Show all available commands
make dev      # Start development environment
make prod     # Start production environment
make stop     # Stop all services
make clean    # Remove containers and volumes
make logs     # Show logs for all services
make restart  # Restart all services
```

## Service Access

Once running, access the services at:

- **Frontend**: http://localhost:3000
- **Mastra Backend**: http://localhost:4111
- **Mastra API Docs**: http://localhost:4111/swagger-ui
- **Deep Research Agent**: http://localhost:4112

## Data Persistence

- Database files are stored in Docker volumes
- Development mode mounts source code for hot reloading
- Production mode uses optimized builds

## Troubleshooting

### Service Won't Start
```bash
# Check logs
make logs

# Clean and restart
make clean
make dev
```

### Port Conflicts
If ports 3000, 4111, or 4112 are in use, modify the port mappings in the docker-compose files.

### Environment Issues
Ensure your `.env` file contains all required variables and is in the project root.

## Development Workflow

1. Make code changes in `src/`
2. Changes are automatically reflected (hot reload in dev mode)
3. Database changes persist in Docker volumes
4. Use `make logs` to monitor all services

## Benefits

- ✅ Consistent environment across development/production
- ✅ Isolated dependencies and services  
- ✅ Easy cleanup and fresh starts
- ✅ Simplified deployment process
- ✅ Better debugging with containerized services