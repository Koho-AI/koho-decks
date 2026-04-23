import aiohttp
from fastapi import HTTPException

from models.presentation_layout import PresentationLayoutModel
from utils.internal_render import internal_render_headers


async def get_layout_by_name(layout_name: str) -> PresentationLayoutModel:
    url = f"http://localhost/api/template?group={layout_name}"
    async with aiohttp.ClientSession() as session:
        # allow_redirects=False is load-bearing. Next.js middleware
        # returns a 307 to /signin when the internal-render token is
        # missing or wrong; aiohttp's default is to follow redirects,
        # which would silently land on /signin's 200 HTML body and
        # then raise ContentTypeError on the JSON parse — hiding the
        # actual auth failure. Keeping redirects off surfaces the 3xx
        # into the status check below with a clear 502.
        async with session.get(
            url,
            headers=internal_render_headers(),
            allow_redirects=False,
        ) as response:
            if response.status != 200:
                error_text = await response.text()
                is_redirect = 300 <= response.status < 400
                raise HTTPException(
                    status_code=502 if is_redirect else 404,
                    detail=(
                        f"Template '{layout_name}' fetch failed "
                        f"({response.status}): {error_text[:300]}"
                    ),
                )
            layout_json = await response.json()
    return PresentationLayoutModel(**layout_json)
