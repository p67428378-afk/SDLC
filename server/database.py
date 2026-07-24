import os
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# For SQLite, we need connect_args={"check_same_thread": False}
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except Exception:
        return False


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
    from server.models import User, Account, Transaction, Statement, FraudAlert
    import uuid
    from datetime import datetime, timedelta

    # Seed regular user
    test_user = db.query(User).filter(User.email == "test@example.com").first()
    if not test_user:
        test_user = User(
            id=str(uuid.uuid4()),
            username="testuser",
            email="test@example.com",
            hashed_password=get_password_hash("testpassword"),
            full_name="John Doe",
            role="customer",
            is_active=True,
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

    # Seed admin user
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin_user:
        admin_user = User(
            id=str(uuid.uuid4()),
            username="adminuser",
            email="admin@example.com",
            hashed_password=get_password_hash("adminpassword"),
            full_name="Admin User",
            role="admin",
            is_active=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

    # Seed accounts for test_user if none exist
    accounts = db.query(Account).filter(Account.user_id == test_user.id).all()
    if not accounts:
        checking = Account(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            account_number="1234567890",
            account_type="checking",
            balance=5240.50,
            currency="USD",
            status="active",
        )
        savings = Account(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            account_number="0987654321",
            account_type="savings",
            balance=24850.20,
            currency="USD",
            status="active",
        )
        db.add(checking)
        db.add(savings)
        db.commit()
        db.refresh(checking)
        db.refresh(savings)

        # Seed some transactions
        t1 = Transaction(
            id=str(uuid.uuid4()),
            source_account_id=checking.id,
            destination_account_id=None,
            amount=124.50,
            type="debit",
            description="Whole Foods Market",
            status="Completed",
            transaction_date=datetime.utcnow() - timedelta(days=1),
        )
        t2 = Transaction(
            id=str(uuid.uuid4()),
            source_account_id=checking.id,
            destination_account_id=savings.id,
            amount=500.00,
            type="transfer",
            description="Transfer to Savings",
            status="Completed",
            transaction_date=datetime.utcnow() - timedelta(days=2),
        )
        t3 = Transaction(
            id=str(uuid.uuid4()),
            source_account_id=checking.id,
            destination_account_id=None,
            amount=15.49,
            type="debit",
            description="Netflix Subscription",
            status="Completed",
            transaction_date=datetime.utcnow() - timedelta(days=3),
        )
        t4 = Transaction(
            id=str(uuid.uuid4()),
            source_account_id=checking.id,
            destination_account_id=None,
            amount=3500.00,
            type="credit",
            description="Payroll Direct Deposit",
            status="Completed",
            transaction_date=datetime.utcnow() - timedelta(days=4),
        )
        # High risk transaction to trigger fraud alert
        t5 = Transaction(
            id=str(uuid.uuid4()),
            source_account_id=checking.id,
            destination_account_id=None,
            amount=10000.00,
            type="debit",
            description="Suspicious Wire Transfer",
            status="Completed",
            transaction_date=datetime.utcnow(),
        )
        db.add_all([t1, t2, t3, t4, t5])
        db.commit()

        # Seed statements
        s1 = Statement(
            id=str(uuid.uuid4()),
            account_id=checking.id,
            file_name="statement_2026_06.pdf",
            download_url="/api/v1/banking/statements/statement_2026_06.pdf",
            statement_date="2026-06",
        )
        s2 = Statement(
            id=str(uuid.uuid4()),
            account_id=checking.id,
            file_name="statement_2026_07.pdf",
            download_url="/api/v1/banking/statements/statement_2026_07.pdf",
            statement_date="2026-07",
        )
        db.add_all([s1, s2])
        db.commit()

        # Seed fraud alert
        fa = FraudAlert(
            id=str(uuid.uuid4()),
            transaction_id=t5.id,
            rule_triggered="Large Transaction Amount",
            risk_score=85,
            status="open",
        )
        db.add(fa)
        db.commit()
