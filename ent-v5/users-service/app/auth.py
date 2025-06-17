import os
import requests
from fastapi import Depends, HTTPException, status, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from pydantic import BaseModel
from typing import List, Optional, Dict

# Setup security
security = HTTPBearer()

# Keycloak configuration
KEYCLOAK_URL = os.environ.get("KEYCLOAK_URL", "http://keycloak:8080")
KEYCLOAK_REALM = os.environ.get("KEYCLOAK_REALM", "master")
KEYCLOAK_CLIENT_ID = os.environ.get("KEYCLOAK_CLIENT_ID", "file-upload-service")  # Match the existing client
KEYCLOAK_CLIENT_SECRET = os.environ.get("KEYCLOAK_CLIENT_SECRET", "your-client-secret")
KEYCLOAK_ADMIN_USERNAME = os.environ.get("KEYCLOAK_ADMIN_USERNAME", "admin")
KEYCLOAK_ADMIN_PASSWORD = os.environ.get("KEYCLOAK_ADMIN_PASSWORD", "admin")

# Cache for public key
public_key = None

class Token(BaseModel):
    """Model for token response."""
    access_token: str
    token_type: str
    refresh_token: str
    expires_in: int
    refresh_expires_in: int

class KeycloakUser(BaseModel):
    """Model for Keycloak user information."""
    id: str
    username: str
    email: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    enabled: bool = True
    roles: List[str] = []

def get_admin_token() -> str:
    """Get admin token from Keycloak for user management."""
    try:
        url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
        data = {
            "grant_type": "password",
            "client_id": "admin-cli",
            "username": KEYCLOAK_ADMIN_USERNAME,
            "password": KEYCLOAK_ADMIN_PASSWORD
        }
        response = requests.post(url, data=data)
        response.raise_for_status()
        return response.json()["access_token"]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get admin token: {str(e)}"
        )

def get_keycloak_public_key():
    """Retrieve the public key from Keycloak for JWT validation."""
    global public_key
    
    if public_key is None:
        try:
            url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"
            response = requests.get(url)
            response.raise_for_status()
            key_data = response.json()
            public_key = f"-----BEGIN PUBLIC KEY-----\n{key_data['public_key']}\n-----END PUBLIC KEY-----"
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve Keycloak public key: {str(e)}"
            )
    
    return public_key

async def get_user_from_keycloak(user_id: str) -> KeycloakUser:
    """Get user information from Keycloak by user ID."""
    try:
        admin_token = get_admin_token()
        headers = {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }
        
        # Get user details
        url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        user_data = response.json()
        
        # Get user roles
        roles_url = f"{url}/role-mappings/realm"
        roles_response = requests.get(roles_url, headers=headers)
        roles_response.raise_for_status()
        roles = [role["name"] for role in roles_response.json()]
        
        return KeycloakUser(
            id=user_data["id"],
            username=user_data["username"],
            email=user_data.get("email"),
            firstName=user_data.get("firstName"),
            lastName=user_data.get("lastName"),
            enabled=user_data.get("enabled", True),
            roles=roles
        )
    except requests.HTTPError as e:
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user from Keycloak: {str(e)}"
        )

async def list_users_from_keycloak(role: Optional[str] = None) -> List[KeycloakUser]:
    """List users from Keycloak, optionally filtered by role."""
    try:
        admin_token = get_admin_token()
        headers = {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }
        
        # Get all users
        url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        users_data = response.json()
        
        users = []
        for user_data in users_data:
            # Get user roles
            roles_url = f"{url}/{user_data['id']}/role-mappings/realm"
            roles_response = requests.get(roles_url, headers=headers)
            roles_response.raise_for_status()
            roles = [role["name"] for role in roles_response.json()]
              # Filter by role if specified
            if role and role not in roles:
                continue
                
            users.append(KeycloakUser(
                id=user_data["id"],
                username=user_data["username"],
                email=user_data.get("email"),
                firstName=user_data.get("firstName"),
                lastName=user_data.get("lastName"),
                enabled=user_data.get("enabled", True),
                roles=roles
            ))
        
        return users
    except requests.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list users from Keycloak: {str(e)}"
        )

