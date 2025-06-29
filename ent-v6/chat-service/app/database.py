import os
from cassandra.cluster import Cluster, NoHostAvailable
from cassandra.auth import PlainTextAuthProvider
from cassandra.query import dict_factory
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

            logger.info("Connected to Cassandra cluster")

            # Create keyspace if it doesn't exist
            _session.execute("""
                CREATE KEYSPACE IF NOT EXISTS messaging
                WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
            """)
            logger.info("Created/verified messaging keyspace")

            _session.set_keyspace('messaging')

            # Create tables if they don't exist
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
            
            # Create table for chat rooms with name index
            _session.execute("""
                CREATE TABLE IF NOT EXISTS chat_rooms (
                    room_id TEXT PRIMARY KEY,
                    name TEXT,
                    created_at TIMESTAMP,
                    created_by TEXT,
                    is_group BOOLEAN
                )
            """)
            
            # Create table for room participants with compound primary key
            _session.execute("""
                CREATE TABLE IF NOT EXISTS room_participants (
                    room_id TEXT,
                    user_id TEXT,
                    joined_at TIMESTAMP,
                    PRIMARY KEY ((room_id), user_id)
                )
            """)

            logger.info("Database tables initialized successfully")

        except NoHostAvailable as e:
            logger.error(f"Could not connect to Cassandra cluster: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error initializing database: {str(e)}")
            raise

    return _session

def execute_query(query, params=None):
    """Execute a Cassandra query with error handling."""
    try:
        session = get_cassandra_session()
        return session.execute(query, params) if params else session.execute(query)
    except Exception as e:
        logger.error(f"Database query error: {str(e)}")
        logger.error(f"Query: {query}")
        logger.error(f"Params: {params}")
        raise
