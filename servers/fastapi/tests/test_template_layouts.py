"""
Tests for the layout-variety + agent-introspection feature set:

  - `list_template_layouts(template)` — agent-facing introspection.
  - Structured `slides` field with per-slide `layout` overrides on
    `generate_presentation*`.
  - Variety bias on the auto-picker so identical content over many
    slides doesn't collapse to one layout.

These tests are self-contained: they don't rely on the broken
`test_presentation_generation_api.py` fixtures (which patch attributes
that no longer exist on `presentation.py`). They mock at the seam
between FastAPI and the puppeteer layout scraper, so the LLM + the
Next.js render pipeline never run.
"""

from typing import Any, Dict, List, Optional
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.auth_context import AuthContext
from api.deps import get_current_user_strict
from api.v1.ppt.endpoints.template_layouts import (
    TEMPLATE_LAYOUTS_ROUTER,
    _summarise_content_shape,
)
from models.presentation_layout import PresentationLayoutModel, SlideLayoutModel
from utils.ppt_utils import apply_variety_bias, resolve_layout_id_to_index


# Realistic koho-pitch layout palette shape — matches the real ids,
# names, and descriptions from
# servers/nextjs/app/presentation-templates/koho-pitch/*.tsx so the
# AC-1 test exercises the same surface the agent will see in
# production.
KOHO_PITCH_LAYOUT_FIXTURE: List[Dict[str, Any]] = [
    {
        "id": "koho-intro-slide",
        "name": "Koho Cover Slide",
        "description": "A branded cover slide with large Signal Green statement title, subtitle, and presenter metadata.",
        "json_schema": {
            "type": "object",
            "title": "Koho Cover Slide",
            "properties": {
                "title": {"type": "string", "description": "Main presentation title"},
                "subtitle": {"type": "string", "description": "Supporting subtitle"},
                "presenterName": {"type": "string", "description": "Name of the presenter"},
                "presenterRole": {"type": "string", "description": "Role or tagline"},
                "presentationDate": {"type": "string", "description": "Date or version"},
                "metaLabel": {"type": "string", "description": "Optional metadata label"},
            },
            "required": ["title", "subtitle"],
        },
    },
    {
        "id": "koho-bullet-points",
        "name": "Koho Bullet Points",
        "description": "A 3-column grid of bullet points with icons. Use when items have parallel structure.",
        "json_schema": {
            "type": "object",
            "title": "Koho Bullet Points",
            "properties": {
                "title": {"type": "string", "description": "Slide title"},
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "heading": {"type": "string"},
                            "description": {"type": "string"},
                        },
                    },
                    "description": "Grid of bullet items",
                },
            },
            "required": ["title", "items"],
        },
    },
    {
        "id": "koho-bullet-list",
        "name": "Koho Bullet List",
        "description": "A traditional vertical bullet-point list. Use for feature lists, benefits, takeaways.",
        "json_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "subtitle": {"type": "string"},
                "items": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["title", "items"],
        },
    },
    {
        "id": "koho-bullet-list-split",
        "name": "Koho Bullet List (Split)",
        "description": "A split layout with kicker, title, and subtitle on the left and a bullet list on the right.",
        "json_schema": {
            "type": "object",
            "properties": {
                "kicker": {"type": "string"},
                "title": {"type": "string"},
                "subtitle": {"type": "string"},
                "items": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["title", "items"],
        },
    },
    {
        "id": "koho-metrics",
        "name": "Koho Metrics",
        "description": "A grid of headline metrics with values, labels, and supporting captions.",
        "json_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "metrics": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "value": {"type": "string"},
                            "label": {"type": "string"},
                            "caption": {"type": "string"},
                        },
                    },
                },
            },
            "required": ["title", "metrics"],
        },
    },
    {
        "id": "koho-pricing",
        "name": "Koho Pricing",
        "description": "A pricing tier grid with feature lists and a recommended-plan highlight.",
        "json_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "tiers": {"type": "array", "items": {"type": "object"}},
            },
            "required": ["title"],
        },
    },
    {
        "id": "koho-dashboard-showcase",
        "name": "Koho Dashboard Showcase",
        "description": "A browser-chrome mockup wrapping a generic dashboard component.",
        "json_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "description": {"type": "string"},
            },
        },
    },
    {
        "id": "koho-home-dashboard",
        "name": "Koho Home Dashboard",
        "description": "Home dashboard mockup — operator-facing summary view.",
        "json_schema": {
            "type": "object",
            "properties": {"title": {"type": "string"}, "description": {"type": "string"}},
        },
    },
    {
        "id": "koho-finance-dashboard",
        "name": "Koho Finance Dashboard",
        "description": "Finance dashboard mockup — revenue, MRR, ARPU.",
        "json_schema": {
            "type": "object",
            "properties": {"title": {"type": "string"}, "description": {"type": "string"}},
        },
    },
    {
        "id": "koho-pipeline-dashboard",
        "name": "Koho Pipeline Dashboard",
        "description": "Pipeline dashboard mockup — opportunity stages.",
        "json_schema": {
            "type": "object",
            "properties": {"title": {"type": "string"}, "description": {"type": "string"}},
        },
    },
    {
        "id": "koho-forecast-dashboard",
        "name": "Koho Forecast Dashboard",
        "description": "Forecast dashboard mockup — projections and scenarios.",
        "json_schema": {
            "type": "object",
            "properties": {"title": {"type": "string"}, "description": {"type": "string"}},
        },
    },
    {
        "id": "koho-risk-dashboard",
        "name": "Koho Risk Dashboard",
        "description": "Risk dashboard mockup — flagged accounts, churn signals.",
        "json_schema": {
            "type": "object",
            "properties": {"title": {"type": "string"}, "description": {"type": "string"}},
        },
    },
    {
        "id": "koho-operations-dashboard",
        "name": "Koho Operations Dashboard",
        "description": "Operations dashboard mockup — occupancy, utilisation.",
        "json_schema": {
            "type": "object",
            "properties": {"title": {"type": "string"}, "description": {"type": "string"}},
        },
    },
    {
        "id": "koho-efficiency-dashboard",
        "name": "Koho Efficiency Dashboard",
        "description": "Efficiency dashboard mockup — cycle time, throughput.",
        "json_schema": {
            "type": "object",
            "properties": {"title": {"type": "string"}, "description": {"type": "string"}},
        },
    },
    {
        "id": "koho-leadership-dashboard",
        "name": "Koho Leadership Dashboard",
        "description": "Leadership dashboard mockup — exec-level KPIs.",
        "json_schema": {
            "type": "object",
            "properties": {"title": {"type": "string"}, "description": {"type": "string"}},
        },
    },
    {
        "id": "koho-community-dashboard",
        "name": "Koho Community Dashboard",
        "description": "Community dashboard mockup — engagement, members.",
        "json_schema": {
            "type": "object",
            "properties": {"title": {"type": "string"}, "description": {"type": "string"}},
        },
    },
    {
        "id": "koho-integrations-dashboard",
        "name": "Koho Integrations Dashboard",
        "description": "Integrations dashboard — connected systems and sync state.",
        "json_schema": {
            "type": "object",
            "properties": {"title": {"type": "string"}, "description": {"type": "string"}},
        },
    },
    {
        "id": "koho-single-source-dashboard",
        "name": "Koho Single Source Dashboard",
        "description": "Single-source-of-truth dashboard mockup.",
        "json_schema": {
            "type": "object",
            "properties": {"title": {"type": "string"}, "description": {"type": "string"}},
        },
    },
    {
        "id": "koho-solutions-dashboard",
        "name": "Koho Solutions Dashboard",
        "description": "Solutions dashboard mockup.",
        "json_schema": {
            "type": "object",
            "properties": {"title": {"type": "string"}, "description": {"type": "string"}},
        },
    },
    {
        "id": "koho-statement",
        "name": "Koho Statement",
        "description": "A bold statement slide with one or two lines of massive centred text.",
        "json_schema": {
            "type": "object",
            "properties": {
                "subtitle": {"type": "string"},
                "statement": {"type": "string"},
                "footnote": {"type": "string"},
            },
            "required": ["statement"],
        },
    },
    {
        "id": "koho-two-column",
        "name": "Koho Two Column",
        "description": "Side-by-side text columns. Use for compare/contrast.",
        "json_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "leftHeading": {"type": "string"},
                "leftBody": {"type": "string"},
                "rightHeading": {"type": "string"},
                "rightBody": {"type": "string"},
            },
            "required": ["title"],
        },
    },
    {
        "id": "koho-timeline",
        "name": "Koho Timeline",
        "description": "Horizontal timeline with phases. Use for roadmaps and process steps.",
        "json_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "phases": {"type": "array", "items": {"type": "object"}},
            },
            "required": ["title", "phases"],
        },
    },
    {
        "id": "koho-quote",
        "name": "Koho Quote",
        "description": "Pull-quote slide with attribution.",
        "json_schema": {
            "type": "object",
            "properties": {
                "quote": {"type": "string"},
                "attribution": {"type": "string"},
            },
            "required": ["quote"],
        },
    },
    {
        "id": "koho-table",
        "name": "Koho Table",
        "description": "Data table with title and column headers. Use for comparisons or matrices.",
        "json_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "headers": {"type": "array", "items": {"type": "string"}},
                "rows": {"type": "array", "items": {"type": "object"}},
            },
            "required": ["title", "headers", "rows"],
        },
    },
    {
        "id": "koho-cta",
        "name": "Koho CTA",
        "description": "Call-to-action closing slide. Use as the final slide of a deck.",
        "json_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "subtitle": {"type": "string"},
                "ctaText": {"type": "string"},
            },
            "required": ["title"],
        },
    },
    {
        "id": "koho-section-divider",
        "name": "Koho Section Divider",
        "description": "Section break with chapter number and label.",
        "json_schema": {
            "type": "object",
            "properties": {
                "chapter": {"type": "string"},
                "title": {"type": "string"},
            },
            "required": ["title"],
        },
    },
    {
        "id": "koho-agenda",
        "name": "Koho Agenda",
        "description": "A numbered agenda or table of contents slide listing deck sections.",
        "json_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "items": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["title", "items"],
        },
    },
    {
        "id": "koho-team",
        "name": "Koho Team",
        "description": "Team grid with photos, names, and roles.",
        "json_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "members": {"type": "array", "items": {"type": "object"}},
            },
            "required": ["title", "members"],
        },
    },
]


