## [14a8207d] Add list_template_layouts MCP tool + structured per-slide layout override

### Added
- Added a `list_template_layouts` MCP tool (`GET /api/v1/ppt/template-layouts/{template}`) that returns the full layout palette for a given template, with each entry including its fully-qualified id (e.g. `koho-pitch:koho-statement`), a one-line description of when to use it, and a `content_shape` map of the fields the layout expects (`title`, `subtitle`, `items`, `metrics`, etc.).
- Added a structured `slides` request field to `generate_presentation` and `generate_presentation_async` accepting `Array<{markdown, layout?, speaker_note?}>`, allowing agents to pin a specific layout and/or speaker note to any individual slide; when `layout` is set the picker honours it exactly with no override.
- Added `SlideInputModel` Pydantic model (`servers/fastapi/models/generate_presentation_request.py`) representing one structured slide input entry with `markdown`, optional `layout`, and optional `speaker_note` fields.
- Added `resolve_layout_id_to_index` utility (`servers/fastapi/utils/ppt_utils.py`) that resolves an agent-supplied layout id — either the bare form (`koho-statement`) or the fully-qualified form (`koho-pitch:koho-statement`) — to its index in the layout palette, handling both built-in and custom (`custom-<uuid>:...`) template id formats.
- Added `apply_variety_bias` utility (`servers/fastapi/utils/ppt_utils.py`) that post-processes auto-picker layout indices to prevent immediate consecutive repeats and cap any single layout at two uses in decks shorter than 12 slides, while leaving agent-pinned slides untouched and counting pinned uses toward the cap.
- Added `_VARIETY_BIAS_BLOCK` variety-mandate instructions to both LLM layout-picker system prompts (`servers/fastapi/utils/llm_calls/generate_presentation_structure.py`) to bias generation toward layout variety at the LLM stage in addition to the deterministic post-processor.
- Added `list_template_layouts_api_v1_ppt_template_layouts__template__get` to the MCP server whitelist in `servers/fastapi/mcp_server.py`, exposed to agents as the `list_template_layouts` tool.
- Updated descriptions on `generate_presentation` and `generate_presentation_async` to direct agents to call `list_template_layouts(template)` first, then use the structured `slides` field for per-slide layout targeting.
- Added `just test` recipe to the project `justfile` that sets the correct environment variables and skips pre-existing broken test modules, providing a single reliable command to run the test suite locally.
- Added `servers/fastapi/tests/test_template_layouts.py` with 17 tests covering all three acceptance criteria: `list_template_layouts` palette completeness, explicit per-slide layout honoring (including on ordered templates and custom templates), and variety-bias effectiveness.

### Deprecated
- `slides_markdown: List[str]` on `GeneratePresentationRequest` is deprecated in favour of the structured `slides` field; it continues to work unchanged and will be removed in a future release.
