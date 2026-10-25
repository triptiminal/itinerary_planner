import httpx
from fastapi import Header, HTTPException

from .config import settings


async def current_user(authorization: str | None = Header(default=None)) -> dict:
    """Validate the Supabase access token sent by the React app."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Sign in to continue.")
    token = authorization.split(" ", 1)[1]
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": settings.supabase_anon_key},
        )
    if res.status_code != 200:
        raise HTTPException(401, "Your session has expired. Sign in again.")
    return res.json()
