from datetime import datetime, timedelta, timezone
from typing import Optional, Set
import bcrypt
import jwt
from app.core.config import settings

# In-memory token blacklist fallback for local execution & testing
_memory_token_blacklist: Set[str] = set()
_redis_client = None
_redis_checked = False


def get_redis():
    global _redis_client, _redis_checked
    if _redis_checked:
        return _redis_client
    _redis_checked = True
    try:
        import redis
        client = redis.from_url(
            settings.REDIS_URL,
            socket_connect_timeout=0.05,
            socket_timeout=0.05,
        )
        client.ping()
        _redis_client = client
        return _redis_client
    except Exception:
        _redis_client = None
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8")[:72], salt).decode("utf-8")


def create_access_token(
    subject: str,
    tenant_id: str,
    role: str = "member",
    expires_delta: Optional[timedelta] = None,
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "tenant_id": str(tenant_id),
        "role": role,
        "type": "access",
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(subject: str, tenant_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "tenant_id": str(tenant_id),
        "type": "refresh",
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except jwt.PyJWTError:
        return None


def blacklist_token(token: str, ttl_seconds: int = 3600) -> None:
    """Blacklist a revoked JWT token in Redis or in-memory fallback."""
    r = get_redis()
    if r is not None:
        try:
            r.setex(f"blacklist:{token}", ttl_seconds, "revoked")
        except Exception:
            pass
    _memory_token_blacklist.add(token)


def is_token_blacklisted(token: str) -> bool:
    """Check if token exists in the blacklist."""
    r = get_redis()
    if r is not None:
        try:
            res = r.get(f"blacklist:{token}")
            if res is not None:
                return True
        except Exception:
            pass
    return token in _memory_token_blacklist
