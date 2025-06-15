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
                CREATE KEYSPACE IF NOT EXISTS calendar
                WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
            """)

            _session.set_keyspace('calendar')

            _session.execute("""
                CREATE TABLE IF NOT EXISTS event (
                    id TEXT,
                    title TEXT,
                    start TIMESTAMP,
                    end TIMESTAMP,
                    color TEXT,
                    filier_id TEXT,
                    PRIMARY KEY (filier_id, id)
                )
            """)
        except Exception as e:
            print(f"Error connecting to Cassandra: {str(e)}")
            raise

    return _session
