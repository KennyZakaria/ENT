from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from urllib.parse import urlparse
import os
import json
import asyncio
from datetime import datetime, timedelta
from uuid import UUID, uuid4

from app.auth import get_current_user, User
from app.database import get_cassandra_session
from app.models import Message, ChatRoom, RoomParticipant, MessageCreate, ChatRoomCreate, WebSocketMessage

app = FastAPI(title="Messaging Service", description="Service for real-time messaging using WebSockets")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        # active_connections: {user_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}
        # user_rooms: {user_id: set(room_ids)}
        self.user_rooms: Dict[str, set] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_rooms[user_id] = set()
        
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_rooms:
            del self.user_rooms[user_id]
    
    async def send_personal_message(self, message: Dict[str, Any], user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)
    
    async def broadcast(self, message: Dict[str, Any], room_id: str):
        # Get all users in the room
        for user_id, rooms in self.user_rooms.items():
            if room_id in rooms and user_id in self.active_connections:
                await self.active_connections[user_id].send_json(message)
    
    def join_room(self, user_id: str, room_id: str):
        if user_id in self.user_rooms:
            self.user_rooms[user_id].add(room_id)
    
    def leave_room(self, user_id: str, room_id: str):
        if user_id in self.user_rooms and room_id in self.user_rooms[user_id]:
            self.user_rooms[user_id].remove(room_id)

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                message = WebSocketMessage(**message_data)
                
                if message.type == "message":
                    # Handle new message
                    msg = Message(
                        id=str(uuid4()),
                        sender_id=user_id,
                        recipient_id=message.data.get("recipient_id"),
                        content=message.data.get("content"),
                        timestamp=datetime.now(),
                        read=False
                    )
                    
                    # Save message to database
                    save_message(msg)
                    
                    # Send to recipient if online
                    await manager.send_personal_message(
                        {"type": "message", "data": msg.dict()},
                        msg.recipient_id
                    )
                    
                elif message.type == "join_room":
                    # Handle joining a room
                    room_id = message.data.get("room_id")
                    manager.join_room(user_id, room_id)
                    
                    # Notify room about new user
                    await manager.broadcast(
                        {"type": "user_joined", "data": {"user_id": user_id, "room_id": room_id}},
                        room_id
                    )
                    
                elif message.type == "leave_room":
                    # Handle leaving a room
                    room_id = message.data.get("room_id")
                    manager.leave_room(user_id, room_id)
                    
                    # Notify room about user leaving
                    await manager.broadcast(
                        {"type": "user_left", "data": {"user_id": user_id, "room_id": room_id}},
                        room_id
                    )
                    
            except Exception as e:
                await websocket.send_json({"type": "error", "data": {"message": str(e)}})
    except WebSocketDisconnect:
        manager.disconnect(user_id)

@app.post("/messages/", status_code=status.HTTP_201_CREATED)
async def create_message(message_create: MessageCreate, current_user: User = Depends(get_current_user)):
    message = Message(
        sender_id=current_user.username,
        recipient_id=message_create.recipient_id,
        content=message_create.content
    )
    save_message(message)
    
    # Try to send message via WebSocket if recipient is online
    await manager.send_personal_message(
        {"type": "message", "data": message.dict()},
        message.recipient_id
    )
    
    return {"message": "Message sent successfully", "message_id": message.id}

@app.get("/messages/{user_id}", response_model=List[Message])
async def get_messages(user_id: str, current_user: User = Depends(get_current_user)):
    # Only allow users to fetch their own messages
    if current_user.username != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view these messages")
    
    return get_user_messages(user_id)

@app.post("/rooms/", status_code=status.HTTP_201_CREATED)
async def create_room(room_create: ChatRoomCreate, current_user: User = Depends(get_current_user)):
    room = ChatRoom(
        name=room_create.name,
        created_by=current_user.username,
        is_group=room_create.is_group
    )
    
    # Save room to database
    save_chat_room(room)
    
    # Add creator as participant
    participant = RoomParticipant(
        room_id=room.room_id,
        user_id=current_user.username
    )
    add_room_participant(participant)
    
    # Add other participants
    for user_id in room_create.participants:
        participant = RoomParticipant(
            room_id=room.room_id,
            user_id=user_id
        )
        add_room_participant(participant)
    
    return {"message": "Room created successfully", "room_id": room.room_id}

@app.get("/rooms/", response_model=List[ChatRoom])
async def get_rooms(current_user: User = Depends(get_current_user)):
    return get_user_rooms(current_user.username)

@app.get("/rooms/{room_id}/participants", response_model=List[RoomParticipant])
async def get_room_participants(room_id: str, current_user: User = Depends(get_current_user)):
    # Check if user is a participant in the room
    if not is_room_participant(room_id, current_user.username):
        raise HTTPException(status_code=403, detail="Not authorized to view this room")
    
    return get_participants_by_room(room_id)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

# Database functions
def save_message(message: Message):
    session = get_cassandra_session()
    session.execute("""
        INSERT INTO messages (id, sender_id, recipient_id, content, timestamp, read)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        message.id,
        message.sender_id,
        message.recipient_id,
        message.content,
        message.timestamp,
        message.read
    ))

def get_user_messages(user_id: str) -> List[Message]:
    session = get_cassandra_session()
    rows = session.execute("""
        SELECT * FROM messages WHERE recipient_id = %s
    """, (user_id,))
    
    return [Message(**row) for row in rows]

def save_chat_room(room: ChatRoom):
    session = get_cassandra_session()
    session.execute("""
        INSERT INTO chat_rooms (room_id, name, created_at, created_by, is_group)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        room.room_id,
        room.name,
        room.created_at,
        room.created_by,
        room.is_group
    ))

def add_room_participant(participant: RoomParticipant):
    session = get_cassandra_session()
    session.execute("""
        INSERT INTO room_participants (room_id, user_id, joined_at)
        VALUES (%s, %s, %s)
    """, (
        participant.room_id,
        participant.user_id,
        participant.joined_at
    ))

def get_user_rooms(user_id: str) -> List[ChatRoom]:
    session = get_cassandra_session()
    # Get room IDs where user is a participant
    rows = session.execute("""
        SELECT room_id FROM room_participants WHERE user_id = %s
    """, (user_id,))
    
    room_ids = [row["room_id"] for row in rows]
    
    if not room_ids:
        return []
    
    # Get room details
    rooms = []
    for room_id in room_ids:
        room_rows = session.execute("""
            SELECT * FROM chat_rooms WHERE room_id = %s
        """, (room_id,))
        
        for row in room_rows:
            rooms.append(ChatRoom(**row))
    
    return rooms

def get_participants_by_room(room_id: str) -> List[RoomParticipant]:
    session = get_cassandra_session()
    rows = session.execute("""
        SELECT * FROM room_participants WHERE room_id = %s
    """, (room_id,))
    
    return [RoomParticipant(**row) for row in rows]

def is_room_participant(room_id: str, user_id: str) -> bool:
    session = get_cassandra_session()
    rows = session.execute("""
        SELECT * FROM room_participants WHERE room_id = %s AND user_id = %s
    """, (room_id, user_id))
    
    return len(list(rows)) > 0