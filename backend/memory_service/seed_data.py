"""Mock corporate and user data for seeding Qdrant.

This data is crafted to support the canonical demo scenario:
  Alice Johnson (Engineering Manager) sends:
  "Hey, are we still on track for the thing? No rush."

The Contextualizer agent must decode:
  - "the thing" → "Q2 Customer Demo (due Friday June 28)"
  - "no rush" from Alice → "typically means EOD same day"
  - Alice's history → "tends to understate urgency"

Running this module directly seeds the Qdrant instance:
  python -m memory_service.seed_data
"""
from __future__ import annotations

from qdrant_client.models import PointStruct

from memory_service.embeddings import embed_text
from memory_service.qdrant_client_setup import (
    CORPORATE_CONTEXT_COLLECTION,
    USER_CONTEXT_COLLECTION,
    ensure_collections,
    upsert_points,
)


# ── User Context Documents ───────────────────────────────────────────────────
# These represent the neurodivergent user's cognitive preferences.

USER_CONTEXT_DOCS = [
    {
        "id": 1,
        "user_id": "usr_clarity_101",
        "category": "formatting_prefs",
        "title": "Communication Style Preferences",
        "content": (
            "Prefers high-fidelity checklist formatting with step-by-step guidance. "
            "Avoids large paragraphs and walls of text. Always use bullet points and "
            "explicit deadlines. Numbered action items are preferred over prose."
        ),
        "formatting_style": "bullet_points",
        "preferred_urgency_language": "explicit_deadlines",
    },
    {
        "id": 2,
        "user_id": "usr_clarity_101",
        "category": "energy_cycles",
        "title": "Energy & Focus Cycles",
        "content": (
            "High cognitive focus peaks between 09:00 and 11:30. "
            "Deep work blocks are 10:00-12:00 and 14:00-16:00. "
            "Prefers scheduling external client syncs after 15:00. "
            "Low energy period is 13:00-14:00 (post-lunch)."
        ),
        "working_hours_start": "09:00",
        "working_hours_end": "18:00",
        "deep_work_blocks": ["10:00-12:00", "14:00-16:00"],
    },
    {
        "id": 3,
        "user_id": "usr_clarity_101",
        "category": "triggers",
        "title": "Known Stress Triggers",
        "content": (
            "Known triggers: ambiguous deadlines, vague requests without context, "
            "passive-aggressive language from managers, more than 3 context switches "
            "per hour. Gets anxious when messages use words like 'whenever', 'no rush', "
            "'at some point' without concrete timelines."
        ),
        "known_triggers": [
            "ambiguous deadlines",
            "vague requests",
            "passive-aggressive language",
            "context switches",
        ],
    },
    {
        "id": 4,
        "user_id": "usr_clarity_101",
        "category": "working_hours",
        "title": "Working Hours & Boundaries",
        "content": (
            "Works 09:00 to 18:00. No meetings before 10:00. "
            "Lunch break is strictly 12:30-13:30. "
            "Does not respond to Slack after 18:00. "
            "Prefers async communication over synchronous calls."
        ),
        "working_hours_start": "09:00",
        "working_hours_end": "18:00",
    },
]


# ── Corporate Context Documents ──────────────────────────────────────────────
# These represent company knowledge, jargon, project context, and sender patterns.

