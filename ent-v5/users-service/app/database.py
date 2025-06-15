import os
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider
from cassandra.query import dict_factory
from datetime import datetime

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
            auth_provider = PlainTextAuthProvider(username=USERNAME, password=PASSWORD)
            cluster = Cluster(contact_points=CONTACT_POINTS, port=PORT, auth_provider=auth_provider)
            _session = cluster.connect()
            _session.row_factory = dict_factory

            _session.execute("""
                CREATE KEYSPACE IF NOT EXISTS users
                WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
            """)

            _session.set_keyspace('users')

            # Create sectors table
            _session.execute("""
                CREATE TABLE IF NOT EXISTS sectors (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    description TEXT
                )
            """)

            # Create student_sectors table (for student-sector relationship)
            _session.execute("""
                CREATE TABLE IF NOT EXISTS student_sectors (
                    student_id TEXT,
                    sector_id TEXT,
                    PRIMARY KEY (student_id, sector_id)
                )
            """)

            # Create teacher_sectors table (for teacher-sector relationships)
            _session.execute("""
                CREATE TABLE IF NOT EXISTS teacher_sectors (
                    teacher_id TEXT,
                    sector_id TEXT,
                    PRIMARY KEY (teacher_id, sector_id)
                )
            """)

            # Create secondary indexes for efficient queries
            _session.execute("""
                CREATE INDEX IF NOT EXISTS ON student_sectors (sector_id)
            """)
            _session.execute("""
                CREATE INDEX IF NOT EXISTS ON teacher_sectors (sector_id)
            """)

        except Exception as e:
            print(f"Error connecting to Cassandra: {str(e)}")
            raise

    return _session
