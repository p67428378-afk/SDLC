import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from server.config import settings

DATABASE_URL = os.getenv("DATABASE_URL", settings.DATABASE_URL)

# SQLite specific configuration for thread safety in tests
connect_args = {}
poolclass = None
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    poolclass = StaticPool

engine = create_engine(DATABASE_URL, connect_args=connect_args, poolclass=poolclass)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Import models here to register them on Base.metadata

    Base.metadata.create_all(bind=engine)


def seed_data(db):
    from server.models.user import User
    from server.models.banking import Account
    from server.models.alert import AlertPreference
    from server.utils.security import get_password_hash
    from sqlalchemy.exc import IntegrityError
    import uuid

    users_to_seed = [
        {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword",
            "role": "customer",
            "phone_number": "+15551234567",
        },
        {
            "username": "adminuser",
            "email": "admin@example.com",
            "password": "adminpassword",
            "role": "admin",
            "phone_number": "+15557654321",
        },
    ]

    for u_data in users_to_seed:
        existing_user = db.query(User).filter(User.email == u_data["email"]).first()
        if not existing_user:
            user_id = str(uuid.uuid4())
            new_user = User(
                id=user_id,
                username=u_data["username"],
                email=u_data["email"],
                hashed_password=get_password_hash(u_data["password"]),
                role=u_data["role"],
                phone_number=u_data["phone_number"],
                is_locked=False,
            )
            db.add(new_user)
            try:
                db.commit()
                db.refresh(new_user)
            except IntegrityError:
                db.rollback()
                new_user = db.query(User).filter(User.email == u_data["email"]).first()
                user_id = new_user.id

            # Seed alert preferences for the user
            existing_pref = (
                db.query(AlertPreference)
                .filter(AlertPreference.user_id == user_id)
                .first()
            )
            if not existing_pref:
                pref = AlertPreference(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    low_balance_threshold=100.00,
                    large_transaction_threshold=5000.00,
                    channels={"email": True, "sms": True, "push": True},
                )
                db.add(pref)
                try:
                    db.commit()
                except IntegrityError:
                    db.rollback()

            # Seed accounts for customer
            if u_data["role"] == "customer":
                existing_accounts = (
                    db.query(Account).filter(Account.user_id == user_id).all()
                )
                if not existing_accounts:
                    checking = Account(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        account_number="1234567890",
                        account_type="checking",
                        balance=12450.82,
                        available_balance=12450.82,
                        currency="USD",
                        status="active",
                    )
                    savings = Account(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        account_number="0987654321",
                        account_type="savings",
                        balance=45120.45,
                        available_balance=45120.45,
                        currency="USD",
                        status="active",
                    )
                    db.add(checking)
                    db.add(savings)
                    try:
                        db.commit()
                    except IntegrityError:
                        db.rollback()
