import os
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider
from cassandra.query import dict_factory

# Cassandra configuration
CONTACT_POINTS = os.environ.get("CASSANDRA_CONTACT_POINTS", "cassandra").split(",")
PORT = int(os.environ.get("CASSANDRA_PORT", 9042))
USERNAME = os.environ.get("CASSANDRA_USERNAME", "cassandra")
PASSWORD = os.environ.get("CASSANDRA_PASSWORD", "cassandra")

# Cassandra session cache
_session = None

def get_cassandra_session():
    """Get or create a Cassandra session."""
    global _session
    
    if _session is None:
        try:
            # Setup authentication
            auth_provider = PlainTextAuthProvider(username=USERNAME, password=PASSWORD)
            
            # Create cluster and connect
            cluster = Cluster(
                contact_points=CONTACT_POINTS,
                port=PORT,
                auth_provider=auth_provider
            )
            
            # Create session
            _session = cluster.connect()
            
            # Set row factory to dict_factory for easier data handling
            _session.row_factory = dict_factory
            
            # Create keyspace if it doesn't exist
            _session.execute("""
                CREATE KEYSPACE IF NOT EXISTS courses
                WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
            """)
            
            # Create table if it doesn't exist
            _session.execute("""
                CREATE TABLE IF NOT EXISTS courses.course (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    description TEXT,
                    file_path TEXT
                )
            """)
            
            # Insert sample data if table is empty
            count = _session.execute("SELECT COUNT(*) FROM courses.course").one()["count"]
            if count == 0:
                _session.execute("""
                    INSERT INTO courses.course (id, title, description, file_path)
                    VALUES (%s, %s, %s, %s)
                """, ["course-id-1", "Introduction to Computer Science", "Learn the basics of computer science", "course-id-1/intro-cs.pdf"])
                
                _session.execute("""
                    INSERT INTO courses.course (id, title, description, file_path)
                    VALUES (%s, %s, %s, %s)
                """, ["course-id-2", "Advanced Programming", "Advanced programming techniques", "course-id-2/advanced-programming.pdf"])
        except Exception as e:
            print(f"Error connecting to Cassandra: {str(e)}")
            raise
    
    return _session