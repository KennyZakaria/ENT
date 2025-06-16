# Microservice de Téléchargement (Download Service)

Ce microservice permet aux étudiants de lister et télécharger les fichiers de cours disponibles. Les métadonnées sont récupérées depuis Cassandra, et les liens de téléchargement sont générés de manière sécurisée depuis MinIO.

## Fonctionnalités

- Authentification JWT via Keycloak
- Vérification des rôles utilisateur (seuls les étudiants peuvent accéder aux endpoints)
- Listage des cours disponibles
- Génération d'URLs présignées pour le téléchargement sécurisé de fichiers

## Endpoints

### GET /courses

Liste tous les cours disponibles.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Réponse (200 OK):**
```json
[
  {
    "id": "course-id-1",
    "title": "Introduction to Computer Science",
    "description": "Learn the basics of computer science"
  },
  {
    "id": "course-id-2",
    "title": "Advanced Programming",
    "description": "Advanced programming techniques"
  }
]
```

### GET /courses/{id}/download

Génère une URL de téléchargement sécurisée pour un fichier de cours.

**Headers requis:**
```
Authorization: Bearer <token>
```

**Réponse (200 OK):**
```json
{
  "download_url": "https://minio.example.com/presigned/courses/filename.pdf"
}
```

## Configuration

Le service utilise les variables d'environnement suivantes:

### MinIO
- `MINIO_ENDPOINT`: Endpoint MinIO (par défaut: "minio:9000")
- `MINIO_ACCESS_KEY`: Clé d'accès MinIO (par défaut: "minioadmin")
- `MINIO_SECRET_KEY`: Clé secrète MinIO (par défaut: "minioadmin")
- `MINIO_SECURE`: Utiliser HTTPS pour MinIO (par défaut: "False")
- `MINIO_BUCKET_NAME`: Nom du bucket MinIO (par défaut: "courses")
- `MINIO_PUBLIC_URL`: URL publique de MinIO (par défaut: "http://localhost:9000")
- `PRESIGNED_URL_EXPIRY`: Durée de validité des URLs présignées en secondes (par défaut: 3600)

### Cassandra
- `CASSANDRA_CONTACT_POINTS`: Points de contact Cassandra (par défaut: "cassandra")
- `CASSANDRA_PORT`: Port Cassandra (par défaut: 9042)
- `CASSANDRA_USERNAME`: Nom d'utilisateur Cassandra (par défaut: "cassandra")
- `CASSANDRA_PASSWORD`: Mot de passe Cassandra (par défaut: "cassandra")

### Keycloak
- `KEYCLOAK_URL`: URL Keycloak (par défaut: "http://keycloak:8080")
- `KEYCLOAK_REALM`: Realm Keycloak (par défaut: "master")
- `KEYCLOAK_CLIENT_ID`: ID client Keycloak (par défaut: "file-upload-service")

## Démarrage

Pour démarrer le service avec Docker Compose:

```bash
docker-compose up -d
```

Le service sera accessible à l'adresse: http://localhost:8004

## Sécurité

- Les URLs présignées sont limitées dans le temps pour des raisons de sécurité
- L'authentification JWT est requise pour tous les endpoints
- Seuls les utilisateurs avec le rôle "student" peuvent accéder aux endpoints