async def authenticate_user(username: str, password: str) -> Token:
    """Authenticate user with Keycloak and return tokens."""
    try:
        url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
        data = {
            "grant_type": "password",
            "client_id": KEYCLOAK_CLIENT_ID,
            "client_secret": KEYCLOAK_CLIENT_SECRET,
            "username": username,
            "password": password
        }
        response = requests.post(url, data=data)
        response.raise_for_status()
        return Token(**response.json())
    except requests.HTTPError as e:
        if e.response.status_code == 401:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

async def refresh_token(refresh_token: str) -> Token:
    """Refresh access token using refresh token."""
    try:
        url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
        data = {
            "grant_type": "refresh_token",
            "client_id": KEYCLOAK_CLIENT_ID,
            "client_secret": KEYCLOAK_CLIENT_SECRET,
            "refresh_token": refresh_token
        }
        response = requests.post(url, data=data)
        response.raise_for_status()
        return Token(**response.json())
    except requests.HTTPError as e:
        if e.response.status_code == 400:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> KeycloakUser:
    """Validate JWT token and extract user information."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        key = get_keycloak_public_key()
        
        # Decode and verify the token
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            options={'verify_aud': False}  # Skip audience validation
        )
        
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
        # Get full user information from Keycloak
        return await get_user_from_keycloak(user_id)
        
    except JWTError as e:
        print(f"JWT Error: {str(e)}")  # For debugging
        raise credentials_exception
    except Exception as e:
        print(f"Unexpected error: {str(e)}")  # For debugging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}"
        )

async def create_keycloak_user(
    username: str,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    role: str
) -> str:
    """Create a new user in Keycloak and return the user ID."""
    try:
        admin_token = get_admin_token()
        headers = {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }

        # Create user
        url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users"
        user_data = {
            "username": username,
            "email": email,
            "firstName": first_name,
            "lastName": last_name,
            "enabled": True,
            "credentials": [{
                "type": "password",
                "value": password,
                "temporary": False
            }]
        }
        
        response = requests.post(url, headers=headers, json=user_data)
        response.raise_for_status()
        
        # Get user ID
        users_url = f"{url}?username={username}&exact=true"
        response = requests.get(users_url, headers=headers)
        response.raise_for_status()
        user_id = response.json()[0]["id"]
          # Add role
        role_name = role  # "teacher" or "student"
        roles_url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/roles/{role_name}"
        response = requests.get(roles_url, headers=headers)
        response.raise_for_status()
        role_data = response.json()
        
        # Assign role to user
        role_url = f"{url}/{user_id}/role-mappings/realm"
        role_payload = [{
            "id": role_data["id"],
            "name": role_data["name"],
            "composite": False,
            "clientRole": False
        }]
        
        response = requests.post(role_url, headers=headers, json=role_payload)
        response.raise_for_status()
        
        return user_id
        
    except requests.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create Keycloak user: {str(e)}"
        )

async def get_keycloak_user(user_id: str) -> KeycloakUser:
    """Get user information from Keycloak by user ID without token validation."""
    try:
        admin_token = get_admin_token()
        headers = {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }
        
        # Get user details
        url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        user_data = response.json()
        
        # Get user roles
        roles_url = f"{url}/role-mappings/realm"
        roles_response = requests.get(roles_url, headers=headers)
        roles_response.raise_for_status()
        roles = [role["name"] for role in roles_response.json()]
        
        return KeycloakUser(
            id=user_data["id"],
            username=user_data["username"],
            email=user_data.get("email"),
            firstName=user_data.get("firstName"),
            lastName=user_data.get("lastName"),
            enabled=user_data.get("enabled", True),
            roles=roles
        )
    except requests.HTTPError as e:
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user from Keycloak: {str(e)}"
        )