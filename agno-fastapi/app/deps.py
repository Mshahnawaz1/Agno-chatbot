from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app import db


def get_current_user(x_user_id: Annotated[str, Header()]) -> dict:
    """DEV ONLY: trusts an X-User-Id header.
    In Step 6 we replace the body of this function with JWT validation
    (sub claim -> user id). Routes won't change because they only depend on this.
    """
    user = db.get_user(x_user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unknown user")
    return user


CurrentUser = Annotated[dict, Depends(get_current_user)]