from models.presentation_layout import PresentationLayoutModel
from models.presentation_outline_model import PresentationOutlineModel
import re
from typing import List, Optional

from models.presentation_structure_model import PresentationStructureModel


def get_presentation_title_from_outlines(
    presentation_outlines: PresentationOutlineModel,
) -> str:
    if not presentation_outlines.slides:
        return "Untitled Presentation"

    first_content = presentation_outlines.slides[0].content or ""

    if re.match(r"^\s*#{1,6}\s*Page\s+\d+\b", first_content):
        first_content = re.sub(
            r"^\s*#{1,6}\s*Page\s+\d+\b[\s,:\-]*",
            "",
            first_content,
            count=1,
        )

    return (
        first_content[:100]
        .replace("#", "")
        .replace("/", "")
        .replace("\\", "")
        .replace("\n", " ")
    )


def find_slide_layout_index_by_regex(
    layout: PresentationLayoutModel, patterns: List[str]
) -> int:
    def _find_index(pattern: str) -> int:
        regex = re.compile(pattern, re.IGNORECASE)
        for index, slide_layout in enumerate(layout.slides):
            candidates = [
                slide_layout.id or "",
                (slide_layout.name or ""),
                (slide_layout.description or ""),
                (slide_layout.json_schema.get("title") if slide_layout.json_schema else ""),
            ]
            for text in candidates:
                if text and regex.search(text):
                    return index
        return -1

    for pattern in patterns:
        match_index = _find_index(pattern)
        if match_index != -1:
            return match_index

    return -1


def resolve_layout_id_to_index(
    layout: PresentationLayoutModel, layout_id: str
) -> Optional[int]:
    """Resolve an agent-supplied layout id to its index in `layout.slides`.

    Accepts either the bare id (e.g. `koho-statement`) or the qualified
    form `{template}:{layout_id}` (e.g. `koho-pitch:koho-statement`). The
    qualified form is what `list_template_layouts` returns; the bare form
    is what's stored on slide rows in the DB. Both are valid input from
    the agent.

    Returns None when the id can't be matched — the caller decides
    whether that's a hard error or a fall-through to the auto-picker.
    """
    if not layout_id:
        return None
    bare_id = layout_id.split(":", 1)[1] if ":" in layout_id else layout_id
    for index, slide_layout in enumerate(layout.slides):
        if slide_layout.id == bare_id:
            return index
        if slide_layout.id == layout_id:
            return index
    return None


def apply_variety_bias(
    proposed_indices: List[int],
    explicit_overrides: List[Optional[int]],
    total_slide_layouts: int,
) -> List[int]:
    """Re-distribute auto-picked layout indices to avoid monotony.

    Heuristic — applied ONLY to slots where the agent didn't pin a layout
    explicitly (`explicit_overrides[i] is None`):
      1. No immediate repeats: if slot N picked the same index as slot N-1,
         try to swap to any unused index.
      2. No more than 2× any layout in decks of <12 slides: if a layout
         has already been used twice and the picker reaches for it again,
         swap to the least-used available index.

    Slots with an explicit override are honoured verbatim and counted
    toward the running tally so the auto-pick slots don't *also* repeat
    the agent's chosen layout.

    Returns the mutated indices list. Length is preserved.
    """
    if total_slide_layouts <= 0 or not proposed_indices:
        return proposed_indices

    n = len(proposed_indices)
    repeat_cap_active = n < 12

    use_count: dict[int, int] = {}
    # Pre-count explicit picks so the variety bias respects them.
    for idx in explicit_overrides:
        if idx is None:
            continue
        use_count[idx] = use_count.get(idx, 0) + 1

    result: List[int] = list(proposed_indices)

    def _least_used_index(forbidden: set[int]) -> int:
        # Pick the layout with the lowest use count that isn't in
        # `forbidden`. Tie-break by index for determinism (so tests are
        # stable). Falls back to the first non-forbidden index if every
        # layout is forbidden somehow.
        best_index = -1
        best_count = float("inf")
        for candidate in range(total_slide_layouts):
            if candidate in forbidden:
                continue
            count = use_count.get(candidate, 0)
            if count < best_count:
                best_count = count
                best_index = candidate
        if best_index == -1:
            for candidate in range(total_slide_layouts):
                if candidate not in forbidden:
                    return candidate
            return proposed_indices[0]
        return best_index

    for i in range(n):
        if explicit_overrides[i] is not None:
            # Explicit override already counted above.
            result[i] = explicit_overrides[i]  # type: ignore[assignment]
            continue

        candidate = result[i]
        previous = result[i - 1] if i > 0 else None

        # Penalty 1: immediate repeat. Always swap when there's at least
        # one other layout to choose from.
        if previous is not None and candidate == previous and total_slide_layouts > 1:
            candidate = _least_used_index({previous})

        # Penalty 2: >2× usage in a short deck. Only kicks in when the
        # candidate has already been used at least twice, AND we're in a
        # deck short enough that repetition is the dominant failure mode.
        if (
            repeat_cap_active
            and use_count.get(candidate, 0) >= 2
            and total_slide_layouts > 1
        ):
            forbidden = {candidate}
            if previous is not None:
                forbidden.add(previous)
            replacement = _least_used_index(forbidden)
            # Only swap if the replacement actually has a lower usage
            # count — otherwise we'd be churning between equally-used
            # layouts for no benefit.
            if use_count.get(replacement, 0) < use_count.get(candidate, 0):
                candidate = replacement

        result[i] = candidate
        use_count[candidate] = use_count.get(candidate, 0) + 1

    return result


def select_toc_or_list_slide_layout_index(
    layout: PresentationLayoutModel,
) -> int:
    toc_patterns = [
        r"\btable\s*of\s*contents\b",
        r"\btable[- ]?of[- ]?contents\b",
        r"\bagenda\b",
        r"\bcontents\b",
        r"\boutline\b",
        r"\bindex\b",
        r"\btoc\b",
    ]

    list_patterns = [
        r"\b(bullet(ed)?\s*list|bullets?)\b",
        r"\b(numbered\s*list|ordered\s*list|unordered\s*list)\b",
        r"\blist\b",
    ]

    toc_index = find_slide_layout_index_by_regex(layout, toc_patterns)
    if toc_index != -1:
        return toc_index

    return find_slide_layout_index_by_regex(layout, list_patterns)
