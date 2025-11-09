"""
Database initialization and seeding script
Creates tables and populates with initial data
"""
from sqlalchemy.orm import Session
from app.models.sqlite_models import Base, User, Setting
from app.utils.db import engine
from app.core.security import get_password_hash
from app.config import settings
from datetime import datetime
import os
import secrets


def init_database():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")


def seed_admin_user(db: Session):
    """Create default admin user if it doesn't exist"""
    # Check if admin already exists
    admin = db.query(User).filter(User.username == "admin").first()

    if not admin:
        print("Creating default admin user...")

        # Get password from environment or generate random one
        admin_password = os.environ.get("ADMIN_DEFAULT_PASSWORD")

        if not admin_password:
            # Generate secure random password
            admin_password = secrets.token_urlsafe(16)
            print("\n" + "!"*70)
            print("WARNING: Generated random admin password.")
            print("!"*70)
            print(f"\n  Username: admin")
            print(f"  Password: {admin_password}")
            print("\n  SAVE THIS PASSWORD - IT WILL NOT BE SHOWN AGAIN!")
            print("!"*70 + "\n")

        admin = User(
            username="admin",
            email=os.environ.get("ADMIN_EMAIL", "admin@example.com"),
            password_hash=get_password_hash(admin_password),
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.commit()
        print(f"Admin user created (ID: {admin.id})")
    else:
        print(f"Admin user already exists (ID: {admin.id})")

    return admin


def seed_demo_users(db: Session):
    """Create demo users for testing - ONLY in development"""
    # Check if we're in production
    if not settings.DEBUG:
        print("Skipping demo users - not in DEBUG mode")
        return

    print("\nWARNING: Creating demo users (DEBUG mode only)")

    demo_users = [
        {
            "username": "editor",
            "email": "editor@example.com",
            "password": "editor123",
            "role": "editor"
        },
        {
            "username": "viewer",
            "email": "viewer@example.com",
            "password": "viewer123",
            "role": "viewer"
        }
    ]

    created_users = []
    user_passwords = {}  # Track passwords for each user

    for user_data in demo_users:
        # Check if user already exists
        existing = db.query(User).filter(User.username == user_data["username"]).first()

        if not existing:
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                password_hash=get_password_hash(user_data["password"]),
                role=user_data["role"],
                is_active=True
            )
            db.add(user)
            created_users.append(user)
            user_passwords[user_data["username"]] = user_data["password"]

    if created_users:
        db.commit()
        print(f"Created {len(created_users)} demo users (DEBUG ONLY)")
        for user in created_users:
            print(f"  - {user.username} ({user.role}) - password: {user_passwords[user.username]}")
    else:
        print("Demo users already exist")


def seed_default_settings(db: Session):
    """Create default application settings"""
    default_settings = [
        {
            "key": "app.name",
            "value": {"name": "Visualization Platform"},
            "description": "Application name"
        },
        {
            "key": "app.theme",
            "value": {"theme": "light"},
            "description": "Default application theme"
        },
        {
            "key": "export.max_size_mb",
            "value": {"size": 50},
            "description": "Maximum export file size in MB"
        },
        {
            "key": "query.timeout_seconds",
            "value": {"timeout": 30},
            "description": "Query execution timeout in seconds"
        },
        {
            "key": "query.max_results",
            "value": {"max": 10000},
            "description": "Maximum query result rows"
        }
    ]

    created_settings = []
    for setting_data in default_settings:
        # Check if setting already exists
        existing = db.query(Setting).filter(Setting.key == setting_data["key"]).first()

        if not existing:
            setting = Setting(
                key=setting_data["key"],
                value=setting_data["value"],
                description=setting_data["description"]
            )
            db.add(setting)
            created_settings.append(setting)

    if created_settings:
        db.commit()
        print(f"Created {len(created_settings)} default settings")
    else:
        print("Default settings already exist")


def run_seeds():
    """Run all seed functions"""
    from app.utils.db import SessionLocal

    print("\n" + "="*60)
    print("Database Initialization and Seeding")
    print("="*60 + "\n")

    # Initialize database
    init_database()

    # Create session
    db = SessionLocal()

    try:
        # Seed data
        print("\nSeeding data...")
        seed_admin_user(db)
        seed_demo_users(db)
        seed_default_settings(db)

        print("\n" + "="*60)
        print("Database initialization completed successfully!")
        print("="*60 + "\n")

        # Show credential info based on DEBUG mode
        if settings.DEBUG:
            print("Default credentials (DEBUG MODE ONLY):")
            print("  Admin: Check console output above for generated password")
            print("         (or set ADMIN_DEFAULT_PASSWORD in .env)")
            print("  Demo users: See seed output above for credentials")
            print("\nNOTE: Demo users are only created in DEBUG mode")
        else:
            print("Production mode:")
            print("  Admin password: Set from ADMIN_DEFAULT_PASSWORD environment variable")
            print("                  (or generated randomly - see output above)")
            print("\nIMPORTANT: Save the generated password if one was created!")

    finally:
        db.close()


if __name__ == "__main__":
    run_seeds()