def _make_layout_model() -> PresentationLayoutModel:
    """Build a PresentationLayoutModel from the koho-pitch fixture."""
    return PresentationLayoutModel(
        name="koho-pitch",
        ordered=False,
        slides=[SlideLayoutModel(**entry) for entry in KOHO_PITCH_LAYOUT_FIXTURE],
    )


def _override_auth(app: FastAPI) -> None:
    """Bypass auth for the test client.

    Endpoints under PRESENTATION/TEMPLATE_LAYOUTS routers depend on
    `get_current_user_strict`, which expects a NextAuth session or
    Bearer token. We don't have one in tests, so we replace the
    dependency with a stub that returns a test AuthContext.
    """
    import uuid

    fake_ctx = AuthContext(
        user_id=uuid.uuid4(),
        organisation_id=uuid.uuid4(),
        email="test@koho.ai",
        name="Test",
        avatar_url=None,
    )

    def _stub() -> AuthContext:
        return fake_ctx

    app.dependency_overrides[get_current_user_strict] = _stub


# ─── AC #1: list_template_layouts returns ≥20 layouts with non-empty
#           description and content_shape fields ──────────────────────────


@pytest.fixture
def template_layouts_client():
    """Test client for the template_layouts router only."""
    app = FastAPI()
    app.include_router(TEMPLATE_LAYOUTS_ROUTER, prefix="/api/v1/ppt")
    _override_auth(app)
    return TestClient(app)


