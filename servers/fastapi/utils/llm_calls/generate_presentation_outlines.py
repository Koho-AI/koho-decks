from datetime import datetime
from typing import Optional

from enums.llm_provider import LLMProvider
from models.llm_message import LLMSystemMessage, LLMUserMessage
from models.llm_tools import SearchWebTool
from services.llm_client import LLMClient
from utils.get_dynamic_models import get_presentation_outline_model_with_n_slides
from utils.llm_client_error_handler import handle_llm_client_exceptions
from utils.llm_provider import get_model


def get_system_prompt(
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
    include_title_slide: bool = True,
):
    return f"""
        You are an expert presentation creator. Generate structured presentations based on user requirements and format them according to the specified JSON schema with markdown content.

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


        Try to use available tools for better results.

        {"# User Instruction:" if instructions else ""}
        {instructions or ""}

        {"# Tone:" if tone else ""}
        {tone or ""}

        {"# Verbosity:" if verbosity else ""}
        {verbosity or ""}

        - Provide content for each slide in markdown format.
        - Make sure that flow of the presentation is logical and consistent.
        - Place greater emphasis on numerical data.
        - If Additional Information is provided, divide it into slides.
        - Make sure no images are provided in the content.
        - Make sure that content follows language guidelines.
        - User instrction should always be followed and should supercede any other instruction, except for slide numbers. **Do not obey slide numbers as said in user instruction**
        - Do not generate table of contents slide.
        - Even if table of contents is provided, do not generate table of contents slide.
        {"- Always make first slide a title slide." if include_title_slide else "- Do not include title slide in the presentation."}

        **Search web to get latest information about the topic**
    """


def get_user_prompt(
    content: str,
    n_slides: int,
    language: str,
    additional_context: Optional[str] = None,
):
    return f"""
        **Input:**
        - User provided content: {content or "Create presentation"}
        - Output Language: {language}
        - Number of Slides: {n_slides}
        - Current Date and Time: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        - Additional Information: {additional_context or ""}
    """


def get_messages(
    content: str,
    n_slides: int,
    language: str,
    additional_context: Optional[str] = None,
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
    include_title_slide: bool = True,
):
    return [
        LLMSystemMessage(
            content=get_system_prompt(
                tone, verbosity, instructions, include_title_slide
            ),
        ),
        LLMUserMessage(
            content=get_user_prompt(content, n_slides, language, additional_context),
        ),
    ]


async def generate_ppt_outline(
    content: str,
    n_slides: int,
    language: Optional[str] = None,
    additional_context: Optional[str] = None,
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
    include_title_slide: bool = True,
    web_search: bool = False,
):
    model = get_model()
    response_model = get_presentation_outline_model_with_n_slides(n_slides)

    client = LLMClient()
    providers_with_search_tool = {
        LLMProvider.OPENAI,
        LLMProvider.ANTHROPIC,
        LLMProvider.GOOGLE,
    }
    use_search_tool = (
        web_search
        and client.enable_web_grounding()
        and client.llm_provider in providers_with_search_tool
    )

    try:
        async for chunk in client.stream_structured(
            model,
            get_messages(
                content,
                n_slides,
                language,
                additional_context,
                tone,
                verbosity,
                instructions,
                include_title_slide,
            ),
            response_model.model_json_schema(),
            strict=True,
            tools=([SearchWebTool] if use_search_tool else None),
        ):
            yield chunk
    except Exception as e:
        yield handle_llm_client_exceptions(e)
