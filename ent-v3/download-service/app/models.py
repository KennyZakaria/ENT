from pydantic import BaseModel
from typing import List, Optional

class Course(BaseModel):
    """Model for course information."""
    id: str
    title: str
    description: str
    sector_id: Optional[str] = None

class DownloadResponse(BaseModel):
    """Model for download URL response."""
    download_url: str

class TokenData(BaseModel):
    """Model for decoded JWT token data."""
    sub: Optional[str] = None
    preferred_username: Optional[str] = None
    email: Optional[str] = None
    realm_access: Optional[dict] = None