## Migration Notes — 14a8207d

### Database schema changes
None. No new tables, altered columns, or new indexes were introduced.

### Configuration file format changes
None. No changes to environment variables, `.env` files, or any configuration file format.

### API changes

**New endpoint**
- `GET /api/v1/ppt/template-layouts/{template}` — returns the layout palette for a built-in or custom template. Auth-gated via the same NextAuth session cookie or Bearer JWT mechanism as all other `/api/v1/ppt` endpoints. Entirely additive; no migration action required.

**Modified endpoints**
- `POST /api/v1/ppt/presentation/generate` and `POST /api/v1/ppt/presentation/generate/async` now accept a new optional `slides` body field (`Array<{markdown: string, layout?: string, speaker_note?: string}>`). The existing `slides_markdown` field continues to work unchanged.
- Both endpoints now return **HTTP 400** if both `slides` and `slides_markdown` are provided in the same request. Previously one was silently ignored (undefined behaviour). Callers that already send only one of the two fields require no changes.

**No removed endpoints.**

### Dependency version changes
None. No changes to `pyproject.toml`, `requirements*.txt`, `package.json`, or any lockfile.

### Required environment variable changes
None.

### Migration steps

No migration steps are required for this change, with one exception:

**Action required if your client sends both `slides` and `slides_markdown` in the same request:** Remove one of the two fields before deploying. Sending both now returns HTTP 400. Any well-formed client that already uses only one field requires no changes.
