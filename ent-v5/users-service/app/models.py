from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid

class Sector(BaseModel):
    """Model for sector/filier information."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None

class UserSectorInfo(BaseModel):
    """Model for user sector relationships."""
    user_id: str
    sectors: List[Sector]

class NewUserRequest(BaseModel):
    """Model for creating a new user."""
    username: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str  # "teacher" or "student"
    sector_ids: List[str]  # One for student, multiple for teacher

class TokenData(BaseModel):
    """Model for decoded JWT token data."""
    sub: Optional[str] = None
    preferred_username: Optional[str] = None
    email: Optional[str] = None
    realm_access: Optional[dict] = None