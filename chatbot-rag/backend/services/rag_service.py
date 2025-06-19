import faiss
import numpy as np
import pickle
import os
import re
from typing import List, Dict, Tuple, Optional
from sentence_transformers import SentenceTransformer, CrossEncoder
from utils.config import config
from services.document_service import document_service

class RAGService:
    def __init__(self):
        # Modèle d'embedding pour la recherche initiale
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Modèle de reranking pour affiner les résultats
        try:
            self.reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
            self.use_reranking = True
            print("✅ Reranker chargé avec succès")
        except:
            self.reranker = None
            self.use_reranking = False
            print("⚠️ Reranker non disponible - recherche simple uniquement")
        
        self.index = None
        self.chunks = []
        self.chunk_metadata = []
        self.index_file = os.path.join(config.FAISS_INDEX_DIR, "faiss_index.bin")
        self.chunks_file = os.path.join(config.FAISS_INDEX_DIR, "chunks.pkl")
        self.metadata_file = os.path.join(config.FAISS_INDEX_DIR, "metadata.pkl")
        
    async def initialize(self):
        """Initialise le service RAG"""
        await self._load_index()
        print(f"RAG Service initialisé:")
        print(f"  - Index FAISS: {'Chargé' if self.index else 'Vide'}")
        print(f"  - Nombre de chunks: {len(self.chunks)}")
        print(f"  - Reranking: {'Activé' if self.use_reranking else 'Désactivé'}")
        print(f"  - Seuil de similarité: {config.SIMILARITY_THRESHOLD}")
        
        # Debug: afficher quelques chunks
        if self.chunks:
            print(f"\n📋 Aperçu des chunks disponibles:")
            for i, chunk in enumerate(self.chunks[:3]):
                print(f"  {i+1}. {chunk[:100]}...")
    
    async def add_document_to_index(self, doc_id: str):
        """Ajoute un document à l'index vectoriel"""
        print(f"Ajout du document {doc_id} à l'index...")
        
        content = await document_service.get_document_content(doc_id)
        if not content:
            print(f"  ❌ Impossible de récupérer le contenu du document {doc_id}")
            return
        
        print(f"  📄 Contenu récupéré: {len(content)} caractères")
        
        # Découper en chunks avec préprocessing
        chunks = self._split_text_advanced(content)
        print(f"  ✂️ Document découpé en {len(chunks)} chunks")
        
        if not chunks:
            print(f"  ⚠️ Aucun chunk généré pour le document {doc_id}")
            return
        
        # Debug: afficher les premiers chunks
        print(f"  📝 Premiers chunks générés:")
        for i, chunk in enumerate(chunks[:2]):
            print(f"    {i+1}. {chunk[:150]}...")
        
        # Générer les embeddings
        embeddings = self.embedder.encode(chunks)
        print(f"  🔢 Embeddings générés: {embeddings.shape}")
        
        # Ajouter à l'index
        if self.index is None:
            dimension = embeddings.shape[1]
            self.index = faiss.IndexFlatIP(dimension)
            print(f"  🆕 Nouvel index FAISS créé (dimension: {dimension})")
        
        # Normaliser les embeddings pour la similarité cosinus
        faiss.normalize_L2(embeddings)
        
        # Ajouter à l'index
        self.index.add(embeddings.astype('float32'))
        
        # Ajouter aux chunks et métadonnées
        start_idx = len(self.chunks)
        self.chunks.extend(chunks)
        for i, chunk in enumerate(chunks):
            self.chunk_metadata.append({
                'doc_id': doc_id,
                'chunk_idx': start_idx + i,
                'text': chunk
            })
        
        print(f"  ✅ Document ajouté à l'index. Total chunks: {len(self.chunks)}")
        
        # Sauvegarder
        await self._save_index()
        print(f"  💾 Index sauvegardé")
    
    async def search_similar_chunks(self, query: str, k: int = 10) -> List[Dict]:
        """Recherche les chunks similaires avec reranking"""
        print(f"\n🔍 Recherche avancée pour: '{query}'")
        print(f"  - Index disponible: {'Oui' if self.index else 'Non'}")
        print(f"  - Nombre de chunks: {len(self.chunks)}")
        print(f"  - Reranking: {'Activé' if self.use_reranking else 'Désactivé'}")
        
        if self.index is None or len(self.chunks) == 0:
            print("  ❌ Pas d'index ou pas de chunks disponibles")
            return []
        
        # Préprocesser la requête
        processed_query = self._preprocess_query(query)
        print(f"  🔄 Requête préprocessée: '{processed_query}'")
        
        # Étape 1: Recherche vectorielle initiale avec plus de candidats
        initial_k = min(k * 3, len(self.chunks))  # 3x plus de candidats pour le reranking
        
        query_embedding = self.embedder.encode([processed_query])
        faiss.normalize_L2(query_embedding)
        
        scores, indices = self.index.search(query_embedding.astype('float32'), initial_k)
        
        print(f"  🎯 Recherche initiale effectuée, top {initial_k} candidats:")
        
        # Collecter tous les candidats avec leurs scores
        candidates = []
        for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if idx >= 0 and idx < len(self.chunk_metadata):  # Vérification de sécurité
                metadata = self.chunk_metadata[idx]
                candidates.append({
                    'text': metadata['text'],
                    'doc_id': metadata['doc_id'],
                    'score': float(score),
                    'initial_rank': i + 1
                })
                print(f"    {i+1}. Score initial: {score:.4f}")
        
        if not candidates:
            print("  ❌ Aucun candidat trouvé")
            return []
        
        # Étape 2: Reranking si disponible
        if self.use_reranking and len(candidates) > 1:
            print(f"  🔄 Reranking de {len(candidates)} candidats...")
            
            # Préparer les paires (query, chunk) pour le reranker
            pairs = [(processed_query, candidate['text']) for candidate in candidates]
            
            # Calculer les scores de reranking
            rerank_scores = self.reranker.predict(pairs)
            
            # Mettre à jour les scores et trier
            for i, candidate in enumerate(candidates):
                candidate['rerank_score'] = float(rerank_scores[i])
            
            # Trier par score de reranking
            candidates.sort(key=lambda x: x['rerank_score'], reverse=True)
            
            print(f"  📊 Scores après reranking:")
            for i, candidate in enumerate(candidates[:5]):
                print(f"    {i+1}. Rerank: {candidate['rerank_score']:.4f} | Initial: {candidate['score']:.4f}")
        
        # Étape 3: Filtrage final et recherche par mots-clés
        final_results = []
        
        # Ajout de la recherche par mots-clés pour compléter
        keyword_matches = self._keyword_search(query, candidates)
        
        # Combiner les résultats
        seen_chunks = set()
        
        # D'abord les résultats reranked/vectoriels
        for candidate in candidates:
            if len(final_results) >= k:
                break
                
            chunk_text = candidate['text']
            if chunk_text not in seen_chunks:
                # Critères de sélection plus flexibles
                if (self.use_reranking and candidate.get('rerank_score', 0) > -5) or \
                   (not self.use_reranking and candidate['score'] >= config.SIMILARITY_THRESHOLD * 0.7):
                    
                    final_results.append(candidate)
                    seen_chunks.add(chunk_text)
        
        # Puis les matches par mots-clés s'il reste de la place
        for match in keyword_matches:
            if len(final_results) >= k:
                break
            if match['text'] not in seen_chunks:
                final_results.append(match)
                seen_chunks.add(match['text'])
        
        print(f"  📋 {len(final_results)} chunks finaux retenus")
        
        # Debug: afficher les chunks retenus
        for i, result in enumerate(final_results):
            preview = result['text'][:100].replace('\n', ' ')
            print(f"    {i+1}. {preview}...")
        
        return final_results
    
    def _keyword_search(self, query: str, existing_candidates: List[Dict]) -> List[Dict]:
        """Recherche par mots-clés pour compléter la recherche vectorielle"""
        # Extraire les mots-clés importants de la requête
        query_lower = query.lower()
        keywords = []
        
        # Mots-clés spécifiques pour les conditions d'accès
        if any(word in query_lower for word in ['condition', 'accès', 'acces', 'admission', 'prérequis', 'prereq']):
            keywords.extend(['condition', 'accès', 'acces', 'admission', 'prérequis', 'prereq', 'baccalauréat', 'bac'])
        
        # Mots-clés pour ARI
        if any(word in query_lower for word in ['ari', 'administration', 'réseaux', 'reseaux', 'informatique']):
            keywords.extend(['ari', 'administration', 'réseaux', 'reseaux', 'informatique'])
        
        matches = []
        existing_texts = {c['text'] for c in existing_candidates}
        
        for i, chunk in enumerate(self.chunks):
            if chunk in existing_texts:
                continue
                
            chunk_lower = chunk.lower()
            score = 0
            
            # Compter les correspondances de mots-clés
            for keyword in keywords:
                if keyword in chunk_lower:
                    score += 1
            
            if score > 0:
                matches.append({
                    'text': chunk,
                    'doc_id': self.chunk_metadata[i]['doc_id'] if i < len(self.chunk_metadata) else 'unknown',
                    'score': score * 0.1,  # Score artificiel pour le tri
                    'keyword_score': score,
                    'source': 'keyword_search'
                })
        
        # Trier par score de mots-clés
        matches.sort(key=lambda x: x['keyword_score'], reverse=True)
        
        if matches:
            print(f"  🔑 {len(matches)} correspondances par mots-clés trouvées")
        
        return matches[:3]  # Limiter à 3 résultats par mots-clés
    
    def _preprocess_query(self, query: str) -> str:
        """Préprocesse la requête pour améliorer la recherche"""
        # Normaliser les accents et caractères spéciaux
        query = query.lower()
        
        # Corrections orthographiques courantes
        replacements = {
            'acce': 'accès',
            'acces': 'accès', 
            'prereq': 'prérequis',
            'reseaux': 'réseaux',
            'informatique': 'informatique'
        }
        
        for old, new in replacements.items():
            query = query.replace(old, new)
        
        return query
    
    async def has_relevant_context(self, query: str) -> bool:
        """Vérifie s'il y a du contexte pertinent pour une requête"""
        similar_chunks = await self.search_similar_chunks(query, k=1)
        has_context = len(similar_chunks) > 0
        print(f"  🎯 Contexte pertinent trouvé: {'Oui' if has_context else 'Non'}")
        return has_context
    
    async def get_context_for_query(self, query: str) -> Tuple[str, List[str]]:
        """Récupère le contexte pertinent pour une requête"""
        similar_chunks = await self.search_similar_chunks(query, k=5)
        
        if not similar_chunks:
            return "", []
        
        # Assembler le contexte en priorisant les meilleurs résultats
        context_parts = []
        source_docs = set()
        
        for chunk in similar_chunks:
            # Nettoyer le texte du chunk
            clean_text = self._clean_chunk_text(chunk['text'])
            context_parts.append(clean_text)
            source_docs.add(chunk['doc_id'])
        
        context = "\n\n".join(context_parts)
        print(f"  📝 Contexte assemblé: {len(context)} caractères, {len(source_docs)} documents sources")
        
        # Debug: afficher le contexte assemblé
        print(f"  📄 CONTEXTE FINAL:")
        print(f"    {context[:300]}...")
        
        return context, list(source_docs)
    
    def _clean_chunk_text(self, text: str) -> str:
        """Nettoie le texte d'un chunk"""
        # Supprimer les caractères de contrôle et les caractères bizarres
        text = re.sub(r'[^\x20-\x7E\n\r\t\u00C0-\u017F]', '', text)
        
        # Normaliser les espaces
        text = re.sub(r'\s+', ' ', text)
        
        # Supprimer les espaces en début et fin
        text = text.strip()
        
        return text
    
    def _split_text_advanced(self, text: str) -> List[str]:
        """Découpe le texte en chunks avec une logique avancée"""
        if not text or not text.strip():
            return []
        
        # Nettoyer le texte d'abord
        text = self._clean_chunk_text(text)
        
        chunks = []
        
        # Essayer de découper par sections logiques d'abord
        sections = re.split(r'\n\s*\n|(?=CONDITIONS D\'ACCES|OBJECTIF|DÉBOUCHÉS)', text)
        
        for section in sections:
            section = section.strip()
            if not section:
                continue
                
            # Si la section est petite, la garder entière
            if len(section) <= config.CHUNK_SIZE:
                chunks.append(section)
            else:
                # Sinon, la découper normalement
                chunks.extend(self._split_text_normal(section))
        
        return chunks
    
    def _split_text_normal(self, text: str) -> List[str]:
        """Découpage normal par taille"""
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + config.CHUNK_SIZE
            
            # Essayer de couper à un espace ou un retour à la ligne
            if end < len(text):
                for sep in ['\n\n', '\n', '. ', ' ']:
                    sep_pos = text.rfind(sep, start, end)
                    if sep_pos > start:
                        end = sep_pos + len(sep)
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - config.CHUNK_OVERLAP
            if start >= end:
                start = end
        
        return chunks
    
    async def remove_document_from_index(self, doc_id: str):
        """Supprime un document de l'index (reconstruction complète)"""
        print(f"Suppression du document {doc_id} de l'index...")
        
        # Filtrer les métadonnées
        remaining_metadata = [m for m in self.chunk_metadata if m['doc_id'] != doc_id]
        remaining_chunks = [m['text'] for m in remaining_metadata]
        
        if not remaining_chunks:
            # Réinitialiser l'index si plus de chunks
            self.index = None
            self.chunks = []
            self.chunk_metadata = []
            print("  🗑️ Index réinitialisé (plus de documents)")
        else:
            # Reconstruire l'index
            embeddings = self.embedder.encode(remaining_chunks)
            faiss.normalize_L2(embeddings)
            
            dimension = embeddings.shape[1]
            self.index = faiss.IndexFlatIP(dimension)
            self.index.add(embeddings.astype('float32'))
            
            self.chunks = remaining_chunks
            self.chunk_metadata = remaining_metadata
            print(f"  🔄 Index reconstruit: {len(remaining_chunks)} chunks restants")
        
        await self._save_index()
    
    async def _load_index(self):
        """Charge l'index depuis le disque"""
        try:
            if os.path.exists(self.index_file):
                self.index = faiss.read_index(self.index_file)
                print(f"Index FAISS chargé depuis {self.index_file}")
            
            if os.path.exists(self.chunks_file):
                with open(self.chunks_file, 'rb') as f:
                    self.chunks = pickle.load(f)
                print(f"Chunks chargés: {len(self.chunks)}")
            
            if os.path.exists(self.metadata_file):
                with open(self.metadata_file, 'rb') as f:
                    self.chunk_metadata = pickle.load(f)
                print(f"Métadonnées chargées: {len(self.chunk_metadata)}")
                    
        except Exception as e:
            print(f"Erreur lors du chargement de l'index: {e}")
            self.index = None
            self.chunks = []
            self.chunk_metadata = []
    
    async def _save_index(self):
        """Sauvegarde l'index sur le disque"""
        try:
            if self.index is not None:
                faiss.write_index(self.index, self.index_file)
                print(f"Index FAISS sauvegardé: {self.index_file}")
            
            with open(self.chunks_file, 'wb') as f:
                pickle.dump(self.chunks, f)
            
            with open(self.metadata_file, 'wb') as f:
                pickle.dump(self.chunk_metadata, f)
                
        except Exception as e:
            print(f"Erreur lors de la sauvegarde de l'index: {e}")

# Instance globale
rag_service = RAGService()