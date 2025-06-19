# ENT Backoffice

A modern user management dashboard built with Angular.

## Running with Docker

This application can be run using Docker, which simplifies setup and ensures consistent environments across different machines.

### Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

### Building and Running the Application

1. **Using Docker Compose (Recommended)**

   ```bash
   # Build and start the container
   docker-compose up -d
   ```

   This will build the Docker image and start the container in detached mode. The application will be available at http://localhost:4200.

2. **Using Docker directly**

   ```bash
   # Build the Docker image
   docker build -t ent-backoffice .

   # Run the container
   docker run -p 4200:80 -d --name ent-backoffice ent-backoffice
   ```

   The application will be available at http://localhost:4200.

### Stopping the Application

1. **Using Docker Compose**

   ```bash
   docker-compose down
   ```

2. **Using Docker directly**

   ```bash
   docker stop ent-backoffice
   docker rm ent-backoffice
   ```

## Development

For local development without Docker:

```bash
npm install
npm start
```

The application will be available at http://localhost:4200.

## Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/ent-backoffice/browser` directory.