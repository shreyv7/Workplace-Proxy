import { supabase } from "./supabase";

export type InboundPayload = {
  source: "slack" | "email" | "jira" | "teams";
  sender_name: string;
  sender_role?: string;
  original_text: string;
};

const FASTAPI_URL = "http://localhost:8000/api/triage";

export async function sendRawMessageToSwarm(payload: InboundPayload) {
  try {
    const response = await fetch(FASTAPI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`FastAPI responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("FastAPI backend is offline. Initiating frontend simulation override...", error);
    return await simulateSwarmLocally(payload);
  }
}

/**
 * Fallback simulation mode for hackathon presentation safety.
 * Directly writes simulated debate states and final task briefings into Supabase.
 */
async function simulateSwarmLocally(payload: InboundPayload) {
  const msgId = `msg_sim_${Date.now().toString().slice(-4)}`;
  const timestamp = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  // 1. Write the initial "processing" record
  const initialMsg = {
    message_id: msgId,
    sender_name: payload.sender_name,
    sender_role: payload.sender_role || "External Contact",
    timestamp: timestamp,
    original_text: payload.original_text,
    source: payload.source,
    importance: "medium",
    ambiguity: "high",
    agent_assigned: "Interceptor Agent",
    translation_status: "processing",
    action: "Decoding raw inbound signal...",
    complexity: "Medium",
    expected_duration: "Evaluating...",
    steps: ["Ingesting webhook payload", "Triggering semantic vector lookup"],
    suggested_start_time: "11:00",
    suggested_end_time: "12:00",
    fidelity_rating: 3,
    acknowledged: false,
    reasoning: "Signal intercepted. Spawning swarms for context extraction...",
    debate_id: `deb_${msgId}`
  };

  await supabase.from("messages").insert([initialMsg]);

  // 2. Write simulated trace logs sequentially to Supabase
  const logSteps = [
    { t: timestamp, agent: "Interceptor Agent", tool: "channel_intercept", msg: `Ingested ${payload.source} payload` },
    { t: timestamp, agent: "Context Agent", tool: "qdrant_semantic_search", msg: "Searching user preferences vector index" },
    { t: timestamp, agent: "Scheduler Agent", tool: "get_calendar_free_busy", msg: "Scanning conflicts on Google Calendar" },
    { t: timestamp, agent: "Consensus Swarm", event: "Debate initialized: 4-agent consensus negotiation in progress" }
  ];

  for (const log of logSteps) {
    await supabase.from("trace_logs").insert([log]);
    await new Promise((r) => setTimeout(r, 600));
  }

  // 3. Finalize the translation record
  const finalMsg = {
    translation_status: "completed",
    action: `Action: Review context regarding '${payload.original_text.slice(0, 20)}...'`,
    complexity: "Medium",
    expected_duration: "30 mins",
    steps: [
      "Check reference documents link",
      "Draft confirmation summary",
      "Confirm calendar time reservation block"
    ],
    reasoning: "Automatically translated raw webhook trigger. Optimized scheduling target based on open focus slots.",
    debate_id: `deb_${msgId}`
  };

  await supabase.from("messages").update(finalMsg).eq("message_id", msgId);

  // Write final aligned log
  await supabase.from("trace_logs").insert([{
    t: timestamp,
    agent: "Translator Agent",
    tool: "render_clarity_card",
    msg: `Successfully compiled task block: ${msgId}`
  }]);

  return { status: "success", simulated: true, message_id: msgId };
}