CORPORATE_CONTEXT_DOCS = [
    {
        "id": 1,
        "category": "project",
        "title": "Q2 Customer Demo",
        "content": (
            "The Q2 Customer Demo is the biggest client-facing event this quarter, "
            "scheduled for Friday June 28, 2026. The demo showcases the new product "
            "features to the enterprise sales pipeline. It requires a working staging "
            "environment, updated slide deck, and rehearsal run. The project is "
            "sometimes referred to as 'the thing' or 'the demo' in Slack channels."
        ),
        "relevant_projects": ["Q2 Demo", "Customer Showcase", "Enterprise Sales Pipeline"],
        "jargon": {"the thing": "Q2 Customer Demo (due Friday June 28)"},
    },
    {
        "id": 2,
        "category": "sender_pattern",
        "title": "Alice Johnson Communication Patterns",
        "content": (
            "Alice Johnson is the Engineering Manager. She frequently uses phrases "
            "like 'no rush' when she actually means end-of-day urgency. She has "
            "escalated previously when same-day tasks were not completed on time. "
            "When Alice says 'are we on track', she is looking for an immediate "
            "status update, not a casual check-in. Her messages that include "
            "'no rush' typically require a response within 2-3 hours."
        ),
        "sender_name": "Alice Johnson",
        "sender_history": [
            "Alice tends to understate urgency",
            "Has escalated on same-day tasks before",
            "'No rush' from Alice typically means EOD same day",
        ],
        "jargon": {"no rush": "typically means EOD same day from this sender"},
    },
    {
        "id": 3,
        "category": "process",
        "title": "Production Deployment Procedures",
        "content": (
            "Production deployment requires Infra team alignment in #infra Slack "
            "channel and staging branch verification beforehand. The deployment "
            "script usually takes 30-40 minutes. Staging testing must happen first. "
            "Always notify the #deployments channel before and after."
        ),
        "relevant_projects": ["Infrastructure", "DevOps"],
    },
    {
        "id": 4,
        "category": "design",
        "title": "Onboarding Flow v3 Design Files",
        "content": (
            "Onboarding flow v3 design files are in Figma at: "
            "Workplace Proxy / Onboarding / v3-final. "
            "Design lead is Priya (Product Designer). "
            "Current issues: color saturation too high on hero gradient, "
            "empty state needs copy and illustration spec."
        ),
        "relevant_projects": ["Onboarding", "UX Design"],
    },
    {
        "id": 5,
        "category": "client",
        "title": "Northwind Client Information",
        "content": (
            "Northwind Industries is a key enterprise client. Main stakeholders "
            "are John Doe (VP Engineering) and Sally Miller (Product Director). "
            "Roadmap approval process goes through CRM pipeline 'Q3 alignment'. "
            "They prefer Thursday afternoon meetings for roadmap discussions."
        ),
        "relevant_projects": ["Northwind Account", "Enterprise Clients"],
    },
    {
        "id": 6,
        "category": "jargon",
        "title": "Corporate Jargon Reference",
        "content": (
            "Common corporate jargon decoded: "
            "'The thing' in recent Slack context refers to Q2 Customer Demo. "
            "'EOD' means 17:00 UTC. 'ASAP' means within 2 hours. "
            "'Circle back' means revisit in next standup. "
            "'Touch base' means a brief 5-10 min status check. "
            "'Take a look' from a manager means review and respond today. "
            "'Whenever you get a chance' from an Engineering Manager means today."
        ),
        "jargon": {
            "the thing": "Q2 Customer Demo (due Friday June 28)",
            "EOD": "17:00 UTC",
            "ASAP": "within 2 hours",
            "circle back": "revisit in next standup",
            "touch base": "brief 5-10 min status check",
            "take a look": "review and respond today",
            "whenever you get a chance": "today (from a manager)",
        },
    },
    {
        "id": 7,
        "category": "sender_pattern",
        "title": "Manager Tom Communication Patterns",
        "content": (
            "Manager Tom is the Engineering Lead. When he says 'no rush but kind "
            "of important', it means high priority that needs attention within the "
            "day. He frequently asks people to 'ping the infra folks' which means "
            "coordinating with the infrastructure team via #infra Slack channel. "
            "His deployment-related requests typically need staging verification first."
        ),
        "sender_name": "Manager Tom",
        "sender_history": [
            "Tom uses hedging language to soften priority requests",
            "'No rush but important' from Tom = high priority today",
        ],
    },
    {
        "id": 8,
        "category": "sender_pattern",
        "title": "Priya Design Communication Patterns",
        "content": (
            "Priya is a Product Designer who uses collaborative language. "
            "When she says 'could you maybe loop back', she means she needs "
            "engineering input on a design decision. 'The colors feel a bit much' "
            "means she has already iterated and needs a second opinion. "
            "Design feedback from Priya is typically medium priority."
        ),
        "sender_name": "Priya",
        "sender_history": [
            "Priya uses collaborative language for design feedback",
            "Her requests are typically medium priority",
        ],
    },
]


def seed_qdrant() -> dict[str, int]:
    """
    Seed all Qdrant collections with mock data.

    Returns a dict of collection_name → number of points inserted.
    """
    ensure_collections()
    counts: dict[str, int] = {}

    # ── Seed user context ────────────────────────────────────────────────────
    user_points = []
    for doc in USER_CONTEXT_DOCS:
        vector = embed_text(doc["content"])
        payload = {k: v for k, v in doc.items() if k not in ("id",)}
        user_points.append(
            PointStruct(
                id=doc["id"],
                vector=vector,
                payload=payload,
            )
        )
    upsert_points(USER_CONTEXT_COLLECTION, user_points)
    counts[USER_CONTEXT_COLLECTION] = len(user_points)
    print(f"[seed] Inserted {len(user_points)} points into {USER_CONTEXT_COLLECTION}")

    # ── Seed corporate context ───────────────────────────────────────────────
    corp_points = []
    for doc in CORPORATE_CONTEXT_DOCS:
        vector = embed_text(doc["content"])
        payload = {k: v for k, v in doc.items() if k not in ("id",)}
        corp_points.append(
            PointStruct(
                id=doc["id"],
                vector=vector,
                payload=payload,
            )
        )
    upsert_points(CORPORATE_CONTEXT_COLLECTION, corp_points)
    counts[CORPORATE_CONTEXT_COLLECTION] = len(corp_points)
    print(f"[seed] Inserted {len(corp_points)} points into {CORPORATE_CONTEXT_COLLECTION}")

    return counts


# ── CLI entry point ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=== Seeding Qdrant with mock data ===")
    result = seed_qdrant()
    print(f"\n=== Seeding complete: {result} ===")
