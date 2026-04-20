"""
Health endpoint for uptime monitoring + container healthchecks (Phase 6).

GET /api/v1/health
- Returns 200 + {status: "ok", db: "ok"} when the app process is up
  and Postgres is reachable.
- Returns 503 if the DB ping fails. Cloudflare Access / UptimeRobot
  treat that as a probe failure.

Public (no auth) — health probes shouldn't need a session.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from services.database import get_async_session


HEALTH_ROUTER = APIRouter(prefix="/health", tags=["Health"])


@HEALTH_ROUTER.get("")
async def health(
    sql_session: AsyncSession = Depends(get_async_session),
):
    try:
        await sql_session.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"db unreachable: {exc.__class__.__name__}",
        )
    return {"status": "ok", "db": "ok"}
