from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from urllib.parse import urlparse
import os

from app.auth import get_current_user, User
from app.database import get_cassandra_session
from app.storage import get_minio_client
from app.models import Course, DownloadResponse
from datetime import timedelta
from uuid import UUID

app = FastAPI(title="Course Download Service", description="Service for listing and downloading course files")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define routes
# @app.get("/courses", response_model=List[Course])
# async def list_courses(current_user: User = Depends(get_current_user)):
#     """List all available courses."""
#     # Verify user has student role
#     if "student" not in current_user.roles:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only students can access course listings"
#         )
    
#     try:
#         # Get Cassandra session
#         session = get_cassandra_session()
        
#         # Query all courses from Cassandra
#         query = "SELECT id, title, description FROM courses.course"
#         rows = session.execute(query)
        
#         # Convert rows to Course objects
#         courses = [Course(id=row.id, title=row.title, description=row.description) for row in rows]
        
#         return courses
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to retrieve courses: {str(e)}"
#         )

@app.get("/courses", response_model=List[Course])
async def list_courses():
    """List all available courses."""
    try:
        # Get Cassandra session
        session = get_cassandra_session()
        
        # Query all courses from Cassandra
        query = "SELECT id, title, description, sector_id FROM course_files.files"
        rows = session.execute(query)
        
        # Convert rows to Course objects
        courses = [
            Course(
                id=str(row["id"]),
                title=row["title"],
                description=row["description"],
                sector_id=row.get("sector_id")  # Using get() in case sector_id is nullable
            )
            for row in rows
        ]
        return courses
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve courses: {str(e)}"
        )

# @app.get("/courses/{course_id}/download", response_model=DownloadResponse)
# async def generate_download_url(course_id: str, current_user: User = Depends(get_current_user)):
#     """Generate a secure download URL for a course file."""
#     # Verify user has student role
#     if "student" not in current_user.roles:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only students can download course files"
#         )
    
#     try:
#         # Get Cassandra session
#         session = get_cassandra_session()
        
#         # Query course from Cassandra
#         query = "SELECT id, title, file_path FROM courses.course WHERE id = %s"
#         row = session.execute(query, [course_id]).one()
        
#         if not row:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail=f"Course with ID {course_id} not found"
#             )
        
#         # Get MinIO client
#         minio_client = get_minio_client()
        
#         # Generate pre-signed URL
#         bucket_name = os.environ.get("MINIO_BUCKET_NAME", "courses")
#         expiry = int(os.environ.get("PRESIGNED_URL_EXPIRY", 3600))  # Default: 1 hour
        
#         # Get the file path from the database
#         file_path = row.file_path
        
#         # Generate pre-signed URL for the file
#         url = minio_client.presigned_get_object(
#             bucket_name=bucket_name,
#             object_name=file_path,
#             expires=expiry
#         )
        
#         return DownloadResponse(download_url=url)
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to generate download URL: {str(e)}"
#         )

# @app.get("/courses/{course_id}/download", response_model=DownloadResponse)
# async def generate_download_url(course_id: str):
#     """Generate a secure download URL for a course file."""
#     # Verify user has student role

    
#     try:
#         # Get Cassandra session
#         session = get_cassandra_session()
        
#         course_uuid = UUID(course_id)
#         # Query course from Cassandra
#         query = "SELECT id, title, url FROM course_files.files WHERE id = %s"
#         row = session.execute(query, [course_uuid]).one()
        
#         if not row:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail=f"Course with ID {course_id} not found"
#             )
        
#         # Get MinIO client
#         minio_client = get_minio_client()
        
#         # Generate pre-signed URL
#         bucket_name = os.environ.get("MINIO_BUCKET_NAME", "course_files")
#         # expiry = int(os.environ.get("PRESIGNED_URL_EXPIRY", 3600))  # Default: 1 hour
#         expiry_seconds = int(os.environ.get("PRESIGNED_URL_EXPIRY", 3600))
#         expiry = timedelta(seconds=expiry_seconds)   
#         # Get the file path from the database
#         file_path = row["url"]
#         # Generate pre-signed URL for the file
#         url = minio_client.presigned_get_object(
#             bucket_name=bucket_name,
#             object_name=file_path,
#             expires=expiry
#         )
        
#         return DownloadResponse(download_url=url)
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to generate download URL: {str(e)}"
#         )


@app.get("/courses/{course_id}/download", response_model=DownloadResponse)
async def generate_download_url(course_id: str):
    """Generate a secure download URL for a course file."""
    try:
        # Get Cassandra session
        session = get_cassandra_session()
        
        course_uuid = UUID(course_id)
        
        # Query course from Cassandra
        query = "SELECT id, title, url FROM course_files.files WHERE id = %s"
        row = session.execute(query, [course_uuid]).one()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course with ID {course_id} not found"
            )
        
        minio_client = get_minio_client()
        bucket_name = os.environ.get("MINIO_BUCKET_NAME", "courses")
        expiry_seconds = int(os.environ.get("PRESIGNED_URL_EXPIRY", 3600))
        expiry = timedelta(seconds=expiry_seconds)

        full_url = row["url"]
        parsed_url = urlparse(full_url)
        object_path = parsed_url.path.lstrip("/")

        # Remove redundant "courses/" prefix if already present in object path
        if object_path.startswith(f"{bucket_name}/"):
            object_path = object_path[len(bucket_name)+1:]

        print(f"[DEBUG] Cleaned object path: {object_path}")

        url = minio_client.presigned_get_object(
            bucket_name=bucket_name,
            object_name=object_path,
            expires=expiry
        )

        print(f"[DEBUG] Generated download URL: {url}")

        return DownloadResponse(download_url=url)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate download URL: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}