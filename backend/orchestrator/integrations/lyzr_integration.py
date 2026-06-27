"""Lyzr (lyzr-adk 0.1.11) LLM backend implementation.

lyzr-adk is the official, maintained Lyzr Python SDK. It supports Python 3.8+
(including Python 3.13) and routes inference through Lyzr's cloud platform
(studio.lyzr.ai) using the configured provider (Google Gemini in our case).

Package: lyzr-adk 0.1.11  |  namespace: import lyzr  |  Python: >=3.8
Provider: "google/gemini-2.0-flash"  |  credential: "lyzr_google"

Role in architecture:
    LyzrBackend implements LLMBackend (from orchestrator.llm.backend).
    create_lyzr_backend() is the async factory called by llm.backend.create_backend()
    when LYZR_ENABLED=true and LYZR_API_KEY is set.

    All four Workplace Proxy agents share ONE LyzrBackend instance (one Lyzr cloud
    agent). The agent's system_prompt (persona) is prepended to each call message so
    the model receives the full context, mirroring how GoogleBackend uses
    system_instruction. The DebateEngine orchestration loop is unchanged (ADR-006).

API verified (lyzr-adk 0.1.11, inspected 2026-06-25):
    Studio(api_key).acreate_agent(**kwargs) -> Agent          (async)
    Agent.run(message, session_id)           -> AgentResponse (sync)
    Agent.arun(message, session_id)          -> AgentResponse (async)
    AgentResponse.response                   -> str
    parse_model("google/gemini-2.0-flash")   -> (ProviderName.GOOGLE, "gemini-2.0-flash", ...)
    credential_id for Google                 -> "lyzr_google"

See DECISIONS.md ADR-012.
"""
from __future__ import annotations

import uuid
from typing import Any

from orchestrator.llm.backend import LLMBackend
from orchestrator.utils.logging_config import get_logger

logger = get_logger(__name__)


# ── Import guard ─────────────────────────────────────────────────────────────
try:
    from lyzr import Studio
    from lyzr import Agent as _LyzrAgent       # type: ignore[attr-defined]
    from lyzr import AgentResponse as _AgentResponse  # type: ignore[attr-defined]
    LYZR_AVAILABLE = True
    import lyzr as _lyzr
    logger.info(
        "lyzr_adk_available",
        version=getattr(_lyzr, "__version__", "0.1.11"),
    )
except ImportError:
    LYZR_AVAILABLE = False
    logger.warning("lyzr_adk_not_installed", hint="pip install lyzr-adk")


class LyzrBackend(LLMBackend):
    """
    LLM backend that routes inference through Lyzr's cloud platform.

    Implements LLMBackend so it is a drop-in replacement for GoogleBackend.
    ONE instance is shared across all four Workplace Proxy agents.

    call_text / call_json:
      Both prepend the system_prompt (agent persona) to the user message before
      calling agent.run(). This mirrors GoogleBackend where system_prompt is the
      system_instruction — the model sees the same semantic content.

    Temperature:
      Lyzr's cloud agent uses the temperature set at creation time (0.3).
      Per-call temperature overrides are not exposed by the current SDK version.
      This is a known trade-off documented in ADR-012.

    Session IDs:
      A fresh UUID is generated per call. store_messages=False at agent creation
      ensures the Lyzr agent has no cross-call memory, keeping inference stateless.
    """

    def __init__(self, agent: Any) -> None:
        self._agent = agent
        self._patch_lyzr_list_response()

    def _patch_lyzr_list_response(self) -> None:
        """Unwrap list API responses before Lyzr SDK's _parse_chat_response sees them.

        The Lyzr /v3/inference/chat/ endpoint intermittently returns a JSON array
        instead of a JSON object. HTTPClient.post() does response.json() verbatim, so
        _parse_chat_response receives a list and fails on response.get("response", "").
        Patching the specific inference instance at construction time fixes this without
        touching the SDK files.
        """
        try:
            inference = self._agent._inference
            _original = inference._parse_chat_response

            def _safe_parse(response: Any, session_id: str) -> Any:
                if isinstance(response, list):
                    response = response[0] if (response and isinstance(response[0], dict)) else {}
                return _original(response, session_id)

            inference._parse_chat_response = _safe_parse
        except AttributeError:
            logger.warning(
                "lyzr_inference_patch_failed",
                hint="SDK internals may have changed; list API responses may still raise AttributeError",
            )

    def call_text(self, prompt: str, system_prompt: str, temperature: float = 0.3) -> str:
        """Synchronous text inference via Lyzr cloud."""
        message = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        resp: Any = self._agent.run(
            message=message,
            session_id=str(uuid.uuid4()),
        )
        return resp.response.strip()

    def call_json(self, prompt: str, system_prompt: str, temperature: float = 0.2) -> Any:
        """Synchronous JSON inference via Lyzr cloud with json_utils extraction."""
        from orchestrator.utils.json_utils import extract_json
        message = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        resp: Any = self._agent.run(
            message=message,
            session_id=str(uuid.uuid4()),
        )
        return extract_json(resp.response)


