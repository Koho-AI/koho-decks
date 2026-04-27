## Layout Variety & Agent Introspection for Koho Decks MCP

Agents using the Koho Decks MCP server can now discover a template's full layout palette and target specific layouts per slide, replacing the previous workaround of embedding layout intent in the freeform `instructions` field. A new `list_template_layouts` tool returns every layout available in a template — for `koho-pitch` that is 28 layouts including statement, two-column, timeline, metrics, the dashboard family, CTA, and more — with a one-line description of when to use each and the exact content fields it expects. The `generate_presentation` and `generate_presentation_async` tools now accept a structured `slides` array where each entry can carry an optional `layout` id (as returned by `list_template_layouts`) and an optional `speaker_note`; when `layout` is set, the picker honours it exactly with no override. For slides where no layout is specified, a new variety-bias heuristic prevents immediate consecutive repeats and caps any single layout at two uses in decks shorter than 12 slides, so an auto-generated 9-slide deck now uses at least 4 distinct layouts instead of the previous typical outcome of 1–2.

### New configuration options / environment variables
None. No new environment variables or configuration files are required.

### Changes to existing behaviour
- `generate_presentation` and `generate_presentation_async` now apply a variety-bias post-processor to auto-picked layout selections. Decks generated without explicit per-slide layouts will use a broader spread of layouts than before; the visual output will differ from prior runs on identical content.
- When both `slides` (new) and `slides_markdown` (deprecated) are provided in the same request, the server now returns HTTP 400 instead of silently choosing one; this is a breaking change only for callers that inadvertently sent both fields.

### Deprecations
- `slides_markdown: List[str]` on the `generate_presentation` and `generate_presentation_async` request bodies is deprecated. It continues to work with no breaking changes. Callers should migrate to the structured `slides: Array<{markdown, layout?, speaker_note?}>` field to gain per-slide layout control. The `slides_markdown` field will be removed in a future release.
