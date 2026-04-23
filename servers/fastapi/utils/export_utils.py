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


# The Next.js export routes call back into FastAPI's auth-gated
# presentation router via Puppeteer; they identify themselves with this
# shared secret (see nextjs/app/api/export-as-pdf/route.ts and
# FastAPI's AuthMiddleware._is_internal_render_request). We forward the
# same token on our aiohttp call so the inner fetch chain doesn't
# collapse when the outer request lacks a NextAuth cookie — as is the
# case for MCP callers.
_INTERNAL_RENDER_HEADER = "X-Koho-Internal-Token"


def _internal_render_headers() -> dict[str, str]:
    token = os.getenv("INTERNAL_RENDER_TOKEN", "").strip()
    return {_INTERNAL_RENDER_HEADER: token} if token else {}


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
                headers=_internal_render_headers(),
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

        pptx_model = PptxPresentationModel(**pptx_model_data)
        temp_dir = TEMP_FILE_SERVICE.create_temp_dir()
        pptx_creator = PptxPresentationCreator(pptx_model, temp_dir)
        await pptx_creator.create_ppt()

        export_directory = get_exports_directory()
        filename = f"{sanitize_filename(title or str(uuid.uuid4()))}.pptx"
        pptx_path = os.path.join(export_directory, filename)
        pptx_creator.save(pptx_path)

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
            headers=_internal_render_headers(),
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
