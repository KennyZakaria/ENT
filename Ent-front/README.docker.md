# Running ENT Frontend with Docker

This document provides instructions for running the ENT Frontend application using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Production Build

To build and run the production version of the application:

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at http://localhost:4200

## Development Build

For development with hot reloading:

```bash
# Build and start the development container
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop the container
docker-compose -f docker-compose.dev.yml down
```

The development server will be available at http://localhost:4200

## Environment Configuration

The application uses environment variables defined in `src/environments/environment.ts`. If you need to connect to backend services running on the host machine from within the Docker container, you may need to replace `localhost` with:

- On Linux/macOS: `host.docker.internal`
- On Windows: `host.docker.internal`

For example, update your environment.ts file:

```typescript
export const environment = {
  production: false,
  uploadApiUrl: 'http://host.docker.internal:8000',
  // ... other URLs similarly
};
```

## Building Custom Images

To build a custom Docker image:

```bash
# Production image
docker build -t ent-frontend:latest .

# Development image
docker build -f Dockerfile.dev -t ent-frontend:dev .
```

## Troubleshooting

### Connection Issues to Backend Services

If the frontend cannot connect to backend services, check:

1. That backend services are running and accessible
2. That environment URLs are correctly configured to use `host.docker.internal` instead of `localhost`
3. Network configuration in docker-compose files

### Performance Issues

On Windows and macOS, volume mounts can be slow. Consider using:

- Docker Desktop WSL2 backend on Windows
- Docker Desktop with VirtioFS on macOS