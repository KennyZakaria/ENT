import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from typing import List, Dict, Any
import os
import json
import asyncio
from datetime import datetime
from uuid import uuid4

from app.auth import get_current_user, User, validate_token
from app.database import get_cassandra_session, execute_query
from app.models import Message, ChatRoom, RoomParticipant, MessageCreate, ChatRoomCreate, WebSocketMessage

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Messaging Service", description="Service for real-time messaging using WebSockets")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
        # Remove duplicate accept call since we handle it in the endpoint
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

@app.middleware("http")
async def remove_trailing_slash(request: Request, call_next):
    if request.url.path != "/" and request.url.path.endswith("/"):
        return RedirectResponse(request.url.path[:-1])
    return await call_next(request)

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await websocket.accept()
        
        # Get token from query parameters
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        # Validate token
        user = await validate_token(token)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        # Connect user to WebSocket manager using UUID
        await manager.connect(websocket, user.sub)
        
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
                            sender_id=user.sub,  # Use UUID
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
                        if is_room_participant(room_id, user.sub):
                            manager.join_room(user.sub, room_id)
                            
                            # Notify room about new user (include both id and username)
                            await manager.broadcast(
                                {
                                    "type": "user_joined", 
                                    "data": {
                                        "user_id": user.sub,
                                        "username": user.username,
                                        "room_id": room_id
                                    }
                                },
                                room_id
                            )
                        
                    elif message.type == "leave_room":
                        # Handle leaving a room
                        room_id = message.data.get("room_id")
                        if is_room_participant(room_id, user.sub):
                            manager.leave_room(user.sub, room_id)
                            
                            # Notify room about user leaving (include both id and username)
                            await manager.broadcast(
                                {
                                    "type": "user_left", 
                                    "data": {
                                        "user_id": user.sub,
                                        "username": user.username,
                                        "room_id": room_id
                                    }
                                },
                                room_id
                            )
                        
                except Exception as e:
                    await websocket.send_json({"type": "error", "data": {"message": str(e)}})
        except WebSocketDisconnect:
            manager.disconnect(user.sub)
            
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass

@app.post("/messages")
async def create_message(message_create: MessageCreate, current_user: User = Depends(get_current_user)):
    message = Message(
        sender_id=current_user.sub,  # Use UUID instead of username
        recipient_id=message_create.recipient_id,
        content=message_create.content
    )
    save_message(message)
    
    # Try to send message via WebSocket if recipient is online
    await manager.send_personal_message(
        {"type": "message", "data": {
            **message.dict(),
            "sender_username": current_user.username  # Include username for display purposes
        }},
        message.recipient_id
    )
    
    return {"message": "Message sent successfully", "message_id": message.id}

@app.get("/messages/{id}")
async def get_messages(id: str, current_user: User = Depends(get_current_user)):
    """Get messages for either a user or a room."""
    logger.info(f"Getting messages for id: {id}")
    logger.info(f"Current user: username={current_user.username}, sub={current_user.sub}")
    
    try:
        # First try to get messages as if id is a room_id
        is_participant = is_room_participant(id, current_user.sub)
            
        if is_participant:
            logger.info(f"Found room with id: {id}, user is participant")
            try:
                messages = get_room_messages(id)
                logger.info(f"Retrieved {len(messages)} messages from room {id}")
                return messages
            except Exception as e:
                logger.error(f"Error retrieving room messages: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error retrieving room messages"
                )
            
        # If not a room or not a participant, check if requesting user's own messages
        if current_user.sub == id:
            logger.info(f"Getting messages for user: {id}")
            try:
                return get_user_messages(current_user.sub)
            except Exception as e:
                logger.error(f"Error retrieving user messages: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error retrieving user messages"
                )
            
        # If neither case matches, return 403
        logger.error(f"Authorization failed: id={id} is neither a valid room or user id")
        logger.error(f"User details - username={current_user.username}, sub={current_user.sub}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these messages"
        )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting messages: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving messages"
        )

@app.post("/rooms")
async def create_room(room_create: ChatRoomCreate = Body(...), current_user: User = Depends(get_current_user)):
    """Create a new chat room."""
    try:
        if not room_create.name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Room name is required"
            )

        logger.info(f"Creating new room: {room_create.name} by user: {current_user.sub}")
        
        room = ChatRoom(
            name=room_create.name,
            created_by=current_user.sub,  # Use UUID instead of username
            is_group=room_create.is_group
        )
        
        try:
            save_chat_room(room)
            logger.info(f"Room created with ID: {room.room_id}")
            
            # Add creator as participant using UUID
            participant = RoomParticipant(
                room_id=room.room_id,
                user_id=current_user.sub
            )
            add_room_participant(participant)
            
            # Add other participants
            for participant_id in room_create.participants:
                participant = RoomParticipant(
                    room_id=room.room_id,
                    user_id=participant_id
                )
                add_room_participant(participant)
                logger.info(f"Added participant {participant_id} to room {room.room_id}")
            
            return {
                "message": "Room created successfully", 
                "room_id": room.room_id,
                "name": room.name,
                "created_by": {
                    "id": current_user.sub,
                    "username": current_user.username
                },
                "is_group": room.is_group
            }
            
        except Exception as db_error:
            logger.error(f"Database error creating room: {str(db_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error creating room in database"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating room: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error creating room"
        )

