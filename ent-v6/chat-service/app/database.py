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
                CREATE KEYSPACE IF NOT EXISTS messaging
                WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
            """)

            _session.set_keyspace('messaging')

            # Create table for messages
            _session.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT,
                    sender_id TEXT,
                    recipient_id TEXT,
                    content TEXT,
                    timestamp TIMESTAMP,
                    read BOOLEAN,
                    PRIMARY KEY ((recipient_id), timestamp, id)
                ) WITH CLUSTERING ORDER BY (timestamp DESC)
            """)
            
            # Create table for chat rooms
            _session.execute("""
                CREATE TABLE IF NOT EXISTS chat_rooms (
                    room_id TEXT,
                    name TEXT,
                    created_at TIMESTAMP,
                    created_by TEXT,
                    is_group BOOLEAN,
                    PRIMARY KEY (room_id)
                )
            """)
            
            # Create table for room participants
            _session.execute("""
                CREATE TABLE IF NOT EXISTS room_participants (
                    room_id TEXT,
                    user_id TEXT,
                    joined_at TIMESTAMP,
                    PRIMARY KEY (room_id, user_id)
                )
            """)
        except Exception as e:
            print(f"Error connecting to Cassandra: {str(e)}")
            raise

    return _session
