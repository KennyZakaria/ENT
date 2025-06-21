from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv
from minio import Minio
from minio.error import S3Error

# Import utility functions and database client
from app.utils import validate_file, verify_token, upload_to_minio
from app.database import CassandraClient

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="File Upload Microservice", description="Microservice for uploading course files")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Security
security = HTTPBearer()

# MinIO configuration
minio_client = Minio(
    endpoint=os.getenv("MINIO_ENDPOINT", "192.168.1.90:9000"),
    access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
    secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
    secure=os.getenv("MINIO_SECURE", "False").lower() == "true",
)

# Initialize Cassandra client
cassandra_client = CassandraClient()

# Keycloak configuration
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://192.168.1.90:8080")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "master")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "  ")

# Bucket name for MinIO
BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME", "courses")

# File validation settings
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "104857600"))  # 100MB default
ALLOWED_FILE_TYPES = os.getenv("ALLOWED_FILE_TYPES", "pdf,doc,docx,ppt,pptx,txt,mp4,avi,mov").split(",")

# Create bucket if it doesn't exist
try:
    if not minio_client.bucket_exists(BUCKET_NAME):
        minio_client.make_bucket(BUCKET_NAME)
        print(f"Bucket '{BUCKET_NAME}' created successfully")
    else:
        print(f"Bucket '{BUCKET_NAME}' already exists")
except S3Error as e:
    print(f"Error creating bucket: {e}")

# Authentication dependency
async def get_current_teacher(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    return await verify_token(token, KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID)

# Optional authentication for testing
async def get_optional_teacher(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        return await verify_token(token, KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID)
    except HTTPException:
        # For testing purposes, return a default teacher ID
        return {"sub": "test-teacher-id"}

# API endpoints
@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

@app.post("/courses/upload", status_code=status.HTTP_201_CREATED)
async def upload_course_file(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(...),
    sector_id: str = Form(None),
    token_data: dict = Depends(get_optional_teacher)
):
    try:
        # Validate file
        validate_file(file, MAX_FILE_SIZE, ALLOWED_FILE_TYPES)
        
        # Upload file to MinIO
        file_id, unique_filename = upload_to_minio(minio_client, file, BUCKET_NAME)
        
        # Generate file URL
        default_url = f"http://{os.getenv('MINIO_ENDPOINT', 'localhost:9000')}"
        file_url = f"{os.getenv('MINIO_PUBLIC_URL', default_url)}/{BUCKET_NAME}/{unique_filename}"
        
        # Store metadata in Cassandra
        teacher_id = token_data.get("sub", "unknown")
        cassandra_client.store_file_metadata(
            file_id=file_id,
            title=title,
            description=description,
            url=file_url,
            original_filename=file.filename,
            teacher_id=teacher_id,
            sector_id=sector_id
        )
        
        return {
            "title": title,
            "description": description,
            "url": file_url
        }
    except S3Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file to storage: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file upload: {str(e)}"
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Shutdown event
@app.on_event("shutdown")
def shutdown_event():
    cassandra_client.close()

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)