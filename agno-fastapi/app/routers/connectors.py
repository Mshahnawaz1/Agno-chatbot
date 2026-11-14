import logging

import httpx
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import RedirectResponse

from app import db
from app.connectors import auth, tools
from app.connectors.registry import CONNECTORS, Connector
from app.deps import CurrentUser
from app.schemas import ApiKeyIn, AuthorizeOut, ConnectorOut, ConnectorUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/connectors", tags=["connectors"])


def get_connector(connector_id: str) -> Connector:
    c = CONNECTORS.get(connector_id)
    if c is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Connector not found")
    return c


@router.get("", response_model=list[ConnectorOut])
def list_connectors(user: CurrentUser):
    connected = db.list_connected(user["id"])
    return [
        ConnectorOut(
            id=c.id,
            name=c.name,
            notes=c.notes,
            url=c.url,
            scopes=c.scopes.split(),
            tools=c.include_tools,
            connected=c.id in connected,
            enabled=connected.get(c.id, False),
        )
        for c in CONNECTORS.values()
    ]


@router.patch("/{connector_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_connector(connector_id: str, body: ConnectorUpdate, user: CurrentUser):
    """Switch a connected connector on or off. Off keeps the login but drops its tools."""
    c = get_connector(connector_id)
    if not db.set_connector_enabled(user["id"], c.id, body.enabled):
        raise HTTPException(status.HTTP_409_CONFLICT, f"Connect {c.name} first")
    if not body.enabled:
        await tools.disconnect(user["id"], c.id)  # close its open MCP session


@router.post("/{connector_id}/authorize", response_model=AuthorizeOut)
async def authorize(connector_id: str, user: CurrentUser):
    """Returns the provider's login URL. JSON, not a redirect: a browser
    navigation wouldn't carry our Authorization header."""
    c = get_connector(connector_id)
    try:
        return AuthorizeOut(url=await auth.authorization_url(c, user["id"]))
    except auth.NoOAuth:
        raise HTTPException(status.HTTP_409_CONFLICT, "api_key")  # frontend asks for a key
    except (auth.ConnectorError, httpx.HTTPError) as e:
        logger.warning("authorize %s failed: %s", c.id, e)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Could not reach {c.name}")


@router.get("/{connector_id}/callback", include_in_schema=False)
async def callback(connector_id: str, state: str, code: str | None = None):
    """The provider redirects the browser here. No JWT: the user comes from `state`."""
    c = get_connector(connector_id)
    if code is None:  # user denied access, or the provider returned ?error=...
        return RedirectResponse(f"/?connector_error={c.id}#connectors", status.HTTP_303_SEE_OTHER)
    try:
        await auth.complete(c, code, state)
    except (auth.ConnectorError, httpx.HTTPError) as e:
        logger.warning("callback %s failed: %s", c.id, e)
        return RedirectResponse(f"/?connector_error={c.id}#connectors", status.HTTP_303_SEE_OTHER)
    return RedirectResponse(f"/?connected={c.id}#connectors", status.HTTP_303_SEE_OTHER)


@router.put("/{connector_id}/api-key", status_code=status.HTTP_204_NO_CONTENT)
async def set_api_key(connector_id: str, body: ApiKeyIn, user: CurrentUser):
    c = get_connector(connector_id)
    if await auth.discover(c):  # OAuth wins whenever the server offers it
        raise HTTPException(status.HTTP_409_CONFLICT, f"{c.name} uses OAuth; connect with /authorize")
    auth.save_api_key(user["id"], c, body.api_key)


@router.delete("/{connector_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect(connector_id: str, user: CurrentUser):
    c = get_connector(connector_id)
    db.delete_credentials(user["id"], c.id)
    await tools.disconnect(user["id"], c.id)
