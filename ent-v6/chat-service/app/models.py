from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid

class Message(BaseModel):
    """Model for chat messages."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    recipient_id: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)
    read: bool = False

class ChatRoom(BaseModel):
    """Model for chat rooms."""
    room_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=datetime.now)
    created_by: str
    is_group: bool = False

    def __hash__(self):
        return hash(self.room_id)  # Use room_id for hashing since it's unique
        
    def __eq__(self, other):
        if not isinstance(other, ChatRoom):
            return False
        return self.room_id == other.room_id  # Compare rooms by their ID

class RoomParticipant(BaseModel):
    """Model for chat room participants."""
    room_id: str
    user_id: str
    joined_at: datetime = Field(default_factory=datetime.now)

class MessageCreate(BaseModel):
    """Model for creating a new message."""
    recipient_id: str
    content: str

class ChatRoomCreate(BaseModel):
    """Model for creating a new chat room."""
    name: str
    is_group: bool = False
    participants: List[str] = []

class WebSocketMessage(BaseModel):
    """Model for WebSocket messages."""
    type: str  # 'message', 'join_room', 'leave_room', etc.
    data: Dict[str, Any]

class TokenData(BaseModel):
    """Model for decoded JWT token data."""
    sub: Optional[str] = None
    preferred_username: Optional[str] = None
    email: Optional[str] = None
    realm_access: Optional[dict] = None