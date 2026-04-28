## Layout Variety & Agent Introspection for Koho Decks MCP

Agents using the Koho Decks MCP server can now discover a template's full layout palette before generating a deck and target specific layouts per slide — replacing the previous workaround of embedding layout intent in the freeform `instructions` field. A new `list_template_layouts` tool returns every layout available in a template (for `koho-pitch` that is 28 layouts: statement, two-column, timeline, metrics, the full dashboard family, CTA, section divider, team, and more), each with a one-line description of when to use it and the exact content fields it expects. The `generate_presentation` and `generate_presentation_async` tools now accept a structured `slides` array where each entry may carry an optional `layout` id and an optional `speaker_note`; when `layout` is set the picker honours it exactly with no LLM override. For slides where no layout is specified, a new variety-bias heuristic prevents immediate consecutive repeats and caps any single layout at two uses in decks shorter than 12 slides — so an auto-generated 9-slide deck now uses at least 4 distinct layouts rather than the previous typical outcome of 1–2.

### New configuration options or environment variables
None. No new environment variables or configuration files are required.

### Changes to existing behaviour users should be aware of
- **Auto-picked layout variety**: `generate_presentation` and `generate_presentation_async` now apply a variety-bias post-processor and an updated LLM prompt to auto-picked layout selections. Decks generated without explicit per-slide layouts will use a broader spread of layouts than before; the visual output will differ from prior runs on identical content, which is intentional.
- **Mutually exclusive inputs now rejected**: Sending both `slides` (new) and `slides_markdown` (deprecated) in the same request now returns HTTP 400 instead of silently choosing one. Callers that never sent both fields are unaffected.

### Deprecations
- `slides_markdown: List[str]` on the `generate_presentation` and `generate_presentation_async` request bodies is deprecated. It continues to work with no breaking changes and agents may keep using it during the deprecation window. Callers should migrate to the structured `slides: Array<{markdown, layout?, speaker_note?}>` field to gain per-slide layout control.