@app.get("/rooms")
async def get_rooms(current_user: User = Depends(get_current_user)):
    """List all rooms for the current user."""
    return await get_user_rooms(current_user.sub, current_user)

@app.get("/rooms/{room_id}/participants", response_model=List[RoomParticipant])
async def get_room_participants(room_id: str, current_user: User = Depends(get_current_user)):
    # Check if user is a participant in the room using UUID
    if not is_room_participant(room_id, current_user.sub):
        raise HTTPException(status_code=403, detail="Not authorized to view this room")
    
    participants = get_participants_by_room(room_id)
    return participants

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
    """Get messages for a user supporting both UUID and username."""
    session = get_cassandra_session()
    # Query by recipient_id which could be either UUID or username
    rows = session.execute("""
        SELECT * FROM messages 
        WHERE recipient_id = %s 
        ALLOW FILTERING
    """, (user_id,))
    messages = [Message(**row) for row in rows]
    
    # Also get messages where the user is the sender
    sender_rows = session.execute("""
        SELECT * FROM messages 
        WHERE sender_id = %s 
        ALLOW FILTERING
    """, (user_id,))
    messages.extend([Message(**row) for row in sender_rows])
    
    # Sort messages by timestamp
    messages.sort(key=lambda x: x.timestamp, reverse=True)
    return messages

def save_chat_room(room: ChatRoom):
    """Save chat room with error handling."""
    query = """
        INSERT INTO chat_rooms (room_id, name, created_at, created_by, is_group)
        VALUES (%s, %s, %s, %s, %s)
    """
    params = (
        room.room_id,
        room.name,
        room.created_at,
        room.created_by,
        room.is_group
    )
    execute_query(query, params)

def add_room_participant(participant: RoomParticipant):
    """Add room participant with error handling."""
    query = """
        INSERT INTO room_participants (room_id, user_id, joined_at)
        VALUES (%s, %s, %s)
    """
    params = (
        participant.room_id,
        participant.user_id,
        participant.joined_at
    )
    execute_query(query, params)

async def get_user_rooms(user_id: str, current_user: User) -> List[ChatRoom]:
    """Get user rooms with error handling. Returns both rooms where user is participant and rooms they created."""
    try:
        # Dictionary to track unique rooms by room_id
        rooms_dict = {}
        logger.info(f"Getting rooms for user_id: {user_id}")
        
        # Get rooms where user is the creator using UUID
        creator_query = "SELECT * FROM chat_rooms WHERE created_by = %s ALLOW FILTERING"
        creator_rows = execute_query(creator_query, (current_user.sub,))
        
        # Add creator's rooms to the dictionary
        for row in creator_rows:
            room = ChatRoom(**row)
            rooms_dict[room.room_id] = room
            logger.info(f"Added creator room: {room.room_id}")
        
        # Get room IDs where user is a participant using UUID
        participant_query = """
            SELECT room_id FROM room_participants 
            WHERE user_id = %s 
            ALLOW FILTERING
        """
        
        participant_rows = execute_query(participant_query, (current_user.sub,))
        room_ids = set(row["room_id"] for row in participant_rows)
        
        logger.info(f"Found participant room_ids: {room_ids}")
        
        # Get and add participant rooms
        for room_id in room_ids:
            if room_id not in rooms_dict:  # Only query if we don't already have this room
                room_query = "SELECT * FROM chat_rooms WHERE room_id = %s"
                room_rows = execute_query(room_query, (room_id,))
                
                for row in room_rows:
                    room = ChatRoom(**row)
                    rooms_dict[room.room_id] = room
                    logger.info(f"Added participant room: {room.room_id}")
        
        logger.info(f"Found total {len(rooms_dict)} rooms for user {current_user.sub}")
        return list(rooms_dict.values())
        
    except Exception as e:
        logger.error(f"Error getting user rooms: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving rooms"
        )

def get_participants_by_room(room_id: str) -> List[RoomParticipant]:
    session = get_cassandra_session()
    rows = session.execute("""
        SELECT * FROM room_participants WHERE room_id = %s
    """, (room_id,))
    
    return [RoomParticipant(**row) for row in rows]

def is_room_participant(room_id: str, user_id: str) -> bool:
    """Check if a user is a participant in a room using their UUID."""
    try:
        session = get_cassandra_session()
        rows = session.execute("""
            SELECT * FROM room_participants 
            WHERE room_id = %s AND user_id = %s
        """, (room_id, user_id))
        
        result = list(rows)
        if result:
            logger.info(f"Found participation for user_id: {user_id} in room: {room_id}")
            return True
            
        logger.info(f"No participation found for user_id: {user_id} in room: {room_id}")
        return False
        
    except Exception as e:
        logger.error(f"Error checking room participation: {str(e)}")
        return False

def get_room_messages(room_id: str) -> List[Message]:
    """Get all messages for a specific room."""
    session = get_cassandra_session()
    
    # Get messages where room is recipient
    rows = session.execute("""
        SELECT * FROM messages 
        WHERE recipient_id = %s 
        ALLOW FILTERING
    """, (room_id,))
    messages = [Message(**row) for row in rows]
    
    # Get messages where room is sender (e.g., system messages)
    sender_rows = session.execute("""
        SELECT * FROM messages 
        WHERE sender_id = %s 
        ALLOW FILTERING
    """, (room_id,))
    messages.extend([Message(**row) for row in sender_rows])
    
    # Sort all messages by timestamp
    messages.sort(key=lambda x: x.timestamp, reverse=True)
    return messages