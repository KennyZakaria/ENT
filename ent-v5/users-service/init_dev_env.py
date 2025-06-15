#!/usr/bin/env python3
"""
Script d'initialisation pour l'environnement de développement du microservice de téléchargement.
Ce script crée les structures nécessaires dans Cassandra et MinIO pour tester le service.
"""

import os
import sys
import time
from minio import Minio
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider

def init_cassandra():
    """Initialise la base de données Cassandra avec des données de test."""
    print("Initialisation de Cassandra...")
    
    # Configuration Cassandra
    contact_points = os.environ.get("CASSANDRA_CONTACT_POINTS", "cassandra").split(",")
    port = int(os.environ.get("CASSANDRA_PORT", 9042))
    username = os.environ.get("CASSANDRA_USERNAME", "cassandra")
    password = os.environ.get("CASSANDRA_PASSWORD", "cassandra")
    
    try:
        # Connexion à Cassandra
        auth_provider = PlainTextAuthProvider(username=username, password=password)
        cluster = Cluster(contact_points=contact_points, port=port, auth_provider=auth_provider)
        session = cluster.connect()
        
        # Création du keyspace et de la table
        session.execute("""
            CREATE KEYSPACE IF NOT EXISTS courses
            WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
        """)
        
        session.execute("""
            CREATE TABLE IF NOT EXISTS courses.course (
                id TEXT PRIMARY KEY,
                title TEXT,
                description TEXT,
                file_path TEXT
            )
        """)
        
        # Insertion des données de test
        session.execute("""
            INSERT INTO courses.course (id, title, description, file_path)
            VALUES (%s, %s, %s, %s)
        """, ["course-id-1", "Introduction to Computer Science", "Learn the basics of computer science", "course-id-1/intro-cs.pdf"])
        
        session.execute("""
            INSERT INTO courses.course (id, title, description, file_path)
            VALUES (%s, %s, %s, %s)
        """, ["course-id-2", "Advanced Programming", "Advanced programming techniques", "course-id-2/advanced-programming.pdf"])
        
        print("✅ Données Cassandra initialisées avec succès")
    except Exception as e:
        print(f"❌ Erreur lors de l'initialisation de Cassandra: {str(e)}")
        raise
    finally:
        if 'cluster' in locals():
            cluster.shutdown()

def init_minio():
    """Initialise MinIO avec des fichiers de test."""
    print("Initialisation de MinIO...")
    
    # Configuration MinIO
    endpoint = os.environ.get("MINIO_ENDPOINT", "minio:9000")
    access_key = os.environ.get("MINIO_ACCESS_KEY", "minioadmin")
    secret_key = os.environ.get("MINIO_SECRET_KEY", "minioadmin")
    secure = os.environ.get("MINIO_SECURE", "False").lower() == "true"
    bucket_name = os.environ.get("MINIO_BUCKET_NAME", "courses")
    
    try:
        # Connexion à MinIO
        client = Minio(
            endpoint=endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure
        )
        
        # Création du bucket s'il n'existe pas
        if not client.bucket_exists(bucket_name):
            client.make_bucket(bucket_name)
            print(f"Bucket '{bucket_name}' créé")
        
        # Création de fichiers de test
        # Fichier 1: intro-cs.pdf
        sample_content1 = b"This is a sample PDF content for Introduction to Computer Science"
        client.put_object(
            bucket_name=bucket_name,
            object_name="course-id-1/intro-cs.pdf",
            data=io.BytesIO(sample_content1),
            length=len(sample_content1),
            content_type="application/pdf"
        )
        
        # Fichier 2: advanced-programming.pdf
        sample_content2 = b"This is a sample PDF content for Advanced Programming"
        client.put_object(
            bucket_name=bucket_name,
            object_name="course-id-2/advanced-programming.pdf",
            data=io.BytesIO(sample_content2),
            length=len(sample_content2),
            content_type="application/pdf"
        )
        
        print("✅ Données MinIO initialisées avec succès")
    except Exception as e:
        print(f"❌ Erreur lors de l'initialisation de MinIO: {str(e)}")
        raise

def main():
    """Fonction principale."""
    print("=== Initialisation de l'environnement de développement ===")
    
    try:
        # Initialisation de Cassandra
        init_cassandra()
        
        # Initialisation de MinIO
        init_minio()
        
        print("\n✅ Environnement de développement initialisé avec succès")
        print("Vous pouvez maintenant démarrer le service avec 'docker-compose up'")
    except Exception as e:
        print(f"\n❌ Erreur lors de l'initialisation: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()