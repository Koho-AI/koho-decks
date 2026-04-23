from fastapi import APIRouter, HTTPException
import aiohttp
from typing import List, Any
from utils.get_layout_by_name import get_layout_by_name
from models.presentation_layout import PresentationLayoutModel

LAYOUTS_ROUTER = APIRouter(prefix="/layouts", tags=["Layouts"])

@LAYOUTS_ROUTER.get("/", summary="Get available layouts")
async def get_layouts():
    # TODO(follow-up): this fetch currently has no auth header and
    # will 3xx to /signin once NextAuth middleware runs — same class of
    # bug fixed for /api/template in get_layout_by_name.py. Apply
    # `utils.internal_render.internal_render_headers()` and
    # `allow_redirects=False` here too. Not on the MCP critical path,
    # so deferred; this endpoint isn't exposed to the MCP surface.
    url = "http://localhost:3000/api/layouts"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status != 200:
                error_text = await response.text()
                raise HTTPException(
                    status_code=response.status,
                    detail=f"Failed to fetch layouts: {error_text}"
                )
            layouts_json = await response.json()
    return layouts_json


@LAYOUTS_ROUTER.get("/{layout_name}", summary="Get layout details by ID")
async def get_layout_detail(layout_name: str) -> PresentationLayoutModel:
    return await get_layout_by_name(layout_name)
