"""
Connection testing service - handles all connection type testing logic
"""
from typing import Dict, Any

# Import connection libraries with availability checks
try:
    import mysql.connector
    MYSQL_AVAILABLE = True
except ImportError:
    MYSQL_AVAILABLE = False

try:
    import psycopg2
    POSTGRESQL_AVAILABLE = True
except ImportError:
    POSTGRESQL_AVAILABLE = False

try:
    import boto3
    from botocore.exceptions import ClientError
    S3_AVAILABLE = True
except ImportError:
    S3_AVAILABLE = False

try:
    from azure.storage.blob import BlobServiceClient
    AZURE_AVAILABLE = True
except ImportError:
    AZURE_AVAILABLE = False

try:
    from google.cloud import storage
    GCS_AVAILABLE = True
except ImportError:
    GCS_AVAILABLE = False


class ConnectionTester:
    """Tests database and storage connections"""

    @staticmethod
    def test_mysql(config: Dict[str, Any]) -> Dict[str, Any]:
        """Test MySQL connection"""
        if not MYSQL_AVAILABLE:
            return {
                "success": False,
                "message": "MySQL support is not installed. Install mysql-connector-python package.",
                "details": {"error": "Missing dependency: mysql-connector-python"}
            }

        try:
            conn = mysql.connector.connect(
                host=config.get("host"),
                port=config.get("port", 3306),
                database=config.get("database"),
                user=config.get("user"),
                password=config.get("password"),
                connect_timeout=10
            )
            conn.close()
            return {
                "success": True,
                "message": f"Successfully connected to MySQL database '{config.get('database')}'",
                "details": {
                    "host": config.get("host"),
                    "port": config.get("port", 3306),
                    "database": config.get("database")
                }
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"MySQL connection failed: {str(e)}",
                "details": {
                    "error": str(e),
                    "type": type(e).__name__
                }
            }

    @staticmethod
    def test_postgresql(config: Dict[str, Any]) -> Dict[str, Any]:
        """Test PostgreSQL connection"""
        if not POSTGRESQL_AVAILABLE:
            return {
                "success": False,
                "message": "PostgreSQL support is not installed. Install psycopg2 package.",
                "details": {"error": "Missing dependency: psycopg2"}
            }

        try:
            conn = psycopg2.connect(
                host=config.get("host"),
                port=config.get("port", 5432),
                database=config.get("database"),
                user=config.get("user"),
                password=config.get("password"),
                connect_timeout=10
            )
            conn.close()
            return {
                "success": True,
                "message": f"Successfully connected to PostgreSQL database '{config.get('database')}'",
                "details": {
                    "host": config.get("host"),
                    "port": config.get("port", 5432),
                    "database": config.get("database")
                }
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"PostgreSQL connection failed: {str(e)}",
                "details": {
                    "error": str(e),
                    "type": type(e).__name__
                }
            }

    @staticmethod
    def test_s3(config: Dict[str, Any]) -> Dict[str, Any]:
        """Test S3 connection"""
        if not S3_AVAILABLE:
            return {
                "success": False,
                "message": "AWS S3 support is not installed. Install boto3 package.",
                "details": {"error": "Missing dependency: boto3"}
            }

        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=config.get("accessKeyId"),
                aws_secret_access_key=config.get("secretAccessKey"),
                region_name=config.get("region")
            )
            # Try to access bucket to verify credentials
            s3_client.head_bucket(Bucket=config.get("bucket"))
            return {
                "success": True,
                "message": f"Successfully connected to S3 bucket '{config.get('bucket')}'",
                "details": {
                    "bucket": config.get("bucket"),
                    "region": config.get("region")
                }
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"S3 connection failed: {str(e)}",
                "details": {
                    "error": str(e),
                    "type": type(e).__name__
                }
            }

    @staticmethod
    def test_azure_blob(config: Dict[str, Any]) -> Dict[str, Any]:
        """Test Azure Blob Storage connection"""
        if not AZURE_AVAILABLE:
            return {
                "success": False,
                "message": "Azure Blob support is not installed. Install azure-storage-blob package.",
                "details": {"error": "Missing dependency: azure-storage-blob"}
            }

        try:
            blob_service_client = BlobServiceClient.from_connection_string(
                config.get("connectionString")
            )
            # Try to get container properties to verify access
            container_client = blob_service_client.get_container_client(
                config.get("containerName")
            )
            container_client.get_container_properties()
            return {
                "success": True,
                "message": f"Successfully connected to Azure container '{config.get('containerName')}'",
                "details": {
                    "container": config.get("containerName")
                }
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Azure Blob connection failed: {str(e)}",
                "details": {
                    "error": str(e),
                    "type": type(e).__name__
                }
            }

    @staticmethod
    def test_gcs(config: Dict[str, Any]) -> Dict[str, Any]:
        """Test Google Cloud Storage connection"""
        if not GCS_AVAILABLE:
            return {
                "success": False,
                "message": "Google Cloud Storage support is not installed. Install google-cloud-storage package.",
                "details": {"error": "Missing dependency: google-cloud-storage"}
            }

        try:
            import os
            # Set credentials file path
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = config.get("keyFile")

            client = storage.Client(project=config.get("projectId"))
            bucket = client.get_bucket(config.get("bucket"))
            return {
                "success": True,
                "message": f"Successfully connected to GCS bucket '{config.get('bucket')}'",
                "details": {
                    "project": config.get("projectId"),
                    "bucket": config.get("bucket")
                }
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"GCS connection failed: {str(e)}",
                "details": {
                    "error": str(e),
                    "type": type(e).__name__
                }
            }

    @classmethod
    def test_connection(cls, connection_type: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Test a connection based on its type

        Args:
            connection_type: Type of connection (mysql, postgresql, s3, azure_blob, gcs)
            config: Connection configuration dictionary

        Returns:
            Dictionary with success status, message, and optional details
        """
        testers = {
            "mysql": cls.test_mysql,
            "postgresql": cls.test_postgresql,
            "s3": cls.test_s3,
            "azure_blob": cls.test_azure_blob,
            "gcs": cls.test_gcs,
        }

        tester = testers.get(connection_type)
        if not tester:
            return {
                "success": False,
                "message": f"Connection type '{connection_type}' is not supported for testing"
            }

        return tester(config)


# Global instance
connection_tester = ConnectionTester()
