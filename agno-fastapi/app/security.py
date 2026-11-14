"""Password hashing + JWT creation/verification.

Pure functions, no FastAPI imports: deps.py and the routers turn failures
into HTTP errors. Keeping crypto here means there's one place to audit.
"""

from datetime import datetime, timedelta, timezone

import jwt
from cryptography.fernet import Fernet
from pwdlib import PasswordHash

from app.config import settings

# ---- passwords ----

# argon2 with sensible defaults; salts each hash automatically.
_password_hash = PasswordHash.recommended()

# Used when the email doesn't exist, so a login for an unknown email costs the
# same time as a wrong password. Otherwise response timing reveals which
# emails are registered.
_DUMMY_HASH = _password_hash.hash("dummy-password-for-timing")


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    """Pass password_hash=None when the user wasn't found; still does the work."""
    if password_hash is None:
        _password_hash.verify(password, _DUMMY_HASH)
        return False
    return _password_hash.verify(password, password_hash)


# ---- JWT ----


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,  # who the token is about -> our users.id
        "iat": now,  # issued at
        "exp": now + timedelta(minutes=settings.access_token_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str:
    """Return the user id (sub) from a valid token.

    Raises jwt.InvalidTokenError (or a subclass such as ExpiredSignatureError)
    if the signature is wrong, the token expired, or a claim is missing.
    """
    payload = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],  # pin it: never trust the token's own "alg"
        options={"require": ["exp", "sub"]},
    )
    sub = payload["sub"]
    if not isinstance(sub, str) or not sub:
        raise jwt.InvalidTokenError("Invalid subject")
    return sub


# ---- connector secrets (OAuth tokens, API keys) at rest ----

_fernet = Fernet(settings.connector_secret)


def encrypt(text: str) -> str:
    return _fernet.encrypt(text.encode()).decode()


def decrypt(token: str) -> str:
    return _fernet.decrypt(token.encode()).decode()
