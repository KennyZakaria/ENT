from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider
import os
import uuid
from datetime import datetime
from fastapi import HTTPException, status

class CassandraClient:
    """
    Client for interacting with Cassandra database
    """
    def __init__(self):
        # Cassandra configuration from environment variables
        auth_provider = PlainTextAuthProvider(
            username=os.getenv("CASSANDRA_USERNAME", "cassandra"),
            password=os.getenv("CASSANDRA_PASSWORD", "cassandra")
        )

        self.cluster = Cluster(
            contact_points=os.getenv("CASSANDRA_CONTACT_POINTS", "localhost").split(","),
            auth_provider=auth_provider,
            port=int(os.getenv("CASSANDRA_PORT", "9042")),
        )
        
        # Initialize session
        self.session = self.cluster.connect()
        
        # Create keyspace and table if they don't exist
        self._initialize_database()
        
    def _initialize_database(self):
        """
        Creates keyspace and tables if they don't exist
        """
        self.session.execute("""
            CREATE KEYSPACE IF NOT EXISTS course_files
            WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1'}
        """)

        self.session.execute("""
            CREATE TABLE IF NOT EXISTS course_files.files (
                id UUID PRIMARY KEY,
                title TEXT,
                description TEXT,
                url TEXT,
                filename TEXT,
                upload_date TIMESTAMP,
                teacher_id TEXT,
                sector_id TEXT
            )
        """)

        self.session.set_keyspace("course_files")
    
    def store_file_metadata(self, file_id, title, description, url, original_filename, teacher_id, sector_id=None):
        """
        Stores file metadata in Cassandra
        
        Args:
            file_id: Unique file identifier
            title: Course title
            description: Course description
            url: File URL in MinIO
            original_filename: Original filename
            teacher_id: ID of the teacher who uploaded the file
            sector_id: ID of the sector (optional)
            
        Returns:
            bool: True if successful
            
        Raises:
            HTTPException: If database operation fails
        """
        try:
            self.session.execute(
                """INSERT INTO files (id, title, description, url, filename, upload_date, teacher_id, sector_id) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (uuid.UUID(file_id), title, description, url, original_filename, datetime.now(), teacher_id, sector_id)
            )
            return True
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error storing file metadata: {str(e)}"
            )
    
    def close(self):
        """
        Closes the Cassandra connection
        """
        if self.cluster:
            self.cluster.shutdown()