def test_list_template_layouts_returns_full_palette(template_layouts_client):
    """AC: list_template_layouts("koho-pitch") returns ≥20 layouts, each with
    non-empty description and content_shape fields."""
    layout_model = _make_layout_model()

    with patch(
        "api.v1.ppt.endpoints.template_layouts.get_layout_by_name",
        new=AsyncMock(return_value=layout_model),
    ):
        resp = template_layouts_client.get("/api/v1/ppt/template-layouts/koho-pitch")

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["template"] == "koho-pitch"
    layouts = body["layouts"]

    assert len(layouts) >= 20, f"expected >=20 layouts, got {len(layouts)}"

    seen_ids = set()
    for entry in layouts:
        # Fully-qualified id is what list_template_layouts is supposed
        # to return so the agent can paste it back into slides[i].layout.
        assert entry["id"].startswith("koho-pitch:"), entry["id"]
        assert entry["layout_id"] and entry["layout_id"] != ""
        assert entry["description"], (
            f"layout {entry['id']} has empty description — agent has no "
            "guidance on when to use it"
        )
        assert isinstance(entry["content_shape"], dict)
        assert len(entry["content_shape"]) > 0, (
            f"layout {entry['id']} has empty content_shape — agent has no "
            "guidance on what fields the layout expects"
        )
        seen_ids.add(entry["layout_id"])

    # Sanity: the canonical koho-pitch layouts the AC-2 test will
    # request must be discoverable here.
    expected_ids = {
        "koho-intro-slide",
        "koho-statement",
        "koho-two-column",
        "koho-bullet-list",
        "koho-bullet-list-split",
        "koho-bullet-points",
        "koho-table",
        "koho-timeline",
        "koho-cta",
    }
    assert expected_ids.issubset(seen_ids), expected_ids - seen_ids


