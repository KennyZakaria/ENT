from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid

class CalenderEvent(BaseModel):
    """Model for Event information."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    start: datetime
    end: datetime
    color: str
    filier_id: str
    


class TokenData(BaseModel):
    """Model for decoded JWT token data."""
    sub: Optional[str] = None
    preferred_username: Optional[str] = None
    email: Optional[str] = None
    realm_access: Optional[dict] = None