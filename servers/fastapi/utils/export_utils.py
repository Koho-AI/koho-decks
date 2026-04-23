import os
import uuid
from typing import Literal

import aiohttp
from fastapi import HTTPException
from pathvalidate import sanitize_filename

from models.pptx_models import PptxPresentationModel
from models.presentation_and_path import PresentationAndPath
from services.pptx_presentation_creator import PptxPresentationCreator
from services.temp_file_service import TEMP_FILE_SERVICE
from utils.asset_directory_utils import get_exports_directory
from utils.internal_render import internal_render_headers


def _download_url_for(filename: str) -> str | None:
    # nginx serves /app_data/exports/ directly (see nginx.conf). We
    # only publish an absolute URL when APP_BASE_URL is set, so local
    # dev without that env var still returns a usable response.
    base = os.getenv("APP_BASE_URL", "").rstrip("/")
    if not base:
        return None
    return f"{base}/app_data/exports/{filename}"


async def export_presentation(
    presentation_id: uuid.UUID, title: str, export_as: Literal["pptx", "pdf"]
) -> PresentationAndPath:
    if export_as == "pptx":
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"http://localhost/api/presentation_to_pptx_model?id={presentation_id}",
                headers=internal_render_headers(),
                # See get_layout_by_name.py for the rationale — the
                # Next.js 307 to /signin would otherwise silently land
                # on a 200 HTML page and fail at JSON parse time.
                allow_redirects=False,
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise HTTPException(
                        status_code=502,
                        detail=(
                            f"Upstream renderer returned {response.status} "
                            f"while building the PPTX model: {error_text[:500]}"
                        ),
                    )
                pptx_model_data = await response.json()

        # Surface the real failure class if pydantic rejects the
        # upstream payload or PptxPresentationCreator chokes on an
        # element — bare Exceptions here bubble to FastAPI as a flat
        # 500 with no detail, making remote debugging impossible.
        try:
            pptx_model = PptxPresentationModel(**pptx_model_data)
        except Exception as e:
            # Bump the truncation budget so ValidationError details
            # aren't cut off mid-field. Pydantic v2's message includes
            # input values for each failure, so a handful of shape
            # errors can easily exceed 400 chars. 2000 is still safe
            # to put in a FastAPI response body.
            raise HTTPException(
                status_code=502,
                detail=(
                    f"Upstream pptx model failed validation: "
                    f"{type(e).__name__}: {str(e)[:2000]}"
                ),
            )

        temp_dir = TEMP_FILE_SERVICE.create_temp_dir()
        pptx_creator = PptxPresentationCreator(pptx_model, temp_dir)
        try:
            await pptx_creator.create_ppt()
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=(
                    f"PPTX creation failed: "
                    f"{type(e).__name__}: {str(e)[:400]}"
                ),
            )

        export_directory = get_exports_directory()
        filename = f"{sanitize_filename(title or str(uuid.uuid4()))}.pptx"
        pptx_path = os.path.join(export_directory, filename)
        try:
            pptx_creator.save(pptx_path)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=(
                    f"PPTX save failed: "
                    f"{type(e).__name__}: {str(e)[:400]}"
                ),
            )

        return PresentationAndPath(
            presentation_id=presentation_id,
            path=pptx_path,
            download_url=_download_url_for(filename),
        )

    async with aiohttp.ClientSession() as session:
        async with session.post(
            "http://localhost/api/export-as-pdf",
            json={
                "id": str(presentation_id),
                "title": sanitize_filename(title or str(uuid.uuid4())),
            },
            headers=internal_render_headers(),
            allow_redirects=False,
        ) as response:
            if response.status != 200:
                error_text = await response.text()
                raise HTTPException(
                    status_code=502,
                    detail=(
                        f"Upstream renderer returned {response.status} "
                        f"while generating the PDF: {error_text[:500]}"
                    ),
                )
            response_json = await response.json()

    pdf_path = response_json["path"]
    return PresentationAndPath(
        presentation_id=presentation_id,
        path=pdf_path,
        download_url=_download_url_for(os.path.basename(pdf_path)),
    )
