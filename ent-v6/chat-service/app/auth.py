import os
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from typing import List, Optional

from app.models import TokenData

# Setup security
security = HTTPBearer()

# Keycloak configuration
KEYCLOAK_URL = os.environ.get("KEYCLOAK_URL", "http://keycloak:8080")
KEYCLOAK_REALM = os.environ.get("KEYCLOAK_REALM", "master")
KEYCLOAK_CLIENT_ID = os.environ.get("KEYCLOAK_CLIENT_ID", "file-upload-service")

# Cache for public key
public_key = None

class User(BaseModel):
    """Model for authenticated user."""
    username: str
    email: Optional[str] = None
    roles: List[str] = []

def get_keycloak_public_key():
    """Retrieve the public key from Keycloak for JWT validation."""
    global public_key
    
    if public_key is None:
        try:
            # Get the public key from Keycloak
            url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"
            response = requests.get(url)
            response.raise_for_status()
            
            # Extract the public key
            key_data = response.json()
            public_key = f"-----BEGIN PUBLIC KEY-----\n{key_data['public_key']}\n-----END PUBLIC KEY-----"
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve Keycloak public key: {str(e)}"
            )
    
    return public_key

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Validate JWT token and extract user information."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Get the token from the Authorization header
        token = credentials.credentials
        
        # Get the public key for validation
        key = get_keycloak_public_key()
        
        # Decode and validate the token
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=KEYCLOAK_CLIENT_ID
        )
        
        # Extract user information
        token_data = TokenData(**payload)
        
        if token_data.sub is None:
            raise credentials_exception
        
        # Extract roles from the token
        roles = []
        if token_data.realm_access and "roles" in token_data.realm_access:
            roles = token_data.realm_access["roles"]
        
        # Create user object
        user = User(
            username=token_data.preferred_username or token_data.sub,
            email=token_data.email,
            roles=roles
        )
        
        return user
    except JWTError:
        raise credentials_exception
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}"
        )