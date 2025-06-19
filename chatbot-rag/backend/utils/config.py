import os
from dotenv import load_dotenv

# Charger le fichier .env depuis le dossier parent
load_dotenv("../.env")

class Config:
    # API Settings
    TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY", "").strip()
    APP_HOST = os.getenv("APP_HOST", "0.0.0.0").strip()
    APP_PORT = int(os.getenv("APP_PORT", "8000").strip())
    DEBUG = os.getenv("DEBUG", "False").strip().lower() == "true"
    
    # File Settings
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760").strip())
    ALLOWED_EXTENSIONS = [ext.strip() for ext in os.getenv("ALLOWED_EXTENSIONS", "pdf,txt").strip().split(",")]
    
    # RAG Settings
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000").strip())
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200").strip())
    SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.7").strip())
    
    # Ollama Settings
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").strip()
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3").strip()
    
    # Paths
    UPLOAD_DIR = "data/uploads"
    FAISS_INDEX_DIR = "data/faiss_index"
    DOCUMENTS_JSON = "data/documents.json"
    
    @classmethod
    def ensure_directories(cls):
        os.makedirs(cls.UPLOAD_DIR, exist_ok=True)
        os.makedirs(cls.FAISS_INDEX_DIR, exist_ok=True)
        os.makedirs("data", exist_ok=True)

config = Config()