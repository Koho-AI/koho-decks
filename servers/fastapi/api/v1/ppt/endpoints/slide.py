from typing import Annotated, Optional
from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from api.access import check_deck_access
from api.auth_context import AuthContext
from api.deps import get_current_user_strict
from models.sql.presentation import PresentationModel
from models.sql.slide import SlideModel
from services.database import get_async_session
from services.image_generation_service import ImageGenerationService
from utils.asset_directory_utils import get_images_directory
from utils.llm_calls.edit_slide import get_edited_slide_content
from utils.llm_calls.edit_slide_html import get_edited_slide_html
from utils.llm_calls.select_slide_type_on_edit import get_slide_layout_from_prompt
from utils.process_slides import process_old_and_new_slides_and_fetch_assets


SLIDE_ROUTER = APIRouter(
    prefix="/slide",
    tags=["Slide"],
    # Every slide endpoint mutates a specific deck's content. AuthMiddleware
    # populates request.state.auth from cookie or bearer; this dependency
    # raises 401 when absent. Per-endpoint check_deck_access() below then
    # enforces that the caller owns (or is an editor on) the parent deck.
    dependencies=[Depends(get_current_user_strict)],
)


@SLIDE_ROUTER.post("/edit")
async def edit_slide(
    id: Annotated[uuid.UUID, Body()],
    prompt: Annotated[str, Body()],
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
):
    slide = await sql_session.get(SlideModel, id)
    if not slide:
        raise HTTPException(status_code=404, detail="Slide not found")
    await check_deck_access(slide.presentation, sql_session, ctx, write=True)

    presentation = await sql_session.get(PresentationModel, slide.presentation)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")

    presentation_layout = presentation.get_layout()
    slide_layout = await get_slide_layout_from_prompt(
        prompt, presentation_layout, slide
    )

    edited_slide_content = await get_edited_slide_content(
        prompt, slide, presentation.language, slide_layout
    )

    image_generation_service = ImageGenerationService(get_images_directory())

    # This will mutate edited_slide_content
    new_assets = await process_old_and_new_slides_and_fetch_assets(
        image_generation_service,
        slide.content,
        edited_slide_content,
    )

    sql_session.add(slide)
    slide.content = edited_slide_content
    slide.layout = slide_layout.id
    slide.speaker_note = edited_slide_content.get("__speaker_note__", "")
    sql_session.add_all(new_assets)
    await sql_session.commit()

    return slide


@SLIDE_ROUTER.post("/edit-html", response_model=SlideModel)
async def edit_slide_html(
    id: Annotated[uuid.UUID, Body()],
    prompt: Annotated[str, Body()],
    html: Annotated[Optional[str], Body()] = None,
    sql_session: AsyncSession = Depends(get_async_session),
    ctx: AuthContext = Depends(get_current_user_strict),
):
    slide = await sql_session.get(SlideModel, id)
    if not slide:
        raise HTTPException(status_code=404, detail="Slide not found")
    await check_deck_access(slide.presentation, sql_session, ctx, write=True)

    html_to_edit = html or slide.html_content
    if not html_to_edit:
        raise HTTPException(status_code=400, detail="No HTML to edit")

    edited_slide_html = await get_edited_slide_html(prompt, html_to_edit)

    sql_session.add(slide)
    slide.html_content = edited_slide_html
    await sql_session.commit()

    return slide
