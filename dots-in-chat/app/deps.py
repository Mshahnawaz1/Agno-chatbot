from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app import db
from app.security import decode_access_token

# Reads "Authorization: Bearer <token>" and returns 401 when it's missing.
# tokenUrl only tells Swagger's "Authorize" button where to log in.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# One generic error for every failure: a client doesn't need to know
# whether the token was expired, forged, or for a deleted user.
_credentials_error = HTTPException(
    status.HTTP_401_UNAUTHORIZED,
    "Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> dict:
    """Verify the JWT and load the user it names (sub claim -> users.id).
    Routes only depend on CurrentUser, so they didn't change when this did.
    """
    try:
        user_id = decode_access_token(token)
    except jwt.InvalidTokenError:  # also covers ExpiredSignatureError
        raise _credentials_error

    # Still hit the DB: the token may outlive the user (deleted account).
    user = db.get_user(user_id)
    if user is None:
        raise _credentials_error
    return user


CurrentUser = Annotated[dict, Depends(get_current_user)]
