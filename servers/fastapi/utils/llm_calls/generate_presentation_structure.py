from typing import Optional
from models.llm_message import LLMSystemMessage, LLMUserMessage
from models.presentation_layout import PresentationLayoutModel
from models.presentation_outline_model import PresentationOutlineModel
from services.llm_client import LLMClient
from utils.llm_client_error_handler import handle_llm_client_exceptions
from utils.llm_provider import get_model
from utils.get_dynamic_models import get_presentation_structure_model_with_n_slides
from models.presentation_structure_model import PresentationStructureModel


_VARIETY_BIAS_BLOCK = """
                # VARIETY MANDATE — read this carefully

                Decks where every slide uses the same layout (or where
                bullet-list shows up six times in a row) are a failure
                mode. The picker that came before you was guilty of
                exactly that: it reached for the safest layout for each
                slide independently and ignored what it had already
                used.

                You must do better. Concretely:
                - **Never pick the same layout for two consecutive slides.** If
                  the only layout that "fits" slide N is the one already on
                  slide N-1, pick the second-best fit instead.
                - **In decks shorter than 12 slides, do not reuse any single
                  layout more than twice.** If you've already used a layout
                  twice and you're tempted to use it a third time, pick a
                  different layout — even if the fit is slightly worse.
                - **Aim for at least 4 distinct layouts in any deck of 9 or
                  more slides**, more if the template offers them. Use the
                  full visual range of the template (intro, statement,
                  two-column, bullets, timeline, table, dashboards, CTA,
                  divider) — the agent that produced this prompt cares
                  more about variety than perfect fit.
                - The above rules are overridden ONLY when the user's
                  explicit instructions or the slide content makes a
                  specific layout obviously correct (e.g. an intro slide
                  on slide 1, a CTA on the final slide).
"""


def get_messages(
    presentation_layout: PresentationLayoutModel,
    n_slides: int,
    data: str,
    instructions: Optional[str] = None,
):
    return [
        LLMSystemMessage(
            content=f"""
                You're a professional presentation designer with creative freedom to design engaging presentations.

                {presentation_layout.to_string()}

                # DESIGN PHILOSOPHY
                - Create visually compelling and varied presentations
                - Match layout to content purpose and audience needs
                - Prioritize engagement over rigid formatting rules

                # Layout Selection Guidelines
                1. **Content-driven choices**: Let the slide's purpose guide layout selection
                - Opening/closing → Title layouts
                - Processes/workflows → Visual process layouts
                - Comparisons/contrasts → Side-by-side layouts
                - Data/metrics → Chart/graph layouts
                - Concepts/ideas → Image + text layouts
                - Key insights → Emphasis layouts

                2. **Visual variety**: Aim for diverse, engaging presentation flow
                - Mix text-heavy and visual-heavy slides naturally
                - Use your judgment on when repetition serves the content
                - Balance information density across slides

                3. **Audience experience**: Consider how slides work together
                - Create natural transitions between topics
                - Use layouts that enhance comprehension
                - Design for maximum impact and retention

                **Trust your design instincts. Focus on creating the most effective presentation for the content and audience.**
                {_VARIETY_BIAS_BLOCK}
                {"# User Instruction:" if instructions else ""}
                {instructions or ""}

                User intruction should be taken into account while creating the presentation structure, except for number of slides.

                Select layout index for each of the {n_slides} slides based on what will best serve the presentation's goals.
            """,
        ),
        LLMUserMessage(
            content=f"""
                {data}
            """,
        ),
    ]


def get_messages_for_slides_markdown(
    presentation_layout: PresentationLayoutModel,
    n_slides: int,
    data: str,
    instructions: Optional[str] = None,
):
    return [
        LLMSystemMessage(
            content=f"""
                You're a professional presentation designer with creative freedom to design engaging presentations.

                {"# User Instruction:" if instructions else ""}
                {instructions or ""}

                {presentation_layout.to_string()}

                Select layout that best matches the content of the slides.
                {_VARIETY_BIAS_BLOCK}
                User intruction should be taken into account while creating the presentation structure, except for number of slides.

                Select layout index for each of the {n_slides} slides based on what will best serve the presentation's goals.
            """,
        ),
        LLMUserMessage(
            content=f"""
                {data}
            """,
        ),
    ]


async def generate_presentation_structure(
    presentation_outline: PresentationOutlineModel,
    presentation_layout: PresentationLayoutModel,
    instructions: Optional[str] = None,
    using_slides_markdown: bool = False,
) -> PresentationStructureModel:

    client = LLMClient()
    model = get_model()
    response_model = get_presentation_structure_model_with_n_slides(
        len(presentation_outline.slides)
    )

    try:
        response = await client.generate_structured(
            model=model,
            messages=(
                get_messages_for_slides_markdown(
                    presentation_layout,
                    len(presentation_outline.slides),
                    presentation_outline.to_string(),
                    instructions,
                )
                if using_slides_markdown
                else get_messages(
                    presentation_layout,
                    len(presentation_outline.slides),
                    presentation_outline.to_string(),
                    instructions,
                )
            ),
            response_format=response_model.model_json_schema(),
            strict=True,
        )
        return PresentationStructureModel(**response)
    except Exception as e:
        raise handle_llm_client_exceptions(e)
