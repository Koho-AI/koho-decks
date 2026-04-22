# Phase 7 — Post-generation editability + layout swap

Post-Phase-6 work. The demo team will be editing decks live, which has surfaced three categories of gap:

1. **Text editability holes** — some rendered text can't be clicked to edit. Green metric numbers, stats, short labels, anything inside a showcase mockup. Needs a principled audit, not more patches.
2. **Layout rigidity** — once a deck is generated, you can't swap a slide's template (e.g. "I want the 5-box solutions grid, not the title+description"). Today this means regenerating from scratch.
3. **Rendering stability** — animated showcase components (framer-motion) race with `TiptapTextReplacer` and crash the slide. Defensive guards mitigate this but the architecture is fragile.

## Context

Presenton's editability model:

```
<V1ContentRender>
  <EditableLayoutWrapper>
    <TiptapTextReplacer>        <-- walks DOM, replaces text nodes with Tiptap
      <LayoutComp data={…}/>    <-- your React template
    </TiptapTextReplacer>
  </EditableLayoutWrapper>
</V1ContentRender>
```

`TiptapTextReplacer` scans `querySelectorAll("*")`, picks elements that have direct text content and no text-bearing children, then `replaceChild`s them with a Tiptap instance. It uses string equality (`findDataPath`) to find the corresponding value in `slide.content` so edits persist.

**Where it breaks today:**

- **Mixed content** — `<span>{value}<span>{unit}</span></span>` means the outer span gets skipped (has text child) and the direct-text `{value}` becomes unreachable. (Partially mitigated: we removed the unit field from MetricsSlideLayout and bake it into value.)
- **Short text** — legacy `< 3` threshold excluded single/double-digit metrics. (Mitigated: threshold lowered to 1.)
- **Icon siblings** — `querySelector("img, svg, button, ...")` flagged any card containing an icon. (Mitigated: only `button/input/textarea/select` now.)
- **Data-path mismatch** — `findDataPath` is strict string equality against `slide.content`. Any text the template adds beyond `data` (static labels, pre-formatted composites like `"${value}${unit}"`) doesn't match, so Tiptap captures the edit but has no path to persist — looks "hard-coded" to the user.
- **Animation DOM races** — framer-motion remounts / reorders nodes between the replacer's `querySelectorAll` and its `replaceChild`. (Mitigated: `isConnected` check + try/catch around both useEffects.)

## Phase 7 scope

### 7a — Editability audit + template conformance rules (1–2 days)

Goal: every piece of template-rendered text is either editable **with persistence** or explicitly marked as chrome. No more ambiguity.

**Template rules (document and enforce):**

- Every text leaf the user should edit gets a value from `data.*`, not a computed/concatenated string. Prefer `<span>{label}</span>` over `<span>{prefix} {label}</span>`.
- If a value needs formatting, bake the format into the schema default + description so the LLM emits the final form (e.g. `value: "£240k"`, not `value: 240, unit: "k"`).
- Static chrome (badges, section markers like "§ SOLUTIONS", page numbers) gets `data-koho-chrome="true"` attribute and is skipped by `TiptapTextReplacer`.
- Nested text inside framer-motion-animated subtrees gets wrapped in a `<NonEditable>` marker so the replacer doesn't even try.

**Code changes:**

- Add `ignoredAttributes` check in `TiptapTextReplacer` for `data-koho-chrome`.
- Template-by-template pass (all 26 koho-pitch layouts × dark+light): every piece of user-visible text either reads from `data` or wears the chrome attribute. Fix mixed content on sight.
- Extend `findDataPath` to fall back to registering a new field on `slide.content` when no match is found, so mid-slide-edits don't vanish. (Or at minimum: log the mismatch to the console so we can see it during the audit.)

**Deliverable:** walking through any generated deck, every non-chrome text is clickable and the edit survives a refresh.

### 7b — Layout swap UI (2–3 days)