def test_list_template_layouts_rejects_unknown_template(template_layouts_client):
    resp = template_layouts_client.get("/api/v1/ppt/template-layouts/totally-fake-template")
    assert resp.status_code == 400


def test_summarise_content_shape_drops_internal_fields():
    """Internal asset-injection fields shouldn't leak into the agent
    surface — they're populated by the asset pipeline, not the caller."""
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "Slide title"},
            "items": {"type": "array", "items": {"type": "string"}},
            "__image_url__": {"type": "string"},
            "__icon_url__": {"type": "string"},
        },
        "required": ["title"],
    }
    shape = _summarise_content_shape(schema)
    assert "title" in shape
    assert shape["title"]["required"] is True
    assert shape["title"]["description"] == "Slide title"
    assert "items" in shape
    assert shape["items"]["type"] == "array"
    assert shape["items"]["items"]["type"] == "string"
    assert "__image_url__" not in shape
    assert "__icon_url__" not in shape


# ─── resolve_layout_id_to_index helpers ───────────────────────────────────


def test_resolve_layout_id_accepts_bare_and_qualified_ids():
    layout = _make_layout_model()
    # Bare id (what the LLM picker uses internally)
    assert resolve_layout_id_to_index(layout, "koho-statement") is not None
    # Qualified id (what list_template_layouts returns)
    assert (
        resolve_layout_id_to_index(layout, "koho-statement")
        == resolve_layout_id_to_index(layout, "koho-pitch:koho-statement")
    )
    # Unknown id falls through to None — caller raises 400
    assert resolve_layout_id_to_index(layout, "made-up-layout") is None


# ─── AC #2: explicit per-slide layouts honoured exactly ───────────────────


