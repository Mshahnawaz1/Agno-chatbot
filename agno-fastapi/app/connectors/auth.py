"""Per-user credentials for connectors.

OAuth follows the MCP authorization spec, so it works for any compliant server:
discover metadata -> register our app once (dynamic client registration) ->
authorization code + PKCE -> store tokens -> refresh when near expiry.
Servers without OAuth fall back to an API key the user pastes in.

Everything secret is Fernet-encrypted before it reaches the DB.
"""

import json
import secrets
import time
from urllib.parse import urlencode

import httpx
from mcp.client.auth import PKCEParameters
from mcp.client.auth.utils import (
    build_oauth_authorization_server_metadata_discovery_urls,
    build_protected_resource_metadata_discovery_urls,
)
from mcp.shared.auth import OAuthMetadata, OAuthToken, ProtectedResourceMetadata

from app import db
from app.config import settings
from app.connectors.registry import Connector
from app.security import decrypt, encrypt

TIMEOUT = 10  # seconds, for every call to a provider
REFRESH_MARGIN = 60  # refresh tokens this many seconds before they expire


class ConnectorError(Exception):
    """A provider call failed; the message is safe to show the user."""


class NoOAuth(ConnectorError):
    """The server doesn't offer OAuth, so it needs an API key."""


def redirect_uri(c: Connector) -> str:
    return f"{settings.public_url}/connectors/{c.id}/callback"


# ---- discovery + client registration ----


async def discover(c: Connector) -> OAuthMetadata | None:
    """The server's OAuth metadata, or None if it doesn't offer OAuth."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as http:
        auth_server = None
        for url in build_protected_resource_metadata_discovery_urls(None, c.url):
            r = await http.get(url)
            if r.is_success:
                resource = ProtectedResourceMetadata.model_validate_json(r.content)
                auth_server = str(resource.authorization_servers[0])
                break
        for url in build_oauth_authorization_server_metadata_discovery_urls(auth_server, c.url):
            r = await http.get(url)
            if r.is_success:
                return OAuthMetadata.model_validate_json(r.content)
    return None


async def _oauth_client(c: Connector) -> dict:
    """Our app's OAuth client at this provider, registered on first use."""
    if saved := db.get_oauth_client(c.id):
        return json.loads(decrypt(saved))

    meta = await discover(c)
    if meta is None:
        raise NoOAuth(f"{c.name} doesn't offer OAuth")
    if meta.registration_endpoint is None:
        raise ConnectorError(f"{c.name} needs a pre-registered OAuth client")

    async with httpx.AsyncClient(timeout=TIMEOUT) as http:
        r = await http.post(
            str(meta.registration_endpoint),
            json={
                "client_name": settings.app_name,
                "redirect_uris": [redirect_uri(c)],
                "grant_types": ["authorization_code", "refresh_token"],
                "response_types": ["code"],
                "token_endpoint_auth_method": "client_secret_post",
                "scope": c.scopes or None,
            },
        )
    if r.is_error:
        raise ConnectorError(f"{c.name} rejected app registration ({r.status_code})")
    reg = r.json()

    client = {
        "client_id": reg["client_id"],
        "client_secret": reg.get("client_secret"),  # absent for public clients
        "authorize_url": str(meta.authorization_endpoint),
        "token_url": str(meta.token_endpoint),
    }
    db.save_oauth_client(c.id, encrypt(json.dumps(client)))
    return client


# ---- authorization code flow ----


async def authorization_url(c: Connector, user_id: str) -> str:
    """Where to send the user's browser to approve access."""
    client = await _oauth_client(c)
    pkce = PKCEParameters.generate()
    state = secrets.token_urlsafe(32)  # ties the callback back to this user
    db.save_oauth_state(state, user_id, c.id, pkce.code_verifier)

    params = {
        "response_type": "code",
        "client_id": client["client_id"],
        "redirect_uri": redirect_uri(c),
        "state": state,
        "code_challenge": pkce.code_challenge,
        "code_challenge_method": "S256",
        "resource": c.url,  # RFC 8707: the token is for this MCP server only
    }
    if c.scopes:
        params["scope"] = c.scopes
    return f"{client['authorize_url']}?{urlencode(params)}"


async def complete(c: Connector, code: str, state: str) -> None:
    """Callback step: swap the code for tokens and store them for the user."""
    pending = db.pop_oauth_state(state, c.id)  # single use, expires after 10 minutes
    if pending is None:
        raise ConnectorError("The login link expired. Please connect again.")
    token = await _token_request(
        c,
        grant_type="authorization_code",
        code=code,
        code_verifier=pending["code_verifier"],
        redirect_uri=redirect_uri(c),
    )
    _save_token(pending["user_id"], c, token)


async def _token_request(c: Connector, **data) -> OAuthToken:
    client = await _oauth_client(c)
    data |= {"client_id": client["client_id"], "resource": c.url}
    if client["client_secret"]:
        data["client_secret"] = client["client_secret"]
    async with httpx.AsyncClient(timeout=TIMEOUT) as http:
        r = await http.post(client["token_url"], data=data)
    if r.is_error:
        raise ConnectorError(f"{c.name} token request failed ({r.status_code})")
    return OAuthToken.model_validate_json(r.content)


# ---- stored credentials ----


def _save_credentials(user_id: str, c: Connector, creds: dict) -> dict:
    db.save_credentials(user_id, c.id, encrypt(json.dumps(creds)))
    return creds


def _save_token(user_id: str, c: Connector, token: OAuthToken, old_refresh: str | None = None) -> dict:
    return _save_credentials(user_id, c, {
        "access_token": token.access_token,
        # Providers may not send a new refresh token on refresh; keep the old one.
        "refresh_token": token.refresh_token or old_refresh,
        "expires_at": time.time() + token.expires_in if token.expires_in else None,
    })


def save_api_key(user_id: str, c: Connector, api_key: str) -> None:
    _save_credentials(user_id, c, {"access_token": api_key, "refresh_token": None, "expires_at": None})


async def access_token(user_id: str, c: Connector) -> str | None:
    """A usable bearer token for this user, refreshed if near expiry. None = not connected."""
    saved = db.get_credentials(user_id, c.id)
    if saved is None:
        return None
    creds = json.loads(decrypt(saved))

    expires_at = creds["expires_at"]
    if expires_at and expires_at - time.time() < REFRESH_MARGIN:
        if not creds["refresh_token"]:
            return None  # expired for good; the user has to reconnect
        token = await _token_request(c, grant_type="refresh_token", refresh_token=creds["refresh_token"])
        creds = _save_token(user_id, c, token, creds["refresh_token"])
    return creds["access_token"]
