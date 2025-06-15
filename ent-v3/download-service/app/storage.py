import os
from minio import Minio
from urllib.parse import urlparse

# MinIO configuration
MINIO_ENDPOINT = os.environ.get("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.environ.get("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.environ.get("MINIO_SECRET_KEY", "minioadmin")
MINIO_SECURE = os.environ.get("MINIO_SECURE", "False").lower() == "true"
MINIO_BUCKET_NAME = os.environ.get("MINIO_BUCKET_NAME", "courses")
MINIO_PUBLIC_URL = os.environ.get("MINIO_PUBLIC_URL", "http://localhost:9000")

# MinIO client cache
_minio_client = None

def get_minio_client():
    """Get or create a MinIO client."""
    global _minio_client
    
    if _minio_client is None:
        try:
            # Parse the endpoint to extract host and port
            parsed_url = urlparse(f"{'https' if MINIO_SECURE else 'http'}://{MINIO_ENDPOINT}")
            host = parsed_url.netloc or MINIO_ENDPOINT
            
            # Create MinIO client
            _minio_client = Minio(
                endpoint=host,
                access_key=MINIO_ACCESS_KEY,
                secret_key=MINIO_SECRET_KEY,
                secure=MINIO_SECURE
            )
            
            # Check if bucket exists, create if it doesn't
            if not _minio_client.bucket_exists(MINIO_BUCKET_NAME):
                _minio_client.make_bucket(MINIO_BUCKET_NAME)
                print(f"Created bucket: {MINIO_BUCKET_NAME}")
                
                # Set bucket policy to allow public read access if needed
                # This is optional and depends on your security requirements
                # policy = {
                #     "Version": "2012-10-17",
                #     "Statement": [
                #         {
                #             "Effect": "Allow",
                #             "Principal": {"AWS": ["*"]},
                #             "Action": ["s3:GetObject"],
                #             "Resource": [f"arn:aws:s3:::{MINIO_BUCKET_NAME}/*"]
                #         }
                #     ]
                # }
                # _minio_client.set_bucket_policy(MINIO_BUCKET_NAME, json.dumps(policy))
        except Exception as e:
            print(f"Error connecting to MinIO: {str(e)}")
            raise
    
    return _minio_client

def get_public_url(object_name):
    """Generate a public URL for an object."""
    return f"{MINIO_PUBLIC_URL}/{MINIO_BUCKET_NAME}/{object_name}"