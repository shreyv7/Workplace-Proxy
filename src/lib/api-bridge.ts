import { supabase } from "./supabase";

export type InboundPayload = {
  message_id?: string;
  source: "slack" | "email" | "jira" | "teams";
  sender_name: string;
  sender_role?: string;
  content: string; // Changed from original_text to match ProcessRequest
};

const FASTAPI_URL = "http://localhost:8000/api/v1/process";

export async function sendRawMessageToSwarm(payload: InboundPayload) {
  const msgId = payload.message_id || `msg_sim_${Date.now().toString().slice(-4)}`;
  const timestampIso = new Date().toISOString();
  
  // Format for the Python ProcessRequest schema
  const requestBody = {
    message_id: msgId,
    source: payload.source,
    sender_name: payload.sender_name,
    sender_role: payload.sender_role || "External Contact",
    content: payload.content,
    timestamp: timestampIso,
    thread_context: [],
    user_id: "usr_clarity_101" // Required by Pydantic model
  };

  try {
    // 1. Log "processing" state in Supabase so the UI shows live progress
    const timestampStr = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    await supabase.from("messages").insert([{
      message_id: msgId,
      sender_name: payload.sender_name,
      sender_role: payload.sender_role || "External Contact",
      timestamp: timestampStr,
      original_text: payload.content,
      source: payload.source,
      importance: "medium",
      ambiguity: "medium",
      agent_assigned: "Interceptor Agent",
      translation_status: "processing",
      action: "Analyzing inbound signals...",
      complexity: "Medium",
      expected_duration: "Evaluating...",
      steps: ["Parsing message payload"],
      suggested_start_time: "12:00",
      suggested_end_time: "13:00",
      fidelity_rating: 3,
      acknowledged: false,
      reasoning: "Debating consensus bounds with agent swarm...",
      debate_id: `deb_${msgId}`
    }]);

    await supabase.from("trace_logs").insert([{
      t: timestampStr,
      agent: "Interceptor Agent",
      tool: "channel_intercept",
      msg: `Ingested ${payload.source} payload. Triggering backend agent swarm.`
    }]);

    // 2. Call FastAPI backend
    const response = await fetch(FASTAPI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`FastAPI responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    // 3. Process the response and save it to Supabase
    await handleBackendResponse(msgId, payload, result);
    return { status: "success", simulated: false, message_id: msgId };

  } catch (error) {
    console.warn("FastAPI backend is offline. Initiating frontend simulation override...", error);
    return await simulateSwarmLocally(payload, msgId);
  }
}

/**
 * Maps the Pydantic ProcessResponse payload to Supabase schemas.
 */
async function handleBackendResponse(msgId: string, payload: InboundPayload, result: any) {
  const timestampStr = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  
  const task = result.translated_task;
  const slot = result.calendar_slot;
  
  // Map urgency (low/medium/high/critical) to importance (low/medium/high)
  let importance: "low" | "medium" | "high" = "medium";
  if (task.urgency === "high" || task.urgency === "critical") importance = "high";
  if (task.urgency === "low") importance = "low";

  // Parse start/end times
  let startTime = "14:00";
  let endTime = "14:30";
  if (slot?.suggested_start) {
    const startDate = new Date(slot.suggested_start);
    startTime = startDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  if (slot?.suggested_end) {
    const endDate = new Date(slot.suggested_end);
    endTime = endDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  // Update messages in Supabase
  const updatedMsg = {
    translation_status: "completed",
    importance: importance,
    ambiguity: "medium",
    agent_assigned: "Consensus Swarm",
    action: task.title,
    complexity: task.urgency.charAt(0).toUpperCase() + task.urgency.slice(1), // Capitalize
    expected_duration: slot ? `${slot.duration_minutes} mins` : "30 mins",
    steps: task.action_items.map((item: any) => item.description),
    suggested_start_time: startTime,
    suggested_end_time: endTime,
    reasoning: task.decoded_subtext || slot?.rationale || "Consensus aligned successfully.",
    debate_id: result.request_id || `deb_${msgId}`
  };

  await supabase.from("messages").update(updatedMsg).eq("message_id", msgId);

  // If a calendar slot is proposed, insert it into calendar_blocks
  if (slot) {
    await supabase.from("calendar_blocks").insert([{
      id: `task_${msgId}`,
      start: startTime,
      "end": endTime,
      title: task.title,
      type: "task",
      source_message_id: msgId,
      acknowledged: false,
      agent_generated: true,
      confidence: Math.round(result.confidence_score * 100),
      reason: slot.rationale
    }]);
  }

  // Record logs of the debate rounds
  const logsToInsert = [];
  if (result.debate_summary?.final_positions) {
    for (const pos of result.debate_summary.final_positions) {
      logsToInsert.push({
        t: timestampStr,
        agent: pos.agent_name,
        tool: "consensus_debate",
        msg: pos.summary
      });
    }
  }

  logsToInsert.push({
    t: timestampStr,
    agent: "Consensus Swarm",
    event: `Swarm aligned at ${Math.round(result.confidence_score * 100)}% cert. Processing complete in ${result.processing_time_ms}ms.`
  });

  await supabase.from("trace_logs").insert(logsToInsert);
}

/**
 * Fallback simulation mode for hackathon presentation safety.
 */
async function simulateSwarmLocally(payload: InboundPayload, msgId: string) {
  const timestampStr = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const logSteps = [
    { t: timestampStr, agent: "Interceptor Agent", tool: "channel_intercept", msg: `Ingested raw ${payload.source} payload via HTTP` },
    { t: timestampStr, agent: "Context Agent", tool: "qdrant_semantic_search", msg: "Searched vectors for user rules" },
    { t: timestampStr, agent: "Scheduler Agent", tool: "get_calendar_free_busy", msg: "Scanned free slots on GCal" },
    { t: timestampStr, agent: "Consensus Swarm", event: "Consensus debate completed with 94% confidence" }
  ];

  for (const log of logSteps) {
    await supabase.from("trace_logs").insert([log]);
    await new Promise((r) => setTimeout(r, 500));
  }

  const finalMsg = {
    translation_status: "completed",
    action: `Action: Review context regarding '${payload.content.slice(0, 25)}...'`,
    complexity: "Medium",
    expected_duration: "30 mins",
    steps: [
      "Check reference documents folder",
      "Draft confirmation summary",
      "Confirm calendar time reservation block"
    ],
    reasoning: "Automatically translated raw webhook trigger. Optimized scheduling target based on open focus slots.",
    debate_id: `deb_${msgId}`
  };

  await supabase.from("messages").update(finalMsg).eq("message_id", msgId);

  // Insert mock calendar block
  await supabase.from("calendar_blocks").insert([{
    id: `task_${msgId}`,
    start: "14:00",
    "end": "14:30",
    title: `Action: Review context regarding '${payload.content.slice(0, 25)}...'`,
    type: "task",
    source_message_id: msgId,
    acknowledged: false,
    agent_generated: true,
    confidence: 94,
    reason: "Automatically scheduled based on afternoon capacity."
  }]);

  await supabase.from("trace_logs").insert([{
    t: timestampStr,
    agent: "Translator Agent",
    tool: "render_clarity_card",
    msg: `Successfully compiled task block: ${msgId}`
  }]);

  return { status: "success", simulated: true, message_id: msgId };
}
