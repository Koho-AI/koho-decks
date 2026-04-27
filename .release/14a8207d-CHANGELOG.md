## [14a8207d] Add list_template_layouts MCP tool + structured per-slide layout override

### Added
- Added a `list_template_layouts` MCP tool (GET `/api/v1/ppt/template-layouts/{template}`) that returns the full layout palette for a given template, including each layout's fully-qualified id, one-line description, and a `content_shape` map of the fields the layout expects (`title`, `subtitle`, `items`, `metrics`, etc.).
- Added a structured `slides` request field to `generate_presentation` and `generate_presentation_async` accepting `Array<{markdown, layout?, speaker_note?}>`, allowing agents to pin a specific layout and/or speaker note to any individual slide.
- Added `SlideInputModel` Pydantic model (`servers/fastapi/models/generate_presentation_request.py`) to represent one structured slide input entry.
- Added `resolve_layout_id_to_index` utility (`servers/fastapi/utils/ppt_utils.py`) that resolves an agent-supplied layout id — either the bare form (`koho-statement`) or the fully-qualified form (`koho-pitch:koho-statement`) — to its index in the layout palette, accepting both built-in and custom template id formats.
- Added `apply_variety_bias` utility (`servers/fastapi/utils/ppt_utils.py`) that post-processes the auto-picker's proposed layout indices to prevent immediate consecutive repeats and cap any single layout at two uses in decks shorter than 12 slides, while leaving agent-pinned slides untouched.
- Added a variety-bias instruction block (`_VARIETY_BIAS_BLOCK`) to the LLM layout-picker system prompt to express the same no-repeat / at-least-4-distinct mandate at the generation stage.
- Added `list_template_layouts_api_v1_ppt_template_layouts__template__get` to the MCP server whitelist, exposed as the `list_template_layouts` tool.
- Updated descriptions on `generate_presentation` and `generate_presentation_async` to direct agents to call `list_template_layouts(template)` first, then use the `slides` field for per-slide layout targeting.
- Added `just test` recipe to the project `justfile` that mirrors the CI environment variables and skips pre-existing broken test modules, giving reviewers and developers a single reliable command to run the test suite.
- Added `servers/fastapi/tests/test_template_layouts.py` with 17 tests covering all three acceptance criteria: `list_template_layouts` palette completeness, explicit per-slide layout honoring, and variety-bias effectiveness.

### Deprecated
- `slides_markdown: List[str]` on `GeneratePresentationRequest` is deprecated in favour of the structured `slides` field; it continues to work unchanged and will be removed in a future release.
