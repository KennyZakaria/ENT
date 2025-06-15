from fastapi import HTTPException, UploadFile, status
from jose import jwt, JWTError
from minio.error import S3Error
import os
import uuid
import requests
from datetime import datetime

# File validation function
def validate_file(file: UploadFile, max_file_size: int, allowed_file_types: list):
    """
    Validates uploaded file size and type
    
    Args:
        file: The uploaded file
        max_file_size: Maximum allowed file size in bytes
        allowed_file_types: List of allowed file extensions
    
    Raises:
        HTTPException: If file validation fails
    """
    # Check file size
    file.file.seek(0, 2)  # Move to end of file
    file_size = file.file.tell()  # Get current position (file size)
    file.file.seek(0)  # Reset file position
    
    if file_size > max_file_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed size of {max_file_size} bytes"
        )
    
    # Check file type
    file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ""
    if file_extension not in allowed_file_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_file_types)}"
        )

# Token verification function
async def verify_token(token: str, keycloak_url: str, keycloak_realm: str, keycloak_client_id: str):
    """
    Verifies JWT token from Keycloak and checks for teacher role
    
    Args:
        token: JWT token string
        keycloak_url: Keycloak server URL
        keycloak_realm: Keycloak realm name
        keycloak_client_id: Client ID for the application
    
    Returns:
        dict: Token payload if valid
    
    Raises:
        HTTPException: If token is invalid or user lacks teacher role
    """
    try:
        # Get Keycloak public key for token verification
        keycloak_cert_url = f"{keycloak_url}/realms/{keycloak_realm}"
        response = requests.get(f"{keycloak_cert_url}")
        keycloak_public_key = response.json().get("public_key")
        
        if not keycloak_public_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not retrieve Keycloak public key"
            )
            
        # Verify token
        payload = jwt.decode(
            token,
            f"-----BEGIN PUBLIC KEY-----\n{keycloak_public_key}\n-----END PUBLIC KEY-----",
            algorithms=["RS256"],
            audience=keycloak_client_id
        )
        
        # Check if user has teacher role
        realm_access = payload.get("realm_access", {})
        roles = realm_access.get("roles", [])
        
        if "teacher" not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only teachers can upload files"
            )
            
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}"
        )

# File upload function
def upload_to_minio(minio_client, file: UploadFile, bucket_name: str):
    """
    Uploads file to MinIO storage
    
    Args:
        minio_client: Initialized MinIO client
        file: The uploaded file
        bucket_name: Name of the MinIO bucket
    
    Returns:
        tuple: (file_id, unique_filename)
    
    Raises:
        HTTPException: If upload fails
    """
    try:
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ""
        unique_filename = f"{file_id}.{file_extension}"
        
        # Upload file to MinIO
        file_data = file.file.read()
        file.file.seek(0)  # Reset file position after reading
        
        minio_client.put_object(
            bucket_name=bucket_name,
            object_name=unique_filename,
            data=file.file,
            length=len(file_data),
            content_type=file.content_type
        )
        
        return file_id, unique_filename
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