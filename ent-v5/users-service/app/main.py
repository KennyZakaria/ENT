from fastapi import FastAPI, HTTPException, Depends, status, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
import bcrypt
import os
import requests
from app.auth import (
    get_current_user, authenticate_user, refresh_token,
    create_keycloak_user, Token, KeycloakUser, get_admin_token,
    list_users_from_keycloak, get_keycloak_user
)
from app.database import get_cassandra_session
from app.models import TokenData, Sector, NewUserRequest, UserSectorInfo

app = FastAPI(title="User Management Service", description="Service for managing teachers and students")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication endpoints
@app.post("/auth/login", response_model=Token)
async def login(username: str = Form(...), password: str = Form(...)):
    """Login endpoint that returns access and refresh tokens."""
    return await authenticate_user(username, password)

@app.post("/auth/refresh", response_model=Token)
async def refresh(refresh_token: str = Form(...)):
    """Refresh access token using refresh token."""
    return await refresh_token(refresh_token)

@app.get("/auth/me", response_model=KeycloakUser)
async def get_current_auth_user(current_user: KeycloakUser = Depends(get_current_user)):
    """Get current authenticated user information."""
    return current_user

@app.post("/users/", response_model=KeycloakUser)
async def create_user(user: NewUserRequest):
    """Create a new user (teacher or student) in Keycloak and set up sector relationships."""
    session = get_cassandra_session()
    
    # Create user in Keycloak
    user_id = await create_keycloak_user(
        username=user.username,
        email=user.email,
        password=user.password,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role
    )
    
    # Store sector relationships in Cassandra
    if user.role == "student":
        if len(user.sector_ids) != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student must belong to exactly one sector"
            )
        session.execute("""
            INSERT INTO student_sectors (student_id, sector_id)
            VALUES (%s, %s)
        """, (user_id, user.sector_ids[0]))
    else:  # teacher
        for sector_id in user.sector_ids:
            session.execute("""
                INSERT INTO teacher_sectors (teacher_id, sector_id)
                VALUES (%s, %s)
            """, (user_id, sector_id))
    
    # Return the created user
    return await get_keycloak_user(user_id)

@app.get("/sectors/", response_model=List[Sector])
async def list_sectors(current_user: KeycloakUser = Depends(get_current_user)):
    """List all sectors/filiers"""
    session = get_cassandra_session()
    rows = session.execute("SELECT id, name, description FROM users.sectors")
    return [Sector(**row) for row in rows]

@app.post("/sectors/", response_model=Sector)
async def create_sector(
    sector: Sector,
    current_user: KeycloakUser = Depends(get_current_user)
):
    """Create a new sector/filier"""
    session = get_cassandra_session()
    session.execute("""
        INSERT INTO users.sectors (id, name, description)
        VALUES (%s, %s, %s)
    """, (sector.id, sector.name, sector.description))
    return sector

@app.get("/users/{user_id}/sectors", response_model=UserSectorInfo)
async def get_user_sectors(user_id: str, current_user: KeycloakUser = Depends(get_current_user)):
    """Get sectors for a specific user"""
    session = get_cassandra_session()
    # First get the user from Keycloak to verify existence and get role
    user = await get_keycloak_user(user_id)
    
    # Get sectors based on role
    if "app_student" in user.roles:
        # First get the sector IDs for the student
        sector_ids_rows = session.execute(
            "SELECT sector_id FROM users.student_sectors WHERE student_id = %s",
            (user_id,)
        )
        sector_ids = [row['sector_id'] for row in sector_ids_rows]
    else:  # teacher
        # First get the sector IDs for the teacher
        sector_ids_rows = session.execute(
            "SELECT sector_id FROM users.teacher_sectors WHERE teacher_id = %s",
            (user_id,)
        )
        sector_ids = [row['sector_id'] for row in sector_ids_rows]
    
    # Then get the sector details for those IDs
    if sector_ids:
        placeholders = ','.join(['%s'] * len(sector_ids))
        rows = session.execute(
            f"SELECT id, name, description FROM users.sectors WHERE id IN ({placeholders})",
            sector_ids
        )
    else:
        rows = []
    
    sectors = [Sector(**row) for row in rows]
    return UserSectorInfo(user_id=user_id, sectors=sectors)

@app.get("/sectors/{sector_id}/users", response_model=List[KeycloakUser])
async def get_sector_users(
    sector_id: str,
    role: str = None,
    current_user: KeycloakUser = Depends(get_current_user)
):
    """Get all users in a specific sector, optionally filtered by role"""
    session = get_cassandra_session()
    
    if role == "student":
        rows = session.execute("""
            SELECT student_id as user_id FROM student_sectors
            WHERE sector_id = %s
        """, (sector_id,))
    elif role == "teacher":
        rows = session.execute("""
            SELECT teacher_id as user_id FROM teacher_sectors
            WHERE sector_id = %s
        """, (sector_id,))
    else:
        # Get both students and teachers
        student_rows = session.execute("""
            SELECT student_id as user_id FROM student_sectors
            WHERE sector_id = %s
        """, (sector_id,))
        teacher_rows = session.execute("""
            SELECT teacher_id as user_id FROM teacher_sectors
            WHERE sector_id = %s
        """, (sector_id,))
        rows = list(student_rows) + list(teacher_rows)
    
    # Get user details from Keycloak for each user ID
    users = []
    for row in rows:
        try:
            user = await get_current_user(row["user_id"])
            users.append(user)
        except HTTPException:
            # Skip users that may have been deleted from Keycloak
            continue
    
    return users

@app.get("/users/", response_model=List[KeycloakUser])
async def list_users(
    role: str = None,
    current_user: KeycloakUser = Depends(get_current_user)
):
    """
    List all users, optionally filtered by role.
    Role can be 'teacher' or 'student'.
    """
    # Get users from Keycloak
    users = await list_users_from_keycloak(role)
    
    # If no role filter is applied, return all users
    if not role:
        return users
      # Filter users by role
    return [user for user in users if role in user.roles]

@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: KeycloakUser = Depends(get_current_user)
):
    """Delete a user and their sector relationships."""
    # Check if the current user has admin privileges
    if "admin" not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete users"
        )
    
    try:
        # Delete user from Keycloak
        admin_token = get_admin_token()
        headers = {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }
        
        # First, get the user to check if they exist and get their role
        try:
            user = await get_keycloak_user(user_id)
        except HTTPException as e:
            if e.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            raise e
        
        # Delete user from Keycloak
        url = f"{os.environ.get('KEYCLOAK_URL', 'http://keycloak:8080')}/admin/realms/{os.environ.get('KEYCLOAK_REALM', 'master')}/users/{user_id}"
        response = requests.delete(url, headers=headers)
        response.raise_for_status()
        
        # Delete sector relationships from Cassandra
        session = get_cassandra_session()
        
        # Check if user is a student or teacher based on their roles
        if "student" in user.roles:
            session.execute("""
                DELETE FROM student_sectors
                WHERE student_id = %s
            """, (user_id,))
        elif "teacher" in user.roles:
            session.execute("""
                DELETE FROM teacher_sectors
                WHERE teacher_id = %s
            """, (user_id,))
        
        return None
        
    except requests.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

