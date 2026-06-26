"""Pre-baked demo scenarios for DEMO_MODE=true.

When DEMO_MODE is enabled and a request message matches a trigger phrase,
the DebateEngine returns a deterministic, high-quality response instead of
running the full LLM pipeline.

Design decisions:
  - Scenarios are objects with a get_response() method so
    dates are computed relative to "now" at call time — always realistic.
  - Supports 4 scenarios matching all dashboard inputs:
    1. Alice Johnson canonical check-in
    2. Boss Tom Slack staging configuration check
    3. External Client email roadmap sync invitation
    4. Sprint Triage / Priya QA Jira ticket
  - Demo mode short-circuits the pipeline entirely; no LLM calls are made.
  - The returned response is indistinguishable from a real pipeline output.
  - Trigger matching is case-insensitive substring search for robustness.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from orchestrator.api.schemas import (
    ActionItem,
    AgentDebatePosition,
    BlockType,
    CalendarSlot,
    DebateSummary,
    ProcessResponse,
    TranslatedTask,
    UrgencyLevel,
)
from orchestrator.communication.protocol import AgentMessage, MessageType
from orchestrator.debate.transcript import ConfidencePoint, DebateTranscript


@dataclass
class DemoScenario:
    """A named demo scenario with trigger phrases and a factory for its response."""
    name: str
    trigger_phrases: list[str]  # all lowercase; any one hit activates this scenario
    original_message: str
    title: str
    description: str
    action_items: list[dict]  # dicts with description and is_time_sensitive
    urgency: UrgencyLevel
    decoded_subtext: str
    duration_minutes: int
    block_type: BlockType
    rationale: str
    debate_rounds: int
    confidence_score: float
    processing_time_ms: int
    final_positions: list[dict]  # dicts with agent_name and summary
    dissent_rounds: list[dict] = None  # optional round 1 messages

    def matches(self, message: str) -> bool:
        low = message.lower()
        return any(phrase in low for phrase in self.trigger_phrases)

    def get_response(self) -> ProcessResponse:
        """Build a realistic ProcessResponse for this scenario at the time of calling."""
        now = datetime.now(tz=timezone.utc)

        # Inferred deadline: EOD today (18:00 UTC), unless it's past 16:00 in which case +2h
        eod = now.replace(hour=18, minute=0, second=0, microsecond=0)
        if eod <= now:
            eod = now + timedelta(hours=2)

        # Calendar slot: tomorrow morning 09:00–09:30 or later today
        tomorrow_0900 = (now + timedelta(days=1)).replace(
            hour=9, minute=0, second=0, microsecond=0
        )
        suggested_start = tomorrow_0900 if self.block_type == BlockType.SHALLOW_WORK else now + timedelta(hours=1)

        actions = [
            ActionItem(
                description=item["description"],
                is_time_sensitive=item["is_time_sensitive"]
            )
            for item in self.action_items
        ]

        final_pos_objects = [
            AgentDebatePosition(
                agent_name=pos["agent_name"],
                approved=True,
                summary=pos["summary"]
            )
            for pos in self.final_positions
        ]

        return ProcessResponse(
            original_message=self.original_message,
            translated_task=TranslatedTask(
                title=self.title,
                description=self.description,
                action_items=actions,
                urgency=self.urgency,
                inferred_deadline=eod,
                explicit_deadline_given=False,
                decoded_subtext=self.decoded_subtext,
            ),
            calendar_slot=CalendarSlot(
                suggested_start=suggested_start,
                suggested_end=suggested_start + timedelta(minutes=self.duration_minutes),
                duration_minutes=self.duration_minutes,
                block_type=self.block_type,
                rationale=self.rationale,
            ),
            debate_summary=DebateSummary(
                rounds_completed=self.debate_rounds,
                consensus_reached=True,
                final_positions=final_pos_objects,
                dissenting_concerns=[],
            ),
            confidence_score=self.confidence_score,
            processing_time_ms=self.processing_time_ms,
            warnings=[],
        )

    def get_transcript(self, request_id: str) -> DebateTranscript:
        """Build a plausible DebateTranscript for this scenario."""
        now = datetime.now(tz=timezone.utc)
        transcript = DebateTranscript(
            request_id=request_id,
            started_at=now,
        )
        
        # Latency metrics
        t_stage = self.processing_time_ms // 6
        transcript.record_stage("interceptor", t_stage)
        transcript.record_stage("contextualizer", t_stage + 50)
        transcript.record_stage("scheduler", t_stage - 30)
        transcript.record_stage("initial_translation", t_stage - 10)
        
        for r in range(1, self.debate_rounds + 1):
            transcript.record_stage(f"round_{r}", t_stage + 10)
            
        transcript.record_stage("debate_total", t_stage * self.debate_rounds)
        transcript.record_stage("total", self.processing_time_ms)

        # Inject Messages
        if self.dissent_rounds and self.debate_rounds > 1:
            for dis in self.dissent_rounds:
                msg = AgentMessage(
                    sender=dis["sender"],
                    recipient="debate_engine",
                    message_type=MessageType.DISSENT,
                    confidence=dis.get("confidence", 0.45),
                    reasoning=dis["reasoning"],
                    recommendations=dis.get("recommendations", []),
                )
                transcript.messages.append(msg)
        
        # Round 2 / Final Round Consensus Messages
        for pos in self.final_positions:
            msg = AgentMessage(
                sender=pos["agent_name"],
                recipient="debate_engine",
                message_type=MessageType.CONSENSUS,
                confidence=self.confidence_score,
                reasoning=pos["summary"],
                recommendations=[],
            )
            transcript.messages.append(msg)

        # Confidence History
        history = []
        for r in range(1, self.debate_rounds + 1):
            is_last = (r == self.debate_rounds)
            history.append(
                ConfidencePoint(
                    round_number=r,
                    score=self.confidence_score if is_last else 0.40,
                    approved_count=2 if is_last else 1,
                    reached_consensus=is_last
                )
            )
        transcript.confidence_history = history

        transcript.finalise(
            consensus=True,
            confidence=self.confidence_score,
            rounds=self.debate_rounds
        )
        transcript.total_processing_ms = self.processing_time_ms
        return transcript


# ── Registered scenarios ──────────────────────────────────────────────────────

_SCENARIOS: list[DemoScenario] = [
    # 1. Canonical Alice Johnson Scenario
    DemoScenario(
        name="alice_no_rush",
        trigger_phrases=["on track", "the thing"],
        original_message="Hey, are we still on track for the thing? No rush.",
        title="Status Update Required: Q2 Customer Demo",
        description=(
            "Your Engineering Manager is checking on the Q2 Customer Demo progress. "
            "Despite the 'no rush' phrasing, this carries HIGH urgency — managers "
            "use softening language to avoid seeming demanding, but this check-in "
            "signals they are actively monitoring the timeline. A clear, specific "
            "status response is expected today."
        ),
        action_items=[
            {
                "description": "Prepare a status summary: % complete, current blockers, and your confidence in the timeline",
                "is_time_sensitive": True
            },
            {
                "description": "Review your sprint board before responding to ensure accuracy",
                "is_time_sensitive": True
            },
            {
                "description": "Reply to Alice today — do not wait until tomorrow; delayed responses increase manager anxiety",
                "is_time_sensitive": True
            }
        ],
        urgency=UrgencyLevel.HIGH,
        decoded_subtext=(
            "'No rush' is social softening. Your manager is checking because "
            "they need confidence in the demo timeline. Respond with specifics: "
            "percentage complete, what remains, and whether you're on track. "
            "A vague reply will increase their concern."
        ),
        duration_minutes=30,
        block_type=BlockType.SHALLOW_WORK,
        rationale=(
            "Shallow-work block tomorrow morning for preparing a detailed status "
            "document. Send Alice an initial reply today; use this block for a "
            "thorough follow-up with supporting data."
        ),
        debate_rounds=2,
        confidence_score=0.94,
        processing_time_ms=2847,
        final_positions=[
            {
                "agent_name": "contextualizer",
                "summary": "Urgency correctly decoded as HIGH. 'No rush' from a senior manager before a key deliverable maps to urgency level HIGH based on sender history and role."
            },
            {
                "agent_name": "scheduler",
                "summary": "EOD response deadline appropriate. Tomorrow 09:00 block provides structured preparation time without missing today's communication window."
            }
        ],
        dissent_rounds=[
            {
                "sender": "contextualizer",
                "reasoning": "Draft does not convey HIGH urgency sufficiently. 'No rush' decoded as HIGH based on sender's role and prior communication patterns, but the draft title uses MEDIUM framing.",
                "recommendations": ["Escalate urgency label to HIGH in the title", "Add explicit 'respond today' directive in action items"]
            }
        ]
    ),
    
    # 2. Slack Boss Tom Scenario
    DemoScenario(
        name="slack_boss_tom",
        trigger_phrases=["staging configurations", "double check", "deployment checklist"],
        original_message="Hey, can you double check the staging configurations whenever you have a minute? Also check the deployment checklist.",
        title="Verification: Staging Configurations & Deploy Checklist",
        description=(
            "Tom (Engineering Lead) is asking for verification of staging config files "
            "and deployment procedures. 'Whenever you have a minute' from Tom actually "
            "indicates high priority for today to avoid delaying tomorrow's release window. "
            "Coordination with the infrastructure team is required."
        ),
        action_items=[
            {
                "description": "Validate config parameters on staging server",
                "is_time_sensitive": True
            },
            {
                "description": "Review the active deployment checklist for outstanding items",
                "is_time_sensitive": True
            },
            {
                "description": "Coordinate config validation with the infrastructure team in #infra Slack",
                "is_time_sensitive": True
            }
        ],
        urgency=UrgencyLevel.HIGH,
        decoded_subtext=(
            "'Whenever you have a minute' from Tom is a high-priority request. "
            "Tom uses hedging language to soften priority, but release checks "
            "must be verified today to keep staging deployment on schedule."
        ),
        duration_minutes=30,
        block_type=BlockType.SHALLOW_WORK,
        rationale=(
            "Protected shallow-work block scheduled this afternoon to verify staging "
            "configurations and collaborate with the infra team before EOD."
        ),
        debate_rounds=2,
        confidence_score=0.96,
        processing_time_ms=2100,
        final_positions=[
            {
                "agent_name": "contextualizer",
                "summary": "Urgency is HIGH. Staging checks block the staging branch release. Tom's communication pattern shows 'whenever you get a chance' from him means today."
            },
            {
                "agent_name": "scheduler",
                "summary": "Scheduled for late afternoon. Staging test must happen first, and infra coordination takes 30 mins."
            }
        ],
        dissent_rounds=[
            {
                "sender": "contextualizer",
                "reasoning": "Initial draft treated this as Low/Medium urgency. Needs to be High priority because it is a release blocker. Release processes require staging branch verification.",
                "recommendations": ["Escalate urgency to HIGH", "Propose immediate shallow work block"]
            }
        ]
    ),
    
    # 3. Email Roadmap Alignment Scenario
    DemoScenario(
        name="email_external_client",
        trigger_phrases=["roadmap alignment", "alignment call", "available sometime tomorrow"],
        original_message="Hi, following up on our roadmap alignment call. Are you available sometime tomorrow around 3 PM?",
        title="Client Sync: Northwind Roadmap Alignment",
        description=(
            "External client is requesting a 30-minute sync tomorrow at 3 PM for the "
            "Northwind roadmap alignment. The request is medium priority, but it aligns "
            "with your preference for client meetings in the late afternoon."
        ),
        action_items=[
            {
                "description": "Review Q3 Roadmap draft document",
                "is_time_sensitive": False
            },
            {
                "description": "Check calendar for tomorrow at 3:00 PM",
                "is_time_sensitive": True
            },
            {
                "description": "Accept client invitation and send confirmation",
                "is_time_sensitive": True
            }
        ],
        urgency=UrgencyLevel.MEDIUM,
        decoded_subtext=(
            "Client requests are structured and time-sensitive but do not require "
            "disrupting today's focus block. Confirming tomorrow at 3 PM is safe and "
            "respects your preference for late afternoon external syncs."
        ),
        duration_minutes=30,
        block_type=BlockType.MEETING,
        rationale=(
            "Meeting block tomorrow afternoon for the Northwind roadmap alignment. "
            "Fits perfectly in your preference window after 15:00."
        ),
        debate_rounds=1,
        confidence_score=0.95,
        processing_time_ms=1500,
        final_positions=[
            {
                "agent_name": "contextualizer",
                "summary": "Decoded as MEDIUM urgency. Meets standard external meeting SLA, no immediate escalations or blockers."
            },
            {
                "agent_name": "scheduler",
                "summary": "Fits perfectly tomorrow at 15:00, protecting your morning focus peaks."
            }
        ],
    ),
    
    # 4. Jira Sprint Triage Scenario
    DemoScenario(
        name="jira_sprint_triage",
        trigger_phrases=["onboarding flow", "gradient saturation", "feedback from qa"],
        original_message="Critical: Revisit the onboarding flow feedback from QA. Need to lower gradient saturation before staging push.",
        title="Design Revision: Onboarding Flow Saturation",
        description=(
            "Sprint Triage / Priya (Product Designer) has submitted a critical ticket regarding "
            "high gradient saturation in the onboarding hero section. This needs correction "
            "before the staging push scheduled for later today."
        ),
        action_items=[
            {
                "description": "Locate onboarding flow Figma files and code component",
                "is_time_sensitive": True
            },
            {
                "description": "Reduce the color saturation of the hero gradient according to design spec",
                "is_time_sensitive": True
            },
            {
                "description": "Verify saturation adjustment in local staging environment",
                "is_time_sensitive": True
            }
        ],
        urgency=UrgencyLevel.HIGH,
        decoded_subtext=(
            "'Critical' label in sprint triage indicates immediate attention is needed. "
            "Since it blocks the staging push, this should be executed in the next available "
            "work block today."
        ),
        duration_minutes=45,
        block_type=BlockType.DEEP_WORK,
        rationale=(
            "Dedicated deep focus block this afternoon to unblock the staging push. "
            "Adjusting color gradients requires concentrated design revision work."
        ),
        debate_rounds=2,
        confidence_score=0.97,
        processing_time_ms=2500,
        final_positions=[
            {
                "agent_name": "contextualizer",
                "summary": "HIGH urgency. Design feedback from Priya is usually medium priority, but this is a critical ticket blocking staging branch release."
            },
            {
                "agent_name": "scheduler",
                "summary": "Scheduler suggests 45-minute deep focus block at 16:00 today to address the Figma design changes before deploy."
            }
        ],
        dissent_rounds=[
            {
                "sender": "scheduler",
                "reasoning": "Initially suggested shallow work tomorrow. Need deep focus block today because it is a release blocker for staging.",
                "recommendations": ["Change block to Deep Work", "Move to 16:00 today"]
            }
        ]
    )
]


def find_demo_scenario(message: str) -> DemoScenario | None:
    """Return the first DemoScenario whose trigger phrases match the message, or None."""
    for scenario in _SCENARIOS:
        if scenario.matches(message):
            return scenario
    return None