def test_explicit_layouts_resolve_to_correct_indices_in_order():
    """AC: 9-slide deck with explicit per-slide layouts (intro-slide,
    statement, two-column, bullet-list, bullet-list-split, bullet-points,
    table, timeline, cta) — assert the generated structure points at
    those layouts in order.

    This validates the resolver + structure assembly without invoking
    the full LLM/asset pipeline. The handler skips the LLM picker
    entirely when every slide has an explicit layout, so the structure
    is fully deterministic from the resolver output."""
    layout = _make_layout_model()
    requested_ids = [
        "koho-intro-slide",
        "koho-statement",
        "koho-two-column",
        "koho-bullet-list",
        "koho-bullet-list-split",
        "koho-bullet-points",
        "koho-table",
        "koho-timeline",
        "koho-cta",
    ]
    indices: List[Optional[int]] = [
        resolve_layout_id_to_index(layout, lid) for lid in requested_ids
    ]
    # No id should fail to resolve — these are all in the koho-pitch palette.
    assert all(idx is not None for idx in indices), indices
    # Each index must point at the layout the agent asked for.
    resolved_ids = [layout.slides[idx].id for idx in indices]  # type: ignore[index]
    assert resolved_ids == requested_ids


def test_apply_variety_bias_preserves_explicit_overrides():
    """When the agent specifies a layout per slide, the variety bias
    MUST NOT override it — even if it produces immediate repeats."""
    layout = _make_layout_model()
    n = 9
    requested_ids = [
        "koho-intro-slide",
        "koho-statement",
        "koho-two-column",
        "koho-bullet-list",
        "koho-bullet-list-split",
        "koho-bullet-points",
        "koho-table",
        "koho-timeline",
        "koho-cta",
    ]
    explicit = [resolve_layout_id_to_index(layout, lid) for lid in requested_ids]
    # Feed the picker proposed indices that are intentionally wrong —
    # variety bias must still leave the explicit overrides untouched.
    proposed = [0] * n
    final = apply_variety_bias(proposed, explicit, len(layout.slides))
    assert final == explicit


def test_apply_variety_bias_honours_repeat_overrides_even_when_agent_chose_them():
    """If the agent deliberately requests the same layout twice in a row
    (rare, but valid — e.g. two consecutive statement slides), the
    variety bias must NOT silently rewrite that. Per-slide explicit
    layouts are sacred."""
    layout = _make_layout_model()
    stmt_idx = resolve_layout_id_to_index(layout, "koho-statement")
    assert stmt_idx is not None
    explicit = [stmt_idx, stmt_idx, stmt_idx]
    proposed = [0, 0, 0]
    final = apply_variety_bias(proposed, explicit, len(layout.slides))
    assert final == [stmt_idx, stmt_idx, stmt_idx]


# ─── AC #3: identical content + no layout → ≥4 distinct layouts ──────────


def test_variety_bias_yields_four_or_more_distinct_layouts_for_9_slide_deck():
    """AC: a 9-slide deck where every slide has identical generic content
    and no layout specified must use at least 4 distinct layouts.

    We simulate the picker's worst-case: the LLM proposes the same
    "safest-fit" layout for every slide because the content is
    indistinguishable. Variety bias must redistribute."""
    layout = _make_layout_model()
    n = 9
    # Worst-case: picker reaches for `koho-bullet-list` for every slide
    # (this is the exact failure mode called out in the task description).
    bullet_list_idx = resolve_layout_id_to_index(layout, "koho-bullet-list")
    assert bullet_list_idx is not None
    proposed = [bullet_list_idx] * n
    explicit = [None] * n
    final = apply_variety_bias(proposed, explicit, len(layout.slides))
    assert len(final) == n
    distinct = len(set(final))
    assert distinct >= 4, (
        f"variety bias produced only {distinct} distinct layouts for a "
        f"9-slide identical-content deck (need >=4): {final}"
    )


