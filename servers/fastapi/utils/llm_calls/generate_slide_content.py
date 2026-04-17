from datetime import datetime
from typing import Optional
from models.llm_message import LLMSystemMessage, LLMUserMessage
from models.presentation_layout import SlideLayoutModel
from models.presentation_outline_model import SlideOutlineModel
from services.llm_client import LLMClient
from utils.llm_client_error_handler import handle_llm_client_exceptions
from utils.llm_provider import get_model
from utils.schema_utils import add_field_in_schema, remove_fields_from_schema


def get_system_prompt(
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
):
    return f"""
        Generate structured slide based on provided outline, follow mentioned steps and notes and provide structured output.

        # KOHO BRAND VOICE (always active — do not override)

        You are writing for Koho, the Context Platform for flex workspace operations.
        Koho connects operator data across PMS, CRM, and billing into one trusted
        foundation — ready for humans, agents, and every decision.

        ## Voice Rules
        - Direct, credible, warm. One idea per sentence. Active verbs.
        - Lead with the operator's problem, not Koho's feature.
        - Use Gear 1 (Authority Mode): personality dial at 3/10. Confidence from specificity.
        - Reinforce the Context Platform category — either state it or imply it.
        - Back claims with numbers, timeframes, named outcomes. No superlatives.
        - Problem first, solution second, outcome third.

        ## Vocabulary (non-negotiable)
        - Say "context platform" not "data platform" or "RevOps platform"
        - Say "live view" not "dashboard" or "real-time dashboard"
        - Say "workspace operator" not "coworking operator" or "user"
        - Say "signal" not "alert" or "notification"
        - Say "surface" not "identify" or "detect"
        - Say "agent" not "bot" or "automation"
        - Say "connect" not "integrate" or "sync"
        - Say "portfolio" not "account" or "org"
        - Say "see it in action" not "book a demo"
        - Say "foundation" not "backend" or "database"
        - Say "anticipate" not "predict" or "forecast"

        ## Avoid
        - Corporate filler: "leveraging", "synergise", "best-in-class"
        - Feature-first framing: "Our platform offers..."
        - Superlatives without evidence: "the most powerful"
        - American spellings (use British: colour, optimise, analyse)

        ## The Three-Layer Pitch (use when describing Koho as a whole)
        Koho is the context platform for flex workspace operations. We connect your
        data into one trusted foundation. Then we put agents on top that actually know
        what is going on. And we surface it all through a live view of your portfolio.


        {"# User Instructions:" if instructions else ""}
        {instructions or ""}

        {"# Tone:" if tone else ""}
        {tone or ""}

        {"# Verbosity:" if verbosity else ""}
        {verbosity or ""}

        # Steps
        1. Analyze the outline.
        2. Generate structured slide based on the outline.
        3. Generate speaker note that is simple, clear, concise and to the point.

        # Notes
        - Slide body should not use words like "This slide", "This presentation".
        - Rephrase the slide body to make it flow naturally.
        - Only use markdown to highlight important points.
        - Make sure to follow language guidelines.
        - Speaker note should be normal text, not markdown.
        - Strictly follow the max and min character limit for every property in the slide.
        - Never ever go over the max character limit. Limit your narration to make sure you never go over the max character limit.
        - Number of items should not be more than max number of items specified in slide schema. If you have to put multiple points then merge them to obey max numebr of items.
        - Generate content as per the given tone.
        - Be very careful with number of words to generate for given field. As generating more than max characters will overflow in the design. So, analyze early and never generate more characters than allowed.
        - Do not add emoji in the content.
        - Metrics should be in abbreviated form with least possible characters. Do not add long sequence of words for metrics.
        - For verbosity:
            - If verbosity is 'concise', then generate description as 1/3 or lower of the max character limit. Don't worry if you miss content or context.
            - If verbosity is 'standard', then generate description as 2/3 of the max character limit.
            - If verbosity is 'text-heavy', then generate description as 3/4 or higher of the max character limit. Make sure it does not exceed the max character limit.

        User instructions, tone and verbosity should always be followed and should supercede any other instruction, except for max and min character limit, slide schema and number of items.

        - Provide output in json format and **don't include <parameters> tags**.

        # Image and Icon Output Format
        image: {{
            __image_prompt__: string,
        }}
        icon: {{
            __icon_query__: string,
        }}

    """


def get_user_prompt(outline: str, language: str):
    return f"""
        ## Current Date and Time
        {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

        ## Icon Query And Image Prompt Language
        English

        ## Slide Content Language
        {language}

        ## Slide Outline
        {outline}
    """


def get_messages(
    outline: str,
    language: str,
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
):

    return [
        LLMSystemMessage(
            content=get_system_prompt(tone, verbosity, instructions),
        ),
        LLMUserMessage(
            content=get_user_prompt(outline, language),
        ),
    ]


async def get_slide_content_from_type_and_outline(
    slide_layout: SlideLayoutModel,
    outline: SlideOutlineModel,
    language: str,
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
):
    client = LLMClient()
    model = get_model()

    response_schema = remove_fields_from_schema(
        slide_layout.json_schema, ["__image_url__", "__icon_url__"]
    )
    response_schema = add_field_in_schema(
        response_schema,
        {
            "__speaker_note__": {
                "type": "string",
                "minLength": 100,
                "maxLength": 250,
                "description": "Speaker note for the slide",
            }
        },
        True,
    )

    messages = get_messages(
        outline.content,
        language,
        tone,
        verbosity,
        instructions,
    )
    print(
        f"get_slide_content_from_type_and_outline: model={model} outline_len={len(outline.content or '')} language={language}"
    )
    try:
        response = await client.generate_structured(
            model=model,
            messages=messages,
            response_format=response_schema,
            strict=False,
        )
        print(
            f"get_slide_content_from_type_and_outline: response is None={response is None} keys={list(response.keys())[:6] if isinstance(response, dict) else None}"
        )
        return response

    except Exception as e:
        print(f"get_slide_content_from_type_and_outline: exception={e}")
        raise handle_llm_client_exceptions(e)
