import os
from fastapi import FastAPI, HTTPException, File, UploadFile, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn

from models import ChatMessage, ChatResponse, LLMSwitchRequest, APIResponse
from services.llm_service import llm_service
from services.document_service import document_service
from services.rag_service import rag_service
from utils.config import config

# Initialisation
config.ensure_directories()

app = FastAPI(title="Chatbot RAG API", version="1.0.0")

# CORS - Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False when using allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Servir les fichiers statiques du frontend
app.mount("/css", StaticFiles(directory="frontend/css"), name="css")
app.mount("/js", StaticFiles(directory="frontend/js"), name="js")

@app.on_event("startup")
async def startup_event():
    """Initialisation au démarrage"""
    await rag_service.initialize()

# Routes pour servir les pages HTML
@app.get("/")
async def serve_index():
    return FileResponse("frontend/index.html")

@app.get("/admin")
async def serve_admin():
    return FileResponse("frontend/admin.html")

# API Routes

@app.post("/api/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Endpoint principal du chat avec logique RAG améliorée"""
    try:
        user_message = message.message.strip()
        if not user_message:
            raise HTTPException(status_code=400, detail="Message vide")
        
        print(f"\n💬 Question utilisateur: '{user_message}'")
        
        # Étape 1: Vérifier s'il y a du contexte pertinent dans les documents
        has_context = await rag_service.has_relevant_context(user_message)
        
        if has_context:
            # Cas 1: Il y a du contexte pertinent - réponse basée sur les documents
            context, source_docs = await rag_service.get_context_for_query(user_message)
            
            print(f"📚 CONTEXTE TROUVÉ:")
            print(f"  Longueur: {len(context)} caractères")
            print(f"  Documents sources: {source_docs}")
            print(f"  Aperçu: {context[:200]}...")
            
            try:
                response = await llm_service.generate_response_with_context(user_message, context)
                
                print(f"🤖 RÉPONSE GÉNÉRÉE:")
                print(f"  Longueur: {len(response)} caractères")
                print(f"  Aperçu: {response[:200]}...")
                
                return ChatResponse(
                    status="success",
                    response=response,
                    context_documents=source_docs,
                    response_type="contextual"
                )
                
            except Exception as llm_error:
                print(f"❌ Erreur LLM: {llm_error}")
                # Fallback sur une réponse basique si le LLM échoue
                fallback_response = f"Je trouve des informations pertinentes dans les documents, mais j'ai une difficulté technique pour générer la réponse. Voici le contexte trouvé :\n\n{context[:500]}..."
                
                return ChatResponse(
                    status="success",
                    response=fallback_response,
                    context_documents=source_docs,
                    response_type="contextual"
                )
        else:
            # Cas 2: Pas de contexte pertinent - réponse générale du LLM
            print("🧠 Pas de contexte pertinent - réponse générale")
            
            try:
                response = await llm_service.generate_response_general(user_message)
                
                return ChatResponse(
                    status="success",
                    response=response,
                    context_documents=[],
                    response_type="general"
                )
                
            except Exception as llm_error:
                print(f"❌ Erreur LLM général: {llm_error}")
                fallback_response = "Je rencontre une difficulté technique pour répondre à votre question. Veuillez réessayer ou vérifier la configuration du modèle de langage."
                
                return ChatResponse(
                    status="success",
                    response=fallback_response,
                    context_documents=[],
                    response_type="general"
                )
        
    except Exception as e:
        print(f"❌ Erreur générale dans /api/chat: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")

@app.get("/api/debug/rag")
async def debug_rag():
    """Endpoint de debug pour l'état du RAG"""
    return {
        "status": "success",
        "debug": {
            "index_available": rag_service.index is not None,
            "total_chunks": len(rag_service.chunks),
            "total_documents": len(set(m['doc_id'] for m in rag_service.chunk_metadata)),
            "similarity_threshold": config.SIMILARITY_THRESHOLD,
            "sample_chunks": rag_service.chunks[:3] if rag_service.chunks else []
        }
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Endpoint principal du chat avec logique RAG améliorée"""
    try:
        user_message = message.message.strip()
        if not user_message:
            raise HTTPException(status_code=400, detail="Message vide")
        
        print(f"\n💬 Question utilisateur: '{user_message}'")
        
        # Étape 1: Vérifier s'il y a du contexte pertinent dans les documents
        has_context = await rag_service.has_relevant_context(user_message)
        
        if has_context:
            # Cas 1: Il y a du contexte pertinent - réponse basée sur les documents
            context, source_docs = await rag_service.get_context_for_query(user_message)
            
            print(f"📚 CONTEXTE TROUVÉ:")
            print(f"  Longueur: {len(context)} caractères")
            print(f"  Documents sources: {source_docs}")
            print(f"  Aperçu: {context[:200]}...")
            
            try:
                response = await llm_service.generate_response_with_context(user_message, context)
                
                print(f"🤖 RÉPONSE GÉNÉRÉE:")
                print(f"  Longueur: {len(response)} caractères")
                print(f"  Aperçu: {response[:200]}...")
                
                return ChatResponse(
                    status="success",
                    response=response,
                    context_documents=source_docs,
                    response_type="contextual"
                )
                
            except Exception as llm_error:
                print(f"❌ Erreur LLM: {llm_error}")
                # Fallback sur une réponse basique si le LLM échoue
                fallback_response = f"Je trouve des informations pertinentes dans les documents, mais j'ai une difficulté technique pour générer la réponse. Voici le contexte trouvé :\n\n{context[:500]}..."
                
                return ChatResponse(
                    status="success",
                    response=fallback_response,
                    context_documents=source_docs,
                    response_type="contextual"
                )
        else:
            # Cas 2: Pas de contexte pertinent - réponse générale du LLM
            print("🧠 Pas de contexte pertinent - réponse générale")
            
            try:
                response = await llm_service.generate_response_general(user_message)
                
                return ChatResponse(
                    status="success",
                    response=response,
                    context_documents=[],
                    response_type="general"
                )
                
            except Exception as llm_error:
                print(f"❌ Erreur LLM général: {llm_error}")
                fallback_response = "Je rencontre une difficulté technique pour répondre à votre question. Veuillez réessayer ou vérifier la configuration du modèle de langage."
                
                return ChatResponse(
                    status="success",
                    response=fallback_response,
                    context_documents=[],
                    response_type="general"
                )
        
    except Exception as e:
        print(f"❌ Erreur générale dans /api/chat: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")
    
@app.post("/api/debug/context")
async def debug_context(query: dict):
    """Debug du contexte trouvé"""
    test_query = query.get("query", "")
    context, source_docs = await rag_service.get_context_for_query(test_query)
    
    return {
        "status": "success",
        "query": test_query,
        "context": context,
        "context_length": len(context),
        "source_docs": source_docs
    }
@app.post("/api/admin/rebuild-index")
async def rebuild_index():
    """Reconstruit l'index RAG depuis zéro"""
    try:
        # Réinitialiser l'index
        rag_service.index = None
        rag_service.chunks = []
        rag_service.chunk_metadata = []
        
        # Recharger tous les documents
        documents = await document_service.load_documents()
        
        for doc in documents:
            await rag_service.add_document_to_index(doc.id)
        
        return {
            "status": "success",
            "message": f"Index reconstruit avec {len(documents)} documents"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/debug/search")
async def debug_search(query: dict):
    """Test de recherche avec debug"""
    test_query = query.get("query", "test")
    results = await rag_service.search_similar_chunks(test_query, k=10)
    return {
        "status": "success",
        "query": test_query,
        "results": results,
        "has_context": len(results) > 0
    }

@app.get("/api/llm/config")
async def get_llm_config():
    """Récupère la configuration LLM actuelle"""
    try:
        config_data = await llm_service.get_config()
        return {"status": "success", "config": config_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/llm/ollama/models")
async def get_ollama_models():
    """Récupère la liste des modèles Ollama"""
    try:
        models = await llm_service._get_ollama_models()
        return {"status": "success", "models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/llm/switch")
async def switch_llm_provider(request: LLMSwitchRequest):
    """Bascule vers un autre provider LLM"""
    try:
        success = await llm_service.switch_provider(request.provider, request.model)
        if success:
            return {"status": "success", "message": f"Basculé vers {request.provider}"}
        else:
            raise HTTPException(status_code=400, detail="Impossible de basculer vers ce provider")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/documents")
async def get_documents():
    """Récupère la liste des documents"""
    try:
        documents = await document_service.load_documents()
        return {
            "status": "success",
            "documents": [doc.dict() for doc in documents]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload et traitement d'un document"""
    try:
        # Vérifications
        if not file.filename:
            raise HTTPException(status_code=400, detail="Nom de fichier manquant")
        
        file_ext = file.filename.lower().split('.')[-1]
        if file_ext not in config.ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Extension non autorisée: {file_ext}")
        
        # Lire le contenu
        content = await file.read()
        if len(content) > config.MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Fichier trop volumineux")
        
        # Ajouter le document
        document = await document_service.add_document(file.filename, content)
        
        # Ajouter à l'index RAG
        await rag_service.add_document_to_index(document.id)
        
        return {
            "status": "success",
            "message": "Document ajouté avec succès",
            "document": document.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur upload: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement: {str(e)}")

@app.delete("/api/admin/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Supprime un document"""
    try:
        # Supprimer de l'index RAG
        await rag_service.remove_document_from_index(doc_id)
        
        # Supprimer le document
        success = await document_service.delete_document(doc_id)
        
        if success:
            return {"status": "success", "message": "Document supprimé"}
        else:
            raise HTTPException(status_code=404, detail="Document non trouvé")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=config.APP_HOST,
        port=config.APP_PORT,
        reload=config.DEBUG
    )