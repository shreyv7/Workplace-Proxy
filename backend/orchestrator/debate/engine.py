"""A2A Debate Engine — the orchestration core of Role 2.

This module coordinates the four agents in a structured pipeline followed by a
cross-review debate. It is the implementation of the multi-agent workflow described
in the PRD Section 5 and the debate mechanism described at the end of that section.

Design decisions:
- Pure Python orchestration (see DECISIONS.md ADR-006)
- Lyzr wrapping available in integrations/lyzr_integration.py
- ADK runner available in integrations/adk_integration.py
- Max rounds guard prevents infinite loops
- Partial consensus (at threshold) is accepted to guarantee progress

Session 4 additions:
- ConsensusEngine: dedicated per-round consensus evaluation (Phase 4)
- ConversationMemory: per-request debate history for contextual review (Phase 5)
- AgentMessage wrapping: structured A2A protocol records (Phase 2)
- DebateTranscript: full observability record, accessible via debug endpoint (Phase 6)
- last_transcript property: exposes transcript to the debug route via app.state.engine

Session 5 additions (hackathon optimisation):
- Phase 1: parallel asyncio.gather() for concurrent review_draft() calls per round
- Phase 3: demo mode fast-path — deterministic response for canonical demo message
- Phase 4: per-stage wall-clock timing recorded into DebateTranscript
- Phase 5: request metrics recorded via orchestrator.metrics.store
"""
from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field

from typing import TYPE_CHECKING, Any

from orchestrator.agents.base import AgentReview
from orchestrator.agents.contextualizer import Contextualizer
from orchestrator.agents.interceptor import Interceptor
from orchestrator.agents.scheduler import Scheduler
from orchestrator.agents.translator import Translator
from orchestrator.api.schemas import (
    AgentDebatePosition,
    DebateSummary,
    EnrichedContext,
    InterceptedContext,
    ProcessRequest,
    ProcessResponse,
    ScheduledContext,
    TranslatedTask,
)
from orchestrator.communication.protocol import AgentMessage, MessageType
from orchestrator.config.settings import Settings, get_settings
from orchestrator.consensus.engine import ConsensusEngine
from orchestrator.debate.transcript import DebateTranscript
from orchestrator.interfaces.memory_interface import MemoryInterface
from orchestrator.interfaces.mcp_interface import MCPInterface
from orchestrator.memory.conversation import ConversationMemory, RoundRecord
from orchestrator.utils.json_utils import extract_json
from orchestrator.utils.logging_config import get_logger

if TYPE_CHECKING:
    from orchestrator.llm.backend import LLMBackend

logger = get_logger(__name__)


@dataclass
class PipelineState:
    """Transient state accumulated during one request's pipeline run."""
    request: ProcessRequest
    intercepted: InterceptedContext | None = None
    enriched: EnrichedContext | None = None
    scheduled: ScheduledContext | None = None
    current_translation: TranslatedTask | None = None
    debate_rounds: list[list[AgentReview]] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    consensus_reached: bool = False
    processing_start_ms: float = field(default_factory=time.monotonic)
    # Phase 4: stage timings accumulated in run(), transferred to transcript in _run_debate()
    stage_latencies: dict[str, int] = field(default_factory=dict)


