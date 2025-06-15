from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from urllib.parse import urlparse
import os

from app.auth import get_current_user
from app.database import get_cassandra_session
from app.models import CalenderEvent
from datetime import timedelta
from uuid import UUID

app = FastAPI(title="Calender Service", description="Service for listing and adding events to calender")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.post("/events/")
def create_event(event: CalenderEvent):
    add_event(event)
    return {"message": "Event added successfully"}

@app.get("/events/{filier_id}", response_model=List[CalenderEvent])
def fetch_events(filier_id: str):
    return get_events_by_filier(filier_id)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

def add_event(event: CalenderEvent):
    session = get_cassandra_session()
    session.execute("""
        INSERT INTO event (id, title, start, end, color, filier_id)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        event.id,
        event.title,
        event.start,
        event.end,
        event.color,
        event.filier_id
    ))

def get_events_by_filier(filier_id: str) -> List[CalenderEvent]:
    session = get_cassandra_session()
    rows = session.execute("""
        SELECT * FROM event WHERE filier_id = %s
    """, (filier_id,))
    
    return [CalenderEvent(**row) for row in rows]