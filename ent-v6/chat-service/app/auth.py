import os
import requests
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from typing import List, Optional

from app.models import TokenData

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Setup security
security = HTTPBearer()

# User Management Service configuration
USER_MANAGEMENT_URL = os.environ.get("USER_MANAGEMENT_URL", "http://localhost:8003")

class User(BaseModel):
    """Model for authenticated user."""
    sub: str  # Keycloak UUID, required
    username: str  # Username for display purposes only
    email: Optional[str] = None
    roles: List[str] = []

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Validate JWT token using the User Management Service."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Get the token from the Authorization header
        token = credentials.credentials
        
        # First try to decode the token locally to get the claims
        try:
            # Split the token and get the payload
            parts = token.split('.')
            if len(parts) != 3:
                raise ValueError("Invalid token format")
                
            from base64 import b64decode
            from json import loads
            
            # Decode the payload
            payload = parts[1]
            # Add padding
            payload += '=' * (-len(payload) % 4)
            # Decode and parse JSON
            decoded = loads(b64decode(payload).decode('utf-8'))
            logger.info(f"Decoded token payload: {decoded}")
        except Exception as e:
            logger.error(f"Error decoding token locally: {str(e)}")
            decoded = {}
        
        # Validate token with User Management Service
        headers = {"Authorization": f"Bearer {token}"}
        try:
            response = requests.get(f"{USER_MANAGEMENT_URL}/auth/me", headers=headers)
            response.raise_for_status()
            logger.info("Token validated successfully")
            
            user_data = response.json()
            logger.info(f"User data received from service: {user_data}")
            
            # Try to get sub from multiple possible sources including 'id'
            sub = (
                user_data.get("id") or       # Try service 'id' field first
                user_data.get("sub") or      # Try service 'sub' field
                decoded.get("sub") or        # Try decoded token
                decoded.get("id") or         # Try decoded 'id'
                None                         # Fallback to None
            )
            
            # Try to get username from multiple possible sources
            username = (
                user_data.get("username") or
                user_data.get("preferred_username") or 
                decoded.get("preferred_username") or
                decoded.get("username") or
                user_data.get("sub") or
                user_data.get("id") or
                decoded.get("sub") or
                decoded.get("id")
            )
            
            logger.info(f"Extracted values - username: {username}, sub: {sub}")
            
            # Create user object
            user = User(
                username=username,
                email=user_data.get("email") or decoded.get("email"),
                roles=user_data.get("roles", []),  # Updated to match service response
                sub=sub
            )
            
            logger.info(f"Created user object: username={user.username}, sub={user.sub}")
            
            if not user.username:
                logger.error("No username found in user data")
                raise credentials_exception
                
            return user
            
        except requests.RequestException as e:
            logger.error(f"Error validating token with User Management Service: {str(e)}")
            logger.error(f"Response status code: {getattr(e.response, 'status_code', 'N/A')}")
            logger.error(f"Response text: {getattr(e.response, 'text', 'N/A')}")
            raise credentials_exception
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise credentials_exception

async def validate_token(token: str) -> User:
    """Validate JWT token for WebSocket connections."""
    try:
        logger.debug(f"Validating WebSocket token")
        
        # First try to decode the token locally to get the claims
        try:
            # Split the token and get the payload
            parts = token.split('.')
            if len(parts) != 3:
                raise ValueError("Invalid token format")
                
            from base64 import b64decode
            from json import loads
            
            # Decode the payload
            payload = parts[1]
            # Add padding
            payload += '=' * (-len(payload) % 4)
            # Decode and parse JSON
            decoded = loads(b64decode(payload).decode('utf-8'))
            logger.info(f"Decoded WebSocket token payload: {decoded}")
        except Exception as e:
            logger.error(f"Error decoding WebSocket token locally: {str(e)}")
            decoded = {}
        
        # Validate token with User Management Service
        headers = {"Authorization": f"Bearer {token}"}
        try:
            response = requests.get(f"{USER_MANAGEMENT_URL}/auth/me", headers=headers)
            response.raise_for_status()
            logger.info("WebSocket token validated successfully")
            
            user_data = response.json()
            logger.info(f"WebSocket user data received: {user_data}")
            
            # Try to get sub from multiple possible sources including 'id'
            sub = (
                user_data.get("id") or       # Try service 'id' field first
                user_data.get("sub") or      # Try service 'sub' field
                decoded.get("sub") or        # Try decoded token
                decoded.get("id") or         # Try decoded 'id'
                None                         # Fallback to None
            )
            
            # Try to get username from multiple possible sources
            username = (
                user_data.get("username") or
                user_data.get("preferred_username") or 
                decoded.get("preferred_username") or
                decoded.get("username") or
                user_data.get("sub") or
                user_data.get("id") or
                decoded.get("sub") or
                decoded.get("id")
            )
            
            logger.info(f"Extracted WebSocket values - username: {username}, sub: {sub}")
            
            # Create user object
            user = User(
                username=username,
                email=user_data.get("email") or decoded.get("email"),
                roles=user_data.get("roles", []),  # Updated to match service response
                sub=sub
            )
            
            if not user.username:
                logger.error("No username found in WebSocket user data")
                return None
                
            return user
            
        except requests.RequestException as e:
            logger.error(f"Error validating WebSocket token: {str(e)}")
            logger.error(f"Response status code: {getattr(e.response, 'status_code', 'N/A')}")
            logger.error(f"Response text: {getattr(e.response, 'text', 'N/A')}")
            return None
    except Exception as e:
        logger.error(f"WebSocket token validation error: {str(e)}")
        return None