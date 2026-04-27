from typing import List, Literal, Optional
from pydantic import BaseModel, Field

from enums.tone import Tone
from enums.verbosity import Verbosity


class SlideInputModel(BaseModel):
    """Structured per-slide input.

    Replaces `slides_markdown: List[str]` for callers who want to control
    layout selection per slide (instead of leaving it to the picker, which
    biases toward safest-fit and produces monotonous decks).
    """

    markdown: str = Field(
        ...,
        description=(
            "The slide's content as markdown — same shape as a single entry "
            "in the deprecated `slides_markdown` array."
        ),
    )
    layout: Optional[str] = Field(
        default=None,
        description=(
            "Optional layout id to force for this slide. Either form is "
            "accepted: the fully-qualified id returned by "
            "`list_template_layouts` (e.g. `koho-pitch:koho-statement` or "
            "`custom-<uuid>:my-layout`), or the bare id (e.g. "
            "`koho-statement`). When set, the picker MUST honour it — no "
            "LLM override, and the override wins over ordered templates "
            "too. Call `list_template_layouts(template)` to discover valid "
            "ids. When omitted, the slide falls back to the auto-picker "
            "(which now biases toward layout variety across the deck)."
        ),
    )
    speaker_note: Optional[str] = Field(
        default=None,
        description=(
            "Optional speaker note for this slide. When omitted, a note is "
            "auto-generated from the slide content."
        ),
    )


class GeneratePresentationRequest(BaseModel):
    content: str = Field(..., description="The content for generating the presentation")
    slides_markdown: Optional[List[str]] = Field(
        default=None,
        description=(
            "DEPRECATED. The markdown for each slide as a flat list of "
            "strings. Prefer the structured `slides` field, which lets you "
            "specify a layout per slide (call `list_template_layouts(template)` "
            "first to see what's available)."
        ),
    )
    slides: Optional[List[SlideInputModel]] = Field(
        default=None,
        description=(
            "Structured per-slide content. Each entry: `{markdown, layout?, "
            "speaker_note?}`. When `layout` is set on a slide, the picker "
            "MUST honour it — no override. When omitted, that slide falls "
            "back to the auto-picker (with a variety bias so consecutive "
            "slides don't repeat the same layout). Prefer this over "
            "`slides_markdown` so you can target specific layouts. Templates "
            "contain multiple layouts — call `list_template_layouts(template)` "
            "first to see what's available."
        ),
    )
    instructions: Optional[str] = Field(
        default=None, description="The instruction for generating the presentation"
    )
    tone: Tone = Field(default=Tone.DEFAULT, description="The tone to use for the text")
    verbosity: Verbosity = Field(
        default=Verbosity.STANDARD, description="How verbose the presentation should be"
    )
    web_search: bool = Field(default=False, description="Whether to enable web search")
    n_slides: int = Field(default=8, description="Number of slides to generate")
    language: str = Field(
        default="English", description="Language for the presentation"
    )
    template: str = Field(
        default="general", description="Template to use for the presentation"
    )
    include_table_of_contents: bool = Field(
        default=False, description="Whether to include a table of contents"
    )
    include_title_slide: bool = Field(
        default=True, description="Whether to include a title slide"
    )
    files: Optional[List[str]] = Field(
        default=None, description="Files to use for the presentation"
    )
    export_as: Literal["pptx", "pdf"] = Field(
        default="pptx", description="Export format"
    )
    trigger_webhook: bool = Field(
        default=False, description="Whether to trigger subscribed webhooks"
    )
