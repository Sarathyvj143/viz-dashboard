"""
Connection inspector service - fetches metadata like tables, columns from database connections
"""
from typing import Dict, Any, List

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


class ConnectionInspector:
    """Inspects database connections to fetch metadata"""

    @staticmethod
    def get_mysql_tables(config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get list of tables from MySQL database"""
        if not MYSQL_AVAILABLE:
            raise Exception("MySQL support is not installed. Install mysql-connector-python package.")

        try:
            conn = mysql.connector.connect(
                host=config.get("host"),
                port=config.get("port", 3306),
                database=config.get("database"),
                user=config.get("user"),
                password=config.get("password"),
                connect_timeout=10
            )
            cursor = conn.cursor()
            cursor.execute("SHOW TABLES")
            tables = [{"name": row[0], "type": "table"} for row in cursor.fetchall()]
            cursor.close()
            conn.close()
            return tables
        except Exception as e:
            raise Exception(f"Failed to fetch MySQL tables: {str(e)}")

    @staticmethod
    def get_postgresql_tables(config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get list of tables from PostgreSQL database"""
        if not POSTGRESQL_AVAILABLE:
            raise Exception("PostgreSQL support is not installed. Install psycopg2 package.")

        try:
            conn = psycopg2.connect(
                host=config.get("host"),
                port=config.get("port", 5432),
                database=config.get("database"),
                user=config.get("user"),
                password=config.get("password"),
                connect_timeout=10
            )
            cursor = conn.cursor()
            # Get tables from public schema (you can modify to get from all schemas)
            cursor.execute("""
                SELECT table_name, table_type
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            tables = [{"name": row[0], "type": row[1].lower()} for row in cursor.fetchall()]
            cursor.close()
            conn.close()
            return tables
        except Exception as e:
            raise Exception(f"Failed to fetch PostgreSQL tables: {str(e)}")

    @staticmethod
    def get_table_columns(connection_type: str, config: Dict[str, Any], table_name: str) -> List[Dict[str, Any]]:
        """Get columns from a specific table"""
        if connection_type == "mysql":
            return ConnectionInspector._get_mysql_columns(config, table_name)
        elif connection_type == "postgresql":
            return ConnectionInspector._get_postgresql_columns(config, table_name)
        else:
            raise Exception(f"Column inspection not supported for connection type: {connection_type}")

    @staticmethod
    def _get_mysql_columns(config: Dict[str, Any], table_name: str) -> List[Dict[str, Any]]:
        """Get columns from MySQL table"""
        if not MYSQL_AVAILABLE:
            raise Exception("MySQL support is not installed.")

        try:
            conn = mysql.connector.connect(
                host=config.get("host"),
                port=config.get("port", 3306),
                database=config.get("database"),
                user=config.get("user"),
                password=config.get("password"),
                connect_timeout=10
            )
            cursor = conn.cursor()
            cursor.execute(f"DESCRIBE `{table_name}`")
            columns = [
                {
                    "name": row[0],
                    "type": row[1],
                    "nullable": row[2] == "YES",
                    "key": row[3],
                    "default": row[4]
                }
                for row in cursor.fetchall()
            ]
            cursor.close()
            conn.close()
            return columns
        except Exception as e:
            raise Exception(f"Failed to fetch MySQL columns: {str(e)}")

    @staticmethod
    def _get_postgresql_columns(config: Dict[str, Any], table_name: str) -> List[Dict[str, Any]]:
        """Get columns from PostgreSQL table"""
        if not POSTGRESQL_AVAILABLE:
            raise Exception("PostgreSQL support is not installed.")

        try:
            conn = psycopg2.connect(
                host=config.get("host"),
                port=config.get("port", 5432),
                database=config.get("database"),
                user=config.get("user"),
                password=config.get("password"),
                connect_timeout=10
            )
            cursor = conn.cursor()
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
                ORDER BY ordinal_position
            """, (table_name,))
            columns = [
                {
                    "name": row[0],
                    "type": row[1],
                    "nullable": row[2] == "YES",
                    "default": row[3]
                }
                for row in cursor.fetchall()
            ]
            cursor.close()
            conn.close()
            return columns
        except Exception as e:
            raise Exception(f"Failed to fetch PostgreSQL columns: {str(e)}")

    @classmethod
    def get_tables(cls, connection_type: str, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Get tables from a connection based on its type

        Args:
            connection_type: Type of connection (mysql, postgresql)
            config: Connection configuration dictionary

        Returns:
            List of table dictionaries with name and type
        """
        inspectors = {
            "mysql": cls.get_mysql_tables,
            "postgresql": cls.get_postgresql_tables,
        }

        inspector = inspectors.get(connection_type)
        if not inspector:
            raise Exception(f"Table inspection not supported for connection type: {connection_type}")

        return inspector(config)


# Global instance
connection_inspector = ConnectionInspector()