Goal: on any slide in edit mode, a "Change layout" affordance opens a picker of compatible layouts. Pick one → slide re-renders with the new template. Existing content preserved where field names overlap; missing fields are LLM-filled from the slide's `outline.content`.

**Backend (FastAPI):**

- `POST /api/v1/ppt/slides/{id}/change-layout`:
  - Body: `{ layout: "koho-pitch:MetricsSlideLayout" }` (or layout UUID).
  - Looks up the target layout's Zod schema.
  - Maps existing `slide.content` fields by name into the new schema (e.g. `title` → `title`, `description` → `description`).
  - For fields the target needs but the old data lacks, calls `get_slide_content_from_type_and_outline` with the original slide `outline` to regenerate just those fields.
  - Persists + returns the updated slide.
- Auth: owner or editor via `check_deck_access(write=True)`.

**Frontend:**

- `components/LayoutPicker.tsx` — grid of layout thumbnails, grouped by template family. Each thumbnail uses the existing `template-preview` render for visual fidelity.
- `SlideContent.tsx` gets a "Change layout" menu item in its per-slide hover controls.
- Picker opens → swaps layout via the API → React Redux slice updates → slide re-renders.

**Schema design:**

- Layouts declare a `semanticFields` map in the export — a JSON of `{ local_field_name: semantic_key }`. E.g. `MetricsSlideLayout` exports `{ title: "title", subtitle: "subtitle", metrics: "metric_list" }`. Used by the backend to match during swap.
- Add this export to each Koho template; default to identity mapping if absent.

**Deliverable:** user clicks "Change layout" on a title+description slide, picks the 5-box metrics layout, and the slide re-renders with the original outline re-flowed into metric cards.

### 7c — Render-time stability (0.5 day)

Goal: slide rendering never crashes the whole deck.

- Error boundary wrapping each `LayoutComp` render (React `ErrorBoundary`) — we already have `SlideErrorBoundary` but it needs verification that it catches `TiptapTextReplacer` DOM errors.
- Replacer should respect an env flag `NEXT_PUBLIC_DISABLE_TIPTAP_REPLACER=1` for debugging (lets us isolate whether a crash is from the replacer or the template).
- Consider a MutationObserver-based replacer (reactive) instead of the one-shot scan — survives framer-motion remounts properly. Prototype first; may replace the current implementation.

## Execution order

1. **7c first** (half-day) — ship the error boundary + debug flag so subsequent work doesn't get stalled by crashes.
2. **7a** — editability audit, hit every Koho template. Highest day-to-day impact for the demo team.
3. **7b** — layout swap. Biggest feature; ship after editability is solid.

## Open questions

1. Do we want the layout swap to offer "Regenerate content for this layout" as a button, or always preserve existing where possible? I've assumed preserve + regenerate missing; confirm.
2. For 7a, do we want `findDataPath` to fall back to dynamically registering unknown fields (so ad-hoc edits always save somewhere), or is failing-loud (console warn) enough to drive the audit?
3. Should `data-koho-chrome` be on a utility component (`<Chrome>...</Chrome>`) rather than a raw attribute? Reads better but adds a component hop to every chrome element.

## Files forecast

**7a:**
- `servers/nextjs/app/(presentation-generator)/components/TiptapTextReplacer.tsx` — add chrome attribute check, better findDataPath
- `servers/nextjs/app/presentation-templates/koho-pitch/*.tsx` — per-template audit; add chrome attrs, flatten mixed content

**7b:**
- New: `servers/fastapi/api/v1/ppt/endpoints/layout_swap.py`
- New: `servers/nextjs/components/LayoutPicker.tsx`
- Modified: every Koho template gets a `semanticFields` export
- Modified: `servers/nextjs/app/(presentation-generator)/presentation/components/SlideContent.tsx` — per-slide hover controls

**7c:**
- `servers/nextjs/app/(presentation-generator)/components/TiptapTextReplacer.tsx` — debug flag respect
- `servers/nextjs/app/(presentation-generator)/components/SlideErrorBoundary.tsx` — verify/extend
