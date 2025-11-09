"""Generate secure keys for .env file"""
import secrets

print("# Generated secure keys")
print(f"SECRET_KEY={secrets.token_urlsafe(32)}")
print(f"ENCRYPTION_MASTER_KEY={secrets.token_urlsafe(32)}")
print(f"ENCRYPTION_SALT={secrets.token_urlsafe(16)}")