async def create_per_agent_lyzr_backends(
    api_key: str,
    model: str,
) -> dict[str, LyzrBackend]:
    """
    Async factory: create one Lyzr cloud agent per Workplace Proxy agent role.

    Returns a dict keyed by agent name: interceptor, contextualizer, scheduler,
    translator. Each agent gets a dedicated Lyzr cloud instance with role-specific
    name and description burned into the platform — making each agent's identity
    more prominent in Lyzr's studio UI and telemetry.

    Trade-off vs shared agent (ADR-012):
    - PRO: Each agent has its own Lyzr identity (better demo narrative, better
      observability in Lyzr Studio, role-specific fine-tuning possible later).
    - CON: 4× startup API calls (slower cold start), 4× Lyzr agent quota usage.
    - VERDICT for hackathon: only worthwhile if the judge visits studio.lyzr.ai
      during the demo to see 4 distinct agents. Otherwise shared agent is simpler.
    Enable via LYZR_ENABLED=true LYZR_PER_AGENT=true in .env.

    Raises RuntimeError if lyzr-adk is not installed.
    """
    if not LYZR_AVAILABLE:
        raise RuntimeError("lyzr-adk is not installed. Run: pip install lyzr-adk")

    studio = Studio(api_key=api_key, log="warning")

    _AGENT_CONFIGS = {
        "interceptor": {
            "name": "clarity_interceptor",
            "description": "Message Intelligence Analyst for Workplace Proxy.",
            "role": "Workplace Message Analyst",
            "goal": "Produce complete structural analysis of every incoming message.",
            "instructions": (
                "You are the Interceptor (Agent 1) in Workplace Proxy. "
                "Extract vague phrases, implicit signals, and key references from messages. "
                "Always respond in strict JSON format as specified in each prompt."
            ),
        },
        "contextualizer": {
            "name": "clarity_contextualizer",
            "description": "Corporate Language Decoder for Workplace Proxy.",
            "role": "Corporate Context Specialist",
            "goal": "Decode vague corporate language into concrete, unambiguous meaning.",
            "instructions": (
                "You are the Contextualizer (Agent 2) in Workplace Proxy. "
                "Resolve vague references using company knowledge. "
                "Decode implicit urgency. Always respond in strict JSON format."
            ),
        },
        "scheduler": {
            "name": "clarity_scheduler",
            "description": "Temporal Realism Enforcer for Workplace Proxy.",
            "role": "Task Scheduling Specialist",
            "goal": "Propose realistic deadlines and calendar slots — never vague time words.",
            "instructions": (
                "You are the Scheduler (Agent 3) in Workplace Proxy. "
                "Convert urgency levels into concrete deadlines and duration estimates. "
                "Always respond in strict JSON format as specified in each prompt."
            ),
        },
        "translator": {
            "name": "clarity_translator",
            "description": "Neurodivergent Communication Specialist (The Twin) for Workplace Proxy.",
            "role": "Clarity Communication Specialist",
            "goal": "Produce explicit, unambiguous task translations tailored to the user's cognitive needs.",
            "instructions": (
                "You are the Translator / Twin (Agent 4) in Workplace Proxy. "
                "Rewrite decoded messages as structured tasks in the user's preferred format. "
                "Always respond in strict JSON format as specified in each prompt."
            ),
        },
    }

    backends: dict[str, LyzrBackend] = {}
    for agent_name, config in _AGENT_CONFIGS.items():
        agent: Any = await studio.acreate_agent(
            **config,
            provider=f"google/{model}",
            llm_credential_id="lyzr_google",
            store_messages=False,
            temperature=0.3,
        )
        backends[agent_name] = LyzrBackend(agent)
        logger.info(
            "lyzr_per_agent_backend_created",
            agent=agent_name,
            lyzr_name=config["name"],
        )

    return backends


async def create_lyzr_backend(api_key: str, model: str) -> LyzrBackend:
    """
    Async factory: create one Lyzr cloud agent and return a LyzrBackend wrapping it.

    Called once at startup by llm.backend.create_backend() when LYZR_ENABLED=true.
    The resulting LyzrBackend is shared across all four Workplace Proxy agents.

    Raises RuntimeError if lyzr-adk is not installed.
    Propagates any lyzr SDK exception (network failure, bad API key, etc.) so the
    caller (main.py lifespan) can decide to fall back to GoogleBackend.
    """
    if not LYZR_AVAILABLE:
        raise RuntimeError(
            "lyzr-adk is not installed. Run: pip install lyzr-adk"
        )

    studio = Studio(api_key=api_key, log="warning")
    agent: Any = await studio.acreate_agent(
        name="project_clarity_orchestrator",
        description=(
            "Multi-agent orchestration backend for Workplace Proxy. Processes vague "
            "workplace messages through specialized AI agent personas to help "
            "neurodivergent professionals understand what is being asked of them."
        ),
        role="Multi-Agent Communication Specialist",
        goal=(
            "Execute the instructions provided in each message exactly, "
            "responding in the exact JSON or text format specified."
        ),
        instructions=(
            "You are a specialist AI backing Workplace Proxy's multi-agent pipeline. "
            "Each message you receive begins with a PERSONA section (your role for this call) "
            "followed by the actual task. Follow the persona instructions precisely. "
            "Always respond in the exact output format described in the persona."
        ),
        provider=f"google/{model}",
        llm_credential_id="lyzr_google",
        store_messages=False,
        temperature=0.3,
    )

    logger.info(
        "lyzr_backend_created",
        provider=f"google/{model}",
        agent_name="project_clarity_orchestrator",
    )
    return LyzrBackend(agent)
