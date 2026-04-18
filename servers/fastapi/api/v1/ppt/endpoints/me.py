from fastapi import APIRouter, Depends
from pydantic import BaseModel

from api.auth_context import AuthContext
from api.deps import get_current_user_strict


ME_ROUTER = APIRouter(prefix="/me", tags=["Me"])


class MeResponse(BaseModel):
    email: str | None
    name: str | None
    avatar_url: str | None
    organisation_id: str | None


@ME_ROUTER.get("", response_model=MeResponse)
async def get_me(ctx: AuthContext = Depends(get_current_user_strict)) -> MeResponse:
    return MeResponse(
        email=ctx.email,
        name=ctx.name,
        avatar_url=ctx.avatar_url,
        organisation_id=str(ctx.organisation_id) if ctx.organisation_id else None,
    )
