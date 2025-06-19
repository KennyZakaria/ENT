import httpx
import json
from typing import Optional, List, Dict, Any
from utils.config import config

class LLMService:
    def __init__(self):
        self.current_provider = "ollama"
        self.current_model = "meta-llama/Llama-3.3-70B-Instruct-Turbo"
        self.ollama_model = config.OLLAMA_MODEL
        
    async def get_config(self) -> Dict[str, Any]:
        """Récupère la configuration actuelle du LLM"""
        together_configured = bool(config.TOGETHER_API_KEY)
        ollama_available = await self._check_ollama_availability()
        ollama_models = await self._get_ollama_models() if ollama_available else []
        
        return {
            "provider": self.current_provider,
            "model": self.current_model if self.current_provider == "together_ai" else self.ollama_model,
            "is_ready": together_configured if self.current_provider == "together_ai" else ollama_available,
            "together_api_configured": together_configured,
            "ollama_available": ollama_available,
            "ollama_models": ollama_models
        }
    
    async def switch_provider(self, provider: str, model: Optional[str] = None) -> bool:
        """Bascule vers un autre provider"""
        if provider == "together_ai":
            if not config.TOGETHER_API_KEY:
                return False
            self.current_provider = "together_ai"
            if model:
                self.current_model = model
        elif provider == "ollama":
            if not await self._check_ollama_availability():
                return False
            self.current_provider = "ollama"
            if model:
                self.ollama_model = model
        else:
            return False
        
        return True
    
    async def generate_response_with_context(self, prompt: str, context: str) -> str:
        """Génère une réponse basée sur le contexte des documents"""
        print(f"🤖 Génération avec {self.current_provider}")
        
        if self.current_provider == "ollama":
            # Prompt spécialement optimisé pour Ollama
            full_prompt = f"""Contexte: {context}

Question: {prompt}

Instructions: Réponds à la question en utilisant uniquement les informations du contexte. Sois précis et direct.

Réponse:"""
        else:
            # Prompt pour Together AI
            full_prompt = f"""Tu es un assistant IA utile. Réponds à la question de l'utilisateur en utilisant les informations du contexte fourni.

CONTEXTE:
{context}

QUESTION: {prompt}

INSTRUCTIONS:
- Utilise uniquement les informations du contexte pour répondre
- Réponds de manière directe et précise
- Si les informations sont complètes dans le contexte, donne une réponse complète
- Sois naturel dans ta réponse

RÉPONSE:"""
        
        return await self._generate_text(full_prompt)
    
    async def generate_response_general(self, prompt: str) -> str:
        """Génère une réponse générale sans contexte documentaire"""
        print(f"🤖 Génération générale avec {self.current_provider}")
        
        if self.current_provider == "ollama":
            full_prompt = f"""Question: {prompt}

Note: Cette réponse est basée sur mes connaissances générales.

Réponse:"""
        else:
            full_prompt = f"""Tu es un assistant IA utile. Réponds à la question suivante en utilisant tes connaissances générales.

QUESTION: {prompt}

Note: Cette réponse est basée sur mes connaissances générales car aucun document pertinent n'a été trouvé dans la base de données.

RÉPONSE:"""
        
        return await self._generate_text(full_prompt)
    
    async def _generate_text(self, prompt: str) -> str:
        """Génère du texte avec le provider actuel"""
        try:
            if self.current_provider == "together_ai":
                return await self._generate_together_ai(prompt)
            elif self.current_provider == "ollama":
                return await self._generate_ollama(prompt)
            else:
                raise ValueError(f"Provider non supporté: {self.current_provider}")
        except Exception as e:
            print(f"❌ Erreur lors de la génération avec {self.current_provider}: {e}")
            # Fallback sur l'autre provider si possible
            if self.current_provider == "ollama" and config.TOGETHER_API_KEY:
                print("🔄 Tentative de fallback vers Together AI...")
                try:
                    return await self._generate_together_ai(prompt)
                except Exception as e2:
                    print(f"❌ Fallback également échoué: {e2}")
                    raise Exception(f"Erreur Ollama: {e}, Fallback Together AI: {e2}")
            elif self.current_provider == "together_ai":
                ollama_available = await self._check_ollama_availability()
                if ollama_available:
                    print("🔄 Tentative de fallback vers Ollama...")
                    try:
                        return await self._generate_ollama(prompt)
                    except Exception as e2:
                        print(f"❌ Fallback également échoué: {e2}")
                        raise Exception(f"Erreur Together AI: {e}, Fallback Ollama: {e2}")
            
            raise e
    
    async def _generate_together_ai(self, prompt: str) -> str:
        """Génère une réponse avec Together AI"""
        try:
            url = "https://api.together.xyz/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {config.TOGETHER_API_KEY}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": self.current_model,
                "messages": [
                    {
                        "role": "system", 
                        "content": "Tu es un assistant IA utile qui répond précisément aux questions en utilisant le contexte fourni."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                "max_tokens": 1000,
                "temperature": 0.3
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json=data)
                
                if response.status_code == 200:
                    result = response.json()
                    return result["choices"][0]["message"]["content"]
                else:
                    error_msg = f"Erreur HTTP {response.status_code}"
                    try:
                        error_data = response.json()
                        error_msg += f": {error_data.get('error', {}).get('message', 'Erreur inconnue')}"
                    except:
                        error_msg += f": {response.text}"
                    raise Exception(error_msg)
                    
        except httpx.TimeoutException:
            raise Exception("Timeout lors de la requête vers Together AI")
        except httpx.RequestError as e:
            raise Exception(f"Erreur de connexion vers Together AI: {e}")
        except Exception as e:
            if "Together AI" not in str(e):
                raise Exception(f"Erreur Together AI: {e}")
            raise e
    
    async def _generate_ollama(self, prompt: str) -> str:
        """Génère une réponse avec Ollama"""
        try:
            print(f"  📡 Connexion à Ollama: {config.OLLAMA_BASE_URL}")
            print(f"  🤖 Modèle: {self.ollama_model}")
            print(f"  📝 Taille du prompt: {len(prompt)} caractères")
            
            url = f"{config.OLLAMA_BASE_URL}/api/generate"
            
            data = {
                "model": self.ollama_model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "top_p": 0.9,
                    "top_k": 40
                }
            }
            
            # Timeout plus long pour Ollama qui peut être plus lent
            async with httpx.AsyncClient(timeout=120.0) as client:
                print(f"  ⏳ Envoi de la requête à Ollama...")
                response = await client.post(url, json=data)
                
                print(f"  📨 Statut de réponse: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Vérifier si la réponse contient bien le champ 'response'
                    if 'response' not in result:
                        print(f"  ⚠️ Réponse Ollama inattendue: {result}")
                        raise Exception(f"Format de réponse Ollama inattendu: {result}")
                    
                    response_text = result["response"]
                    print(f"  ✅ Réponse reçue: {len(response_text)} caractères")
                    
                    if not response_text or response_text.strip() == "":
                        raise Exception("Réponse vide d'Ollama")
                    
                    return response_text
                else:
                    error_msg = f"Erreur HTTP {response.status_code}"
                    try:
                        error_data = response.json()
                        error_msg += f": {error_data.get('error', 'Erreur inconnue')}"
                    except:
                        error_msg += f": {response.text}"
                    raise Exception(error_msg)
                    
        except httpx.TimeoutException:
            raise Exception("Timeout lors de la requête vers Ollama (120s). Le modèle est peut-être en cours de chargement.")
        except httpx.ConnectError:
            raise Exception(f"Impossible de se connecter à Ollama sur {config.OLLAMA_BASE_URL}. Vérifiez qu'Ollama est démarré.")
        except httpx.RequestError as e:
            raise Exception(f"Erreur de connexion vers Ollama: {e}")
        except json.JSONDecodeError:
            raise Exception("Réponse Ollama invalide (JSON malformé)")
        except Exception as e:
            if "Ollama" not in str(e):
                raise Exception(f"Erreur Ollama: {e}")
            raise e
    
    async def _check_ollama_availability(self) -> bool:
        """Vérifie si Ollama est disponible"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{config.OLLAMA_BASE_URL}/api/tags")
                return response.status_code == 200
        except:
            return False
    
    async def _get_ollama_models(self) -> List[str]:
        """Récupère la liste des modèles Ollama"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{config.OLLAMA_BASE_URL}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    models = [model["name"] for model in data.get("models", [])]
                    print(f"📋 Modèles Ollama disponibles: {models}")
                    return models
        except Exception as e:
            print(f"❌ Erreur lors de la récupération des modèles Ollama: {e}")
        return []

# Instance globale
llm_service = LLMService()