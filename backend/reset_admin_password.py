#!/usr/bin/env python3
"""
Reset admin password utility
Usage: python reset_admin_password.py <new_password>
"""
import sys
from app.utils.db import SessionLocal
from app.models.sqlite_models import User
from app.core.security import get_password_hash


def reset_admin_password(new_password: str):
    """Reset the admin user password"""
    db = SessionLocal()
    try:
        # Find admin user
        admin = db.query(User).filter(User.username == "admin").first()

        if not admin:
            print("ERROR: Admin user not found in database!")
            return False

        # Update password
        admin.password_hash = get_password_hash(new_password)
        db.commit()

        print("✅ Admin password reset successfully!")
        print(f"\n  Username: admin")
        print(f"  Password: {new_password}")
        print("\nYou can now login with these credentials.\n")
        return True

    except Exception as e:
        print(f"ERROR: Failed to reset password: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python reset_admin_password.py <new_password>")
        print("\nExample:")
        print("  python reset_admin_password.py admin123")
        sys.exit(1)

    new_password = sys.argv[1]

    if len(new_password) < 8:
        print("ERROR: Password must be at least 8 characters long")
        sys.exit(1)

    reset_admin_password(new_password)