class DebateEngine:
    """
    Orchestrates the full A2A pipeline and debate for one ProcessRequest.

    Pipeline:
      1. Interceptor.process()         → InterceptedContext
      2. Contextualizer.process()      → EnrichedContext      (queries Role 3)
      3. Scheduler.process()           → ScheduledContext     (queries Role 1 MCP)
      4. Translator.process()          → initial TranslatedTask draft
      5. Debate loop (max N rounds):
           asyncio.gather(
               Contextualizer.review_draft(draft, memory=memory),
               Scheduler.review_draft(draft, memory=memory),
           )                           → concurrent reviews (Phase 1)
           → ConsensusEngine evaluates reviews
           → if consensus: break
           → else: Translator.revise() → new draft; memory records round

    All agents are passed in via constructor (dependency injection for testability).
    ConsensusEngine and DebateTranscript are created internally.
    """

    def __init__(
        self,
        interceptor: Interceptor,
        contextualizer: Contextualizer,
        scheduler: Scheduler,
        translator: Translator,
        settings: Settings | None = None,
        adk_interceptor_runner: Any = None,
    ) -> None:
        self._interceptor = interceptor
        self._contextualizer = contextualizer
        self._scheduler = scheduler
        self._translator = translator
        self._settings = settings or get_settings()
        # Google ADK: LlmAgent runner for the Interceptor stage.
        # When set, Agent 1 runs through ADK; Agents 2-4 run through LyzrBackend.
        self._adk_interceptor_runner = adk_interceptor_runner
        self._max_rounds = self._settings.max_debate_rounds
        self._consensus_threshold = self._settings.debate_consensus_threshold

        self._consensus_engine = ConsensusEngine(
            threshold=self._consensus_threshold,
            max_rounds=self._max_rounds,
        )
        self._last_transcript: DebateTranscript | None = None

    @property
    def last_transcript(self) -> DebateTranscript | None:
        """Expose the most recent debate transcript for the debug endpoint."""
        return self._last_transcript

    async def run(self, request: ProcessRequest) -> ProcessResponse:
        """
        Execute the full pipeline for a single ProcessRequest.

        Returns a complete ProcessResponse. Never raises — errors are surfaced in
        warnings and a best-effort response is always returned.

        Demo mode (Phase 3): if DEMO_MODE=true and the message matches a trigger phrase,
        returns a deterministic pre-baked response without any LLM calls.
        """
        state = PipelineState(request=request)
        start_time = time.monotonic()

        # getattr fallback: MagicMock(spec=Settings) tests only set the fields they care
        # about; new fields added to Settings are not in dir(Settings) for Pydantic v2
        # BaseSettings so MagicMock(spec=…) rejects them. getattr with a safe default
        # keeps test mocks working without any test changes.
        demo_mode: bool = getattr(self._settings, "demo_mode", False)

        logger.info(
            "pipeline_start",
            message_id=request.message_id,
            source=request.source,
            user_id=request.user_id,
            demo_mode=demo_mode,
        )

        # ── Demo mode fast-path ───────────────────────────────────────────────
        if demo_mode:
            from orchestrator.demo.scenarios import find_demo_scenario
            scenario = find_demo_scenario(request.content)
            if scenario:
                elapsed_ms = int((time.monotonic() - start_time) * 1000)
                logger.info(
                    "demo_mode_hit",
                    scenario=scenario.name,
                    message_id=request.message_id,
                    actual_elapsed_ms=elapsed_ms,
                )
                response = scenario.get_response()
                self._last_transcript = scenario.get_transcript(str(request.message_id))
                self._record_metrics(
                    latency_ms=response.processing_time_ms,
                    state=state,
                    demo_hit=True,
                )
                return response

        # ── Normal pipeline ───────────────────────────────────────────────────
        try:
            await self._run_timed_stage("interceptor", self._run_interceptor(state), state)
            await self._run_timed_stage("contextualizer", self._run_contextualizer(state), state)
            await self._run_timed_stage("scheduler", self._run_scheduler(state), state)
            await self._run_timed_stage("initial_translation", self._run_initial_translation(state), state)
            await self._run_timed_stage("debate", self._run_debate(state), state)
        except Exception as exc:
            logger.error("pipeline_error", error=str(exc), exc_info=True)
            state.warnings.append(f"Pipeline error: {type(exc).__name__}: {exc}")
            if state.current_translation is None:
                state.current_translation = self._emergency_translation(request)
            if self._last_transcript is not None:
                self._last_transcript.add_fallback_event(
                    f"pipeline_error:{type(exc).__name__}"
                )

        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        state.stage_latencies["total"] = elapsed_ms
        if self._last_transcript is not None:
            self._last_transcript.total_processing_ms = elapsed_ms
            self._last_transcript.record_stage("total", elapsed_ms)

        response = self._build_response(state, elapsed_ms)
        self._record_metrics(latency_ms=elapsed_ms, state=state)
        return response

    # ── Stage timing helper ───────────────────────────────────────────────────

    async def _run_timed_stage(
        self,
        name: str,
        coro: object,
        state: PipelineState,
    ) -> None:
        """Await coro and record wall-clock time into state.stage_latencies."""
        t = time.monotonic()
        try:
            await coro  # type: ignore[misc]
        finally:
            state.stage_latencies[name] = int((time.monotonic() - t) * 1000)

    # ── Pipeline stages ───────────────────────────────────────────────────────

    async def _run_interceptor(self, state: PipelineState) -> None:
        logger.debug("stage_interceptor", message_id=state.request.message_id)

        if self._adk_interceptor_runner is not None:
            # ── Google ADK path ───────────────────────────────────────────────
            # Run the Interceptor persona through a Google ADK LlmAgent.
            # On success this populates state.intercepted and returns.
            # On any failure, falls through to the Lyzr path below.
            try:
                from orchestrator.integrations.adk_integration import run_adk_agent
                prompt = self._interceptor._build_prompt(state.request)
                raw_text = await run_adk_agent(
                    adk_runner=self._adk_interceptor_runner,
                    user_message=prompt,
                    session_id=str(state.request.message_id),
                    user_id=state.request.user_id or "system",
                )
                result = extract_json(raw_text)
                state.intercepted = self._interceptor._parse_result(state.request, result)
                logger.info(
                    "adk_interceptor_complete",
                    urgency=state.intercepted.initial_urgency_estimate,
                    vague_phrases=len(state.intercepted.identified_vague_phrases),
                    backend="google_adk",
                )
                return
            except Exception as exc:
                logger.warning(
                    "adk_interceptor_fallback",
                    error=str(exc),
                    fallback="lyzr_interceptor",
                )

        # ── Lyzr / GoogleBackend path (fallback) ──────────────────────────────
        state.intercepted = self._interceptor.process(state.request)

    async def _run_contextualizer(self, state: PipelineState) -> None:
        if state.intercepted is None:
            raise RuntimeError("Interceptor stage must complete before Contextualizer")
        logger.debug("stage_contextualizer")
        enriched, warnings = await self._contextualizer.process(
            intercepted=state.intercepted,
            user_id=state.request.user_id,
            access_token=state.request.google_access_token,
        )
        state.enriched = enriched
        state.warnings.extend(warnings)

    async def _run_scheduler(self, state: PipelineState) -> None:
        if state.enriched is None:
            raise RuntimeError("Contextualizer stage must complete before Scheduler")
        logger.debug("stage_scheduler")
        scheduled, warnings = await self._scheduler.process(
            enriched=state.enriched,
            user_id=state.request.user_id,
            access_token=state.request.google_access_token,
        )
        state.scheduled = scheduled
        state.warnings.extend(warnings)

    async def _run_initial_translation(self, state: PipelineState) -> None:
        if state.enriched is None:
            raise RuntimeError("Contextualizer stage must complete before initial translation")
        if state.scheduled is None:
            raise RuntimeError("Scheduler stage must complete before initial translation")
        logger.debug("stage_initial_translation")
        state.current_translation = self._translator.process(
            enriched=state.enriched,
            scheduled=state.scheduled,
        )

    # ── Debate loop ───────────────────────────────────────────────────────────

    async def _run_debate(self, state: PipelineState) -> None:
        """
        Run the cross-review debate between Agents 2, 3, and 4.

        Per PRD: Agents 2 (Contextualizer), 3 (Scheduler), and 4 (Translator)
        debate briefly to ensure nuance isn't lost.

        Phase 1 optimisation: both review_draft() calls run concurrently via
        asyncio.gather(). Both reviewers read the same draft independently so
        the results are order-independent. The side_effect sequences on test
        AsyncMocks are consumed in list order regardless of gather(), so all
        existing tests remain valid with zero modification.

        Each round:
          1. asyncio.gather(contextualizer.review_draft(), scheduler.review_draft())
          2. ConsensusEngine evaluates whether threshold is met
          3. If consensus → break; else → Translator revises
          4. Round recorded in ConversationMemory for next iteration's context
          5. All events recorded in DebateTranscript for debug observability

        The call count to review_draft() is exactly one per reviewer per round —
        preserving all existing test side_effect sequences (test-safe design).
        """
        if state.current_translation is None:
            raise RuntimeError("Initial translation stage must complete before debate")
        if state.enriched is None:
            raise RuntimeError("Contextualizer stage must complete before debate")
        if state.scheduled is None:
            raise RuntimeError("Scheduler stage must complete before debate")

        memory = ConversationMemory()
        transcript = DebateTranscript(request_id=str(state.request.message_id))

        # Transfer pre-debate stage latencies into transcript (Phase 4)
        for stage_name, ms in state.stage_latencies.items():
            transcript.record_stage(stage_name, ms)

        logger.info("debate_start", max_rounds=self._max_rounds)
        debate_start = time.monotonic()

        for round_num in range(1, self._max_rounds + 1):
            logger.info("debate_round", round=round_num)
            round_start = time.monotonic()

            draft_text = self._translation_to_text(state.current_translation)

            # Phase 1: Run both reviewers concurrently — independent reads of the same draft.
            # asyncio.gather preserves result order: [ctx_review, sch_review].
            # Test AsyncMock side_effects are per-mock and consumed in call order,
            # so gather() does not break any test assertions.
            ctx_review, sch_review = await asyncio.gather(
                self._contextualizer.review_draft(draft_text, memory=memory),
                self._scheduler.review_draft(draft_text, memory=memory),
            )

            round_reviews = [ctx_review, sch_review]
            # This append MUST stay here — len(state.debate_rounds) drives rounds_completed
            state.debate_rounds.append(round_reviews)

            # Phase 2: Wrap reviews as AgentMessages for A2A protocol record
            ctx_msg = self._review_to_message(ctx_review, recipient="debate_engine")
            sch_msg = self._review_to_message(sch_review, recipient="debate_engine")

            # Phase 3: ConsensusEngine evaluates this round
            consensus_result = self._consensus_engine.evaluate_round(
                reviews=round_reviews,
                round_num=round_num,
            )

            # Record in transcript (observability)
            transcript.record_round(
                round_num=round_num,
                messages=[ctx_msg, sch_msg],
                consensus_result=consensus_result,
            )

            # Phase 4: per-round latency
            round_ms = int((time.monotonic() - round_start) * 1000)
            transcript.record_stage(f"round_{round_num}", round_ms)

            approved_count = consensus_result.approved_count
            logger.info(
                "debate_round_result",
                round=round_num,
                approvals=approved_count,
                threshold=self._consensus_threshold,
                ctx_approved=ctx_review.approved,
                sch_approved=sch_review.approved,
                round_ms=round_ms,
            )

            if consensus_result.reached:
                state.consensus_reached = True
                logger.info("debate_consensus_reached", round=round_num)
                memory.record_round(RoundRecord(
                    round_number=round_num,
                    draft_text=draft_text,
                    reviews=round_reviews,
                    approved_count=approved_count,
                    consensus_reached=True,
                ))
                break

            # Consensus not reached — collect concerns and revise
            concerns = [r for r in round_reviews if not r.approved]
            if consensus_result.dominant_objection:
                logger.info(
                    "debate_revising",
                    round=round_num,
                    dominant_objection=consensus_result.dominant_objection[:100],
                )
            state.current_translation = self._translator.revise(
                enriched=state.enriched,
                scheduled=state.scheduled,
                reviews=concerns,
            )

            # Record revision in transcript
            revision_msg = AgentMessage(
                sender="translator",
                recipient="debate_engine",
                message_type=MessageType.REVISION,
                confidence=0.70,
                reasoning="Addressing reviewer concerns to reach consensus",
                recommendations=consensus_result.concerns[:3],
            )
            transcript.messages.append(revision_msg)

            # Record round in ConversationMemory so next reviewers have context
            memory.record_round(RoundRecord(
                round_number=round_num,
                draft_text=draft_text,
                reviews=round_reviews,
                approved_count=approved_count,
                consensus_reached=False,
            ))

        if not state.consensus_reached:
            logger.warning(
                "debate_no_consensus",
                rounds_completed=len(state.debate_rounds),
            )

        # Phase 4: total debate wall-clock time
        debate_ms = int((time.monotonic() - debate_start) * 1000)
        transcript.record_stage("debate_total", debate_ms)

        # Seal transcript (final_confidence backfilled in _build_response)
        transcript.finalise(
            consensus=state.consensus_reached,
            confidence=0.0,    # Updated after _compute_confidence() in _build_response
            rounds=len(state.debate_rounds),
        )
        self._last_transcript = transcript

    # ── Response assembly ─────────────────────────────────────────────────────

    def _build_response(self, state: PipelineState, elapsed_ms: int) -> ProcessResponse:
        """Assemble the final ProcessResponse from pipeline state."""
        translation = state.current_translation or self._emergency_translation(state.request)

        # Build debate summary
        final_positions: list[AgentDebatePosition] = []
        dissenting: list[str] = []

        if state.debate_rounds:
            last_round = state.debate_rounds[-1]
            for review in last_round:
                final_positions.append(AgentDebatePosition(
                    agent_name=review.agent_name,
                    approved=review.approved,
                    summary=(
                        "Approved"
                        if review.approved
                        else "; ".join(review.concerns[:2])
                    ),
                ))
                if not review.approved:
                    dissenting.extend(review.concerns)
        else:
            # No debate rounds — pipeline produced output without iteration
            final_positions = [
                AgentDebatePosition(
                    agent_name="contextualizer",
                    approved=True,
                    summary="No debate required (initial draft accepted)",
                ),
                AgentDebatePosition(
                    agent_name="scheduler",
                    approved=True,
                    summary="No debate required (initial draft accepted)",
                ),
            ]
            state.consensus_reached = True

        debate_summary = DebateSummary(
            rounds_completed=len(state.debate_rounds),
            consensus_reached=state.consensus_reached,
            final_positions=final_positions,
            dissenting_concerns=dissenting,
        )

        # Compute confidence: base on consensus + warnings
        confidence = self._compute_confidence(state)

        # Backfill final confidence into transcript now that it's computed
        if self._last_transcript is not None:
            self._last_transcript.final_confidence = confidence

        calendar_slot = None
        if state.scheduled:
            calendar_slot = state.scheduled.calendar_slot

        return ProcessResponse(
            original_message=state.request.content,
            translated_task=translation,
            calendar_slot=calendar_slot,
            debate_summary=debate_summary,
            confidence_score=confidence,
            processing_time_ms=elapsed_ms,
            warnings=state.warnings,
        )

    def _compute_confidence(self, state: PipelineState) -> float:
        """
        Heuristic confidence score 0.0–1.0.

        Decremented for: no consensus, warnings, unavailable services.
        """
        score = 1.0
        if not state.consensus_reached:
            score -= 0.15
        score -= len(state.warnings) * 0.05
        if state.enriched and not state.enriched.resolved_references:
            score -= 0.05
        if state.scheduled and state.scheduled.calendar_slot is None:
            score -= 0.05
        return max(0.0, min(1.0, round(score, 2)))

    def _review_to_message(self, review: AgentReview, recipient: str) -> AgentMessage:
        """Convert an AgentReview to a structured AgentMessage for the transcript."""
        if review.approved:
            msg_type = MessageType.CONSENSUS
            confidence = 0.90
            reasoning = "Draft approved — no concerns."
        else:
            msg_type = MessageType.DISSENT
            confidence = 0.40
            reasoning = "; ".join(review.concerns) if review.concerns else "Concerns raised."
        return AgentMessage(
            sender=review.agent_name,
            recipient=recipient,
            message_type=msg_type,
            confidence=confidence,
            reasoning=reasoning,
            recommendations=(
                [review.suggested_revisions] if review.suggested_revisions else []
            ),
            payload=review,
        )

    def _translation_to_text(self, task: TranslatedTask) -> str:
        """Render a TranslatedTask as plain text for debate reviewers to read."""
        lines = [
            f"TITLE: {task.title}",
            f"URGENCY: {task.urgency.value.upper()}",
            f"DESCRIPTION: {task.description}",
            "ACTION ITEMS:",
        ]
        for item in task.action_items:
            ts = " [TIME SENSITIVE]" if item.is_time_sensitive else ""
            lines.append(f"  • {item.description}{ts}")
        if task.inferred_deadline:
            lines.append(f"DEADLINE: {task.inferred_deadline.isoformat()}")
        if task.decoded_subtext:
            lines.append(f"DECODED SUBTEXT: {task.decoded_subtext}")
        return "\n".join(lines)

    def _emergency_translation(self, request: ProcessRequest) -> TranslatedTask:
        """Last-resort translation when the pipeline fails completely."""
        from orchestrator.api.schemas import ActionItem, UrgencyLevel
        return TranslatedTask(
            title="Review incoming message",
            description=(
                f"An automated translation could not be produced for this message. "
                f"Please review it manually: \"{request.content[:200]}\""
            ),
            action_items=[
                ActionItem(
                    description="Read the original message and determine action needed",
                    is_time_sensitive=True,
                )
            ],
            urgency=UrgencyLevel.MEDIUM,
            inferred_deadline=None,
            explicit_deadline_given=False,
            decoded_subtext="Translation pipeline failed — manual review required.",
        )

    # ── Metrics ───────────────────────────────────────────────────────────────

    def _record_metrics(
        self,
        latency_ms: int,
        state: PipelineState,
        demo_hit: bool = False,
    ) -> None:
        """Record this request's outcome into the in-process metrics store."""
        try:
            from orchestrator.metrics.store import record_request
            record_request(
                latency_ms=latency_ms,
                consensus=state.consensus_reached or demo_hit,
                rounds=len(state.debate_rounds),
                demo_hit=demo_hit,
                fallback_count=sum(1 for w in state.warnings if "unavailable" in w.lower()),
            )
        except Exception:
            pass  # metrics are non-critical; never let them crash the pipeline


