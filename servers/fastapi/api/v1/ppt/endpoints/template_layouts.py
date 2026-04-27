"""
list_template_layouts — agent-facing introspection of a template's layout
palette.

This endpoint exists so MCP/agent callers can discover which slide layouts
a given template offers BEFORE generating a deck, so they can request a
specific layout per slide via the structured `slides` field on
`generate_presentation*`.

Returning the full Zod-derived JSON schema would be overwhelming for an
agent — it includes UI affordances, character limits, defaults, etc. We
flatten it into a `content_shape` dict that captures the field name +
type + description only. That's the minimum surface an agent needs to
understand what each layout expects.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from api.deps import get_current_user_strict
from constants.presentation import DEFAULT_TEMPLATES
from models.sql.template import TemplateModel
from services.database import get_async_session
from utils.get_layout_by_name import get_layout_by_name
import uuid


TEMPLATE_LAYOUTS_ROUTER = APIRouter(
    prefix="/template-layouts",
    tags=["template-layouts"],
    # Auth-gated like the rest of /api/v1/ppt — surface name only, no
    # secrets, but consistent gating means the same NextAuth/Bearer rules
    # apply for both UI and MCP callers.
    dependencies=[Depends(get_current_user_strict)],
)


class TemplateLayoutSummary(BaseModel):
    id: str = Field(
        ...,
        description=(
            "Fully-qualified layout id of the form `{template}:{layout_id}` "
            "(e.g. `koho-pitch:koho-statement`). Pass this string back as "
            "`slides[i].layout` on `generate_presentation*` to force this "
            "layout for that slide."
        ),
    )
    layout_id: str = Field(
        ...,
        description=(
            "The bare layout id within the template (e.g. `koho-statement`). "
            "Either form is accepted by `slides[i].layout`."
        ),
    )
    name: Optional[str] = Field(
        default=None, description="Human-readable name shown in the template preview UI."
    )
    description: Optional[str] = Field(
        default=None,
        description=(
            "One-liner about when to use this layout. Mirrors the description "
            "rendered in the template preview at "
            "`/template-preview/{template}`."
        ),
    )
    content_shape: Dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Map of field name → {type, description, required}. The set of "
            "content fields the layout expects (title, subtitle, items, "
            "metrics, …). Use this to shape the `markdown` you pass for the "
            "slide so the LLM can extract values that fit the layout."
        ),
    )


class ListTemplateLayoutsResponse(BaseModel):
    template: str
    layouts: List[TemplateLayoutSummary]


def _summarise_content_shape(json_schema: Optional[dict]) -> Dict[str, Any]:
    """Turn a Zod-derived JSON schema into a flat field-summary dict.

    The schemas emitted by the Next.js `/schema` puppeteer route are full
    JSON Schema objects with `properties`, `required`, default values, min/
    max constraints, nested arrays, etc. Agents don't need that detail —
    they need to know "what fields does this layout accept and what type
    is each". Anything beyond that pollutes the tool surface and pushes
    the agent toward over-specifying. So we keep:
      - field name
      - top-level type (string / array / object / etc)
      - description (if present)
      - required flag
      - for arrays, the items' type

    Internal asset-injection fields like `__image_url__`/`__icon_url__`
    are dropped; they're populated by the asset pipeline, not the agent.
    """
    if not isinstance(json_schema, dict):
        return {}
    properties = json_schema.get("properties")
    if not isinstance(properties, dict):
        return {}
    required_fields = set(json_schema.get("required") or [])
    shape: Dict[str, Any] = {}
    for field_name, field_schema in properties.items():
        # Skip private/internal fields populated by the asset pipeline.
        if field_name.startswith("__") and field_name.endswith("__"):
            continue
        if not isinstance(field_schema, dict):
            shape[field_name] = {"type": "unknown"}
            continue
        field_type = field_schema.get("type") or "unknown"
        entry: Dict[str, Any] = {"type": field_type}
        if field_schema.get("description"):
            entry["description"] = field_schema["description"]
        if field_name in required_fields:
            entry["required"] = True
        # Surface array item type so the agent knows whether items are
        # strings, objects, etc — without dumping the whole nested schema.
        if field_type == "array":
            items = field_schema.get("items")
            if isinstance(items, dict):
                items_type = items.get("type") or "object"
                entry["items"] = {"type": items_type}
                if items_type == "object" and isinstance(items.get("properties"), dict):
                    entry["items"]["fields"] = sorted(
                        k for k in items["properties"].keys()
                        if not (k.startswith("__") and k.endswith("__"))
                    )
        shape[field_name] = entry
    return shape


async def _resolve_template_name(
    template: str, session: AsyncSession
) -> str:
    """Return the canonical template name to pass to `get_layout_by_name`.

    Built-in templates pass through unchanged. Custom-template ids of the
    form `custom-<uuid>` are validated against TemplateModel rows so we
    don't hand a bogus id to puppeteer (which would burn a 5-minute
    timeout before failing). Anything else is a 400.
    """
    if template in DEFAULT_TEMPLATES:
        return template
    if template.startswith("custom-"):
        template_id = template[len("custom-"):]
        try:
            template_uuid = uuid.UUID(template_id)
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Template not found. Please use a valid template."
            )
        existing = await session.get(TemplateModel, template_uuid)
        if not existing:
            raise HTTPException(
                status_code=400, detail="Template not found. Please use a valid template."
            )
        return template
    raise HTTPException(
        status_code=400, detail="Template not found. Please use a valid template."
    )


@TEMPLATE_LAYOUTS_ROUTER.get(
    "/{template}",
    response_model=ListTemplateLayoutsResponse,
    summary="List the layouts available in a template.",
    description=(
        "Returns the layout palette for a template (built-in like "
        "`koho-pitch` or custom like `custom-<uuid>`). Each entry includes "
        "the layout id, a one-line description, and the content shape the "
        "layout expects. Agents should call this BEFORE "
        "`generate_presentation*` to pick a varied set of layouts and "
        "specify them per-slide via the structured `slides` field, instead "
        "of leaving every slide to the auto-picker (which biases toward "
        "safest-fit and produces monotonous decks)."
    ),
)
async def list_template_layouts(
    template: str,
    session: AsyncSession = Depends(get_async_session),
) -> ListTemplateLayoutsResponse:
    canonical = await _resolve_template_name(template, session)
    layout_model = await get_layout_by_name(canonical)

    layouts: List[TemplateLayoutSummary] = []
    for slide in layout_model.slides:
        bare_id = slide.id or ""
        # Fully-qualified id makes it unambiguous which template a layout
        # belongs to when the agent stores or echoes it back. Both
        # forms — the bare id and the qualified one — are accepted by
        # `slides[i].layout` on generate_presentation*.
        qualified_id = bare_id if ":" in bare_id else f"{canonical}:{bare_id}"
        layouts.append(
            TemplateLayoutSummary(
                id=qualified_id,
                layout_id=bare_id,
                name=slide.name,
                description=slide.description,
                content_shape=_summarise_content_shape(slide.json_schema),
            )
        )
    return ListTemplateLayoutsResponse(template=canonical, layouts=layouts)