def test_variety_bias_breaks_immediate_repeats():
    """The strongest signal in the heuristic is "no two slides in a row
    use the same layout". Even with only 2 layouts available, the bias
    must alternate (when no explicit override forbids it)."""
    layout = _make_layout_model()
    n = 6
    # Worst-case: picker proposes 0, 0, 0, 0, 0, 0
    final = apply_variety_bias([0] * n, [None] * n, len(layout.slides))
    # No two consecutive slides should match.
    for i in range(1, n):
        assert final[i] != final[i - 1], f"slide {i} repeated layout {final[i]}"


def test_variety_bias_caps_repeats_in_short_decks():
    """In decks shorter than 12 slides, no layout should appear more
    than twice. (Above 12 slides repeats are unavoidable in templates
    with smaller palettes — the cap is intentionally narrow.)"""
    layout = _make_layout_model()
    n = 10
    # Picker keeps proposing index 5 over and over.
    final = apply_variety_bias([5] * n, [None] * n, len(layout.slides))
    # Count the most-used layout — it must be at most 2.
    counts: Dict[int, int] = {}
    for idx in final:
        counts[idx] = counts.get(idx, 0) + 1
    most_used = max(counts.values())
    assert most_used <= 2, f"layout reused {most_used}× in 10-slide deck: {counts}"


def test_variety_bias_respects_template_with_single_layout():
    """Sanity: when the template has only 1 layout, variety bias has
    nothing to vary. It must not crash and must return the proposed
    indices unchanged."""
    proposed = [0, 0, 0, 0, 0]
    final = apply_variety_bias(proposed, [None] * 5, 1)
    assert final == proposed


def test_variety_bias_respects_explicit_overrides_in_count():
    """When the agent pins (say) `bullet-list` on slides 0 and 1, the
    auto-picker's third use of `bullet-list` should be penalised — the
    pinned uses count toward the cap so the deck doesn't end up with
    bullet-list on 0, 1, AND a third auto-pick."""
    layout = _make_layout_model()
    n = 6
    bullet_list_idx = resolve_layout_id_to_index(layout, "koho-bullet-list")
    statement_idx = resolve_layout_id_to_index(layout, "koho-statement")
    assert bullet_list_idx is not None and statement_idx is not None

    explicit: List[Optional[int]] = [bullet_list_idx, bullet_list_idx, None, None, None, None]
    # Picker proposes bullet-list everywhere — variety bias must reject
    # it on slots 2..5 because the cap is already at 2.
    proposed = [statement_idx, statement_idx, bullet_list_idx, bullet_list_idx, bullet_list_idx, bullet_list_idx]
    final = apply_variety_bias(proposed, explicit, len(layout.slides))
    # Pinned slides untouched
    assert final[0] == bullet_list_idx
    assert final[1] == bullet_list_idx
    # Auto-pick slots avoid bullet-list (already at cap)
    assert bullet_list_idx not in final[2:], final


# ─── End-to-end handler test: structured `slides` with explicit layouts ──