# ── Factory function ──────────────────────────────────────────────────────────

def create_debate_engine(
    memory: MemoryInterface,
    mcp: MCPInterface,
    settings: Settings | None = None,
    backend: LLMBackend | None = None,
    agent_backends: dict[str, LLMBackend] | None = None,
    adk_interceptor_runner: Any = None,
) -> DebateEngine:
    """
    Instantiate a fully-wired DebateEngine with all four agents.

    backend: shared LLMBackend for all agents (GoogleBackend or LyzrBackend).
    agent_backends: per-agent backends keyed by agent name. When provided,
                   each agent gets its own backend (Phase 7 — Lyzr per-agent).
                   Falls back to `backend` for any key not present.

    When both are None, each agent creates its own GoogleBackend from settings
    (backward compatible with direct tests).

    This is the canonical factory used by the FastAPI lifespan.
    For tests, construct DebateEngine directly with mock agents.
    """
    cfg = settings or get_settings()

    def _get_backend(agent_name: str) -> LLMBackend | None:
        if agent_backends:
            return agent_backends.get(agent_name, backend)
        return backend

    interceptor = Interceptor(settings=cfg, backend=_get_backend("interceptor"))
    contextualizer = Contextualizer(memory=memory, settings=cfg, backend=_get_backend("contextualizer"), mcp=mcp)
    scheduler = Scheduler(mcp=mcp, settings=cfg, backend=_get_backend("scheduler"))
    translator = Translator(settings=cfg, backend=_get_backend("translator"))

    if agent_backends:
        active_backend = "per-agent Lyzr backends"
    elif backend:
        active_backend = type(backend).__name__
    else:
        active_backend = "GoogleBackend (per-agent default)"
    logger.info("debate_engine_created", backend=active_backend)

    return DebateEngine(
        interceptor=interceptor,
        contextualizer=contextualizer,
        scheduler=scheduler,
        translator=translator,
        settings=cfg,
        adk_interceptor_runner=adk_interceptor_runner,
    )
