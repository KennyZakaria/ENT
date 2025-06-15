# File Upload Microservice

This microservice allows teachers to upload course files. Files are stored in MinIO, and associated metadata (title, description, file URL) is stored in Cassandra.

## Features

- JWT-based authentication via Keycloak
- Role-based access control (teacher role required)
- File upload to MinIO storage
- Metadata storage in Cassandra
- File validation (size and type)

## API Endpoints

### POST /courses/upload

Uploads a new course file.

**Headers:**
- Authorization: Bearer <token>

**Request Body (multipart/form-data):**
- file: (binary) the course file
- title: (string) course title
- description: (string) course description

**Response:** 201 Created
```json
{
  "title": "Course Title",
  "description": "Course Description",
  "url": "https://minio.example.com/courses/filename.pdf"
}
```

## Tech Stack

- Backend: FastAPI
- Storage: MinIO (S3-compatible), Cassandra (NoSQL DB)
- Auth: Keycloak JWT Middleware
- Containerization: Docker

## Setup

1. Install dependencies: `pip install -r requirements.txt`
2. Set environment variables (see `.env.example`)
3. Run the application: `uvicorn app.main:app --reload`

## Environment Variables

See `.env.example` for required environment variables.