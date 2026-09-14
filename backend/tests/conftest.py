import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
import app.core.database as core_db
import app.middleware.quota as quota_mw
import app.tasks.parse_tasks as parse_tasks
from app.main import app
from app.core.security import get_password_hash, create_access_token
from app.models.tenant import Tenant
from app.models.user import User

# In-Memory SQLite with StaticPool ensures all threads and sessions share the exact same state without file locks
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Wire test session factory across all modules
core_db.SessionLocal = TestingSessionLocal
quota_mw.SessionLocal = TestingSessionLocal
parse_tasks.SessionLocal = TestingSessionLocal


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    core_db.Base.metadata.create_all(bind=test_engine)
    yield
    core_db.Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(autouse=True)
def clean_tables():
    yield
    # Clean up rows after each test while preserving schema
    with test_engine.connect() as conn:
        for table in reversed(core_db.Base.metadata.sorted_tables):
            conn.execute(table.delete())
        conn.commit()


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[core_db.get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_tenant(db):
    tenant = Tenant(
        name="Acme Audit Partners LLC",
        plan="individual",
        monthly_credit_limit=100,
        invoices_processed=10,
        auto_delete_original_pdf=True,
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@pytest.fixture
def sample_user(db, sample_tenant):
    user = User(
        tenant_id=sample_tenant.id,
        email="cpa@acme-audit.com",
        hashed_password=get_password_hash("securePassword123!"),
        full_name="John CPA",
        role="owner",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(sample_user, sample_tenant):
    token = create_access_token(
        subject=sample_user.id,
        tenant_id=sample_tenant.id,
        role=sample_user.role,
    )
    return {"Authorization": f"Bearer {token}"}
