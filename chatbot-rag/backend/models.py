from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    status: str
    response: str
    context_documents: Optional[List[str]] = None
    response_type: str  # "contextual" ou "general"

class Document(BaseModel):
    id: str
    filename: str
    file_size: int
    ingested_at: datetime
    chunk_count: int

class LLMConfig(BaseModel):
    provider: str
    model: str
    is_ready: bool
    together_api_configured: bool
    ollama_available: bool

class LLMSwitchRequest(BaseModel):
    provider: str
    model: Optional[str] = None

class APIResponse(BaseModel):
    status: str
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None