def test_generate_handler_emits_slides_with_pinned_layouts(monkeypatch):
    """AC: a 9-slide deck where every slide has an explicit layout MUST
    produce SlideModel rows whose `.layout` field matches the requested
    layout ids in order.

    Exercises the full handler path (not just the resolver) so we catch
    regressions where, for example, `apply_variety_bias` accidentally
    starts second-guessing explicit overrides, or the structure→slides
    mapping drifts."""
    import uuid

    from api.v1.ppt.endpoints import presentation as presentation_module
    from models.generate_presentation_request import (
        GeneratePresentationRequest,
        SlideInputModel,
    )
    from models.presentation_and_path import PresentationAndPath

    layout = _make_layout_model()
    requested_layout_ids = [
        "koho-intro-slide",
        "koho-statement",
        "koho-two-column",
        "koho-bullet-list",
        "koho-bullet-list-split",
        "koho-bullet-points",
        "koho-table",
        "koho-timeline",
        "koho-cta",
    ]

    # Capture the SlideModel rows the handler tries to persist so we
    # can assert their `.layout` fields without spinning up a real DB.
    captured_slides: List[Any] = []

    class _FakeSession:
        def add(self, obj):
            # Capture SlideModel objects (skip presentation, status, etc).
            from models.sql.slide import SlideModel as _SlideModel

            if isinstance(obj, _SlideModel):
                captured_slides.append(obj)

        def add_all(self, objs):
            from models.sql.slide import SlideModel as _SlideModel

            for obj in objs:
                if isinstance(obj, _SlideModel):
                    captured_slides.append(obj)

        async def commit(self):
            return None

    async def _fake_get_layout_by_name(name: str):
        return layout

    async def _fake_get_slide_content(slide_layout, outline, *args, **kwargs):
        # Return a minimal content dict — the LLM call is bypassed,
        # we just need the handler to build SlideModel rows.
        return {"title": outline.content[:40], "__speaker_note__": "ok"}

    async def _fake_process_assets(_image_service, _slide):
        return []

    async def _fake_export(pid, _title, _format):
        return PresentationAndPath(
            presentation_id=pid,
            path="/tmp/exports/fake.pptx",
        )

    monkeypatch.setattr(presentation_module, "get_layout_by_name", _fake_get_layout_by_name)
    monkeypatch.setattr(
        presentation_module,
        "get_slide_content_from_type_and_outline",
        _fake_get_slide_content,
    )
    monkeypatch.setattr(
        presentation_module,
        "process_slide_and_fetch_assets",
        _fake_process_assets,
    )
    monkeypatch.setattr(presentation_module, "export_presentation", _fake_export)
    # No-op the image generation + concurrent webhook side-effects.
    monkeypatch.setattr(
        presentation_module,
        "ImageGenerationService",
        lambda _dir: object(),
    )
    monkeypatch.setattr(
        presentation_module.CONCURRENT_SERVICE,
        "run_task",
        lambda *args, **kwargs: None,
    )

    request = GeneratePresentationRequest(
        content="ignored — using structured slides",
        template="koho-pitch",
        n_slides=len(requested_layout_ids),
        slides=[
            SlideInputModel(markdown=f"# Slide {i}", layout=lid)
            for i, lid in enumerate(requested_layout_ids)
        ],
    )

    import asyncio

    response = asyncio.run(
        presentation_module.generate_presentation_handler(
            request,
            uuid.uuid4(),
            None,
            _FakeSession(),  # type: ignore[arg-type]
        )
    )
    assert response is not None

    # AC-2: each slide's `.layout` must equal the bare layout id the
    # agent pinned, in order.
    assert len(captured_slides) == len(requested_layout_ids)
    captured_ids = [s.layout for s in sorted(captured_slides, key=lambda s: s.index)]
    assert captured_ids == requested_layout_ids


def test_generate_handler_rejects_unknown_layout_id(monkeypatch):
    """An agent-supplied layout id that doesn't exist in the template
    should fail loudly with 400, not silently fall back to the picker.
    This is the early-validation contract that lets agents iterate
    without burning a full LLM round-trip on a typo."""
    import uuid

    from fastapi import HTTPException

    from api.v1.ppt.endpoints import presentation as presentation_module
    from models.generate_presentation_request import (
        GeneratePresentationRequest,
        SlideInputModel,
    )

    layout = _make_layout_model()

    async def _fake_get_layout_by_name(name: str):
        return layout

    monkeypatch.setattr(presentation_module, "get_layout_by_name", _fake_get_layout_by_name)

    class _NoopSession:
        def add(self, _obj):
            return None

        def add_all(self, _objs):
            return None

        async def commit(self):
            return None

    request = GeneratePresentationRequest(
        content="x",
        template="koho-pitch",
        n_slides=1,
        slides=[SlideInputModel(markdown="# x", layout="not-a-real-layout")],
    )
    import asyncio

    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            presentation_module.generate_presentation_handler(
                request,
                uuid.uuid4(),
                None,
                _NoopSession(),  # type: ignore[arg-type]
            )
        )
    assert exc.value.status_code == 400
    assert "not-a-real-layout" in exc.value.detail


def test_generate_handler_slides_markdown_still_works(monkeypatch):
    """AC: existing `slides_markdown` callers must keep working with no
    breaking changes. Same handler, same path — just no per-slide
    layout overrides."""
    import uuid

    from api.v1.ppt.endpoints import presentation as presentation_module
    from models.generate_presentation_request import GeneratePresentationRequest
    from models.presentation_and_path import PresentationAndPath
    from models.presentation_structure_model import PresentationStructureModel

    layout = _make_layout_model()
    captured_slides: List[Any] = []

    class _FakeSession:
        def add(self, obj):
            from models.sql.slide import SlideModel as _SlideModel

            if isinstance(obj, _SlideModel):
                captured_slides.append(obj)

        def add_all(self, objs):
            from models.sql.slide import SlideModel as _SlideModel

            for obj in objs:
                if isinstance(obj, _SlideModel):
                    captured_slides.append(obj)

        async def commit(self):
            return None

    async def _fake_get_layout_by_name(_name: str):
        return layout

    async def _fake_get_slide_content(slide_layout, outline, *args, **kwargs):
        return {"title": outline.content[:40], "__speaker_note__": "ok"}

    async def _fake_process_assets(_image_service, _slide):
        return []

    async def _fake_export(pid, _title, _format):
        return PresentationAndPath(
            presentation_id=pid,
            path="/tmp/exports/fake.pptx",
        )

    async def _fake_generate_structure(*args, **kwargs):
        # Picker proposes the same bullet-list-ish index for every slide;
        # variety bias should fan it out.
        bullet_list_idx = resolve_layout_id_to_index(layout, "koho-bullet-list")
        return PresentationStructureModel(slides=[bullet_list_idx] * 9)

    monkeypatch.setattr(presentation_module, "get_layout_by_name", _fake_get_layout_by_name)
    monkeypatch.setattr(
        presentation_module,
        "get_slide_content_from_type_and_outline",
        _fake_get_slide_content,
    )
    monkeypatch.setattr(
        presentation_module,
        "process_slide_and_fetch_assets",
        _fake_process_assets,
    )
    monkeypatch.setattr(presentation_module, "export_presentation", _fake_export)
    monkeypatch.setattr(
        presentation_module,
        "generate_presentation_structure",
        _fake_generate_structure,
    )
    monkeypatch.setattr(
        presentation_module,
        "ImageGenerationService",
        lambda _dir: object(),
    )
    monkeypatch.setattr(
        presentation_module.CONCURRENT_SERVICE,
        "run_task",
        lambda *args, **kwargs: None,
    )

    request = GeneratePresentationRequest(
        content="x",
        template="koho-pitch",
        n_slides=9,
        slides_markdown=[f"# Slide {i}" for i in range(9)],
    )
    import asyncio

    response = asyncio.run(
        presentation_module.generate_presentation_handler(
            request,
            uuid.uuid4(),
            None,
            _FakeSession(),  # type: ignore[arg-type]
        )
    )
    assert response is not None

    # AC-3 (handler-level): identical content, no explicit layout, picker
    # proposes one layout for everything — variety bias must rescue the
    # deck so it doesn't ship with bullet-list 9 times in a row.
    assert len(captured_slides) == 9
    final_layout_ids = [s.layout for s in sorted(captured_slides, key=lambda s: s.index)]
    distinct = len(set(final_layout_ids))
    assert distinct >= 4, (
        f"deprecated slides_markdown path collapsed to {distinct} distinct "
        f"layouts despite variety bias: {final_layout_ids}"
    )
