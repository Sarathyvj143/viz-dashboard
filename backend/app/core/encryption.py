import base64
import json
from typing import Dict, Any
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from app.config import settings


class EncryptionError(Exception):
    """Raised when encryption fails"""
    pass


class DecryptionError(Exception):
    """Raised when decryption fails"""
    pass


class ConnectionEncryption:
    """Handles encryption/decryption of connection credentials"""

    def __init__(self, master_key: str = None, salt: str = None):
        """
        Initialize encryption with master key and salt

        Args:
            master_key: Master encryption key from environment
                        If not provided, generates new key (not recommended for production)
            salt: Unique salt for key derivation (should be unique per deployment)
        """
        if master_key:
            # Use provided salt or from settings
            salt_bytes = (salt or settings.ENCRYPTION_SALT).encode()

            # Derive key from master key using PBKDF2
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt_bytes,
                iterations=100000,
                backend=default_backend()
            )
            key = base64.urlsafe_b64encode(kdf.derive(master_key.encode()))
        else:
            # Generate new key (only for development)
            key = Fernet.generate_key()

        self.cipher = Fernet(key)

    def encrypt_connection_config(self, config: Dict[str, Any]) -> str:
        """
        Encrypt connection configuration

        Args:
            config: Connection configuration dictionary

        Returns:
            Encrypted configuration as base64 string

        Raises:
            EncryptionError: If encryption fails
        """
        try:
            # Convert to JSON
            json_str = json.dumps(config)

            # Encrypt
            encrypted_bytes = self.cipher.encrypt(json_str.encode())

            # Return as base64 string
            return base64.urlsafe_b64encode(encrypted_bytes).decode()

        except Exception as e:
            raise EncryptionError(f"Failed to encrypt connection config: {e}")

    def decrypt_connection_config(self, encrypted_config: str) -> Dict[str, Any]:
        """
        Decrypt connection configuration

        Args:
            encrypted_config: Encrypted configuration as base64 string

        Returns:
            Decrypted configuration dictionary

        Raises:
            DecryptionError: If decryption fails
        """
        try:
            # Decode base64
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_config.encode())

            # Decrypt
            decrypted_bytes = self.cipher.decrypt(encrypted_bytes)

            # Parse JSON
            return json.loads(decrypted_bytes.decode())

        except Exception as e:
            raise DecryptionError(f"Failed to decrypt connection config: {e}")

    def encrypt_field(self, value: str) -> str:
        """Encrypt a single field (password, API key, etc.)"""
        try:
            encrypted = self.cipher.encrypt(value.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            raise EncryptionError(f"Failed to encrypt field: {e}")

    def decrypt_field(self, encrypted_value: str) -> str:
        """Decrypt a single field"""
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_value.encode())
            decrypted = self.cipher.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            raise DecryptionError(f"Failed to decrypt field: {e}")


# Global encryption instance
encryption = ConnectionEncryption(
    master_key=settings.ENCRYPTION_MASTER_KEY,
    salt=settings.ENCRYPTION_SALT
)
