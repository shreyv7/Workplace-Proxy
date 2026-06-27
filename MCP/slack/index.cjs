const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { WebClient } = require("@slack/web-api");
const { supabase } = require("../shared/supabase-client.cjs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const CONFIG_PATH = path.join(__dirname, "config.json");
const STATE_PATH = path.join(__dirname, "state.json");

let webClient = null;
let channels = [];
let pollingInterval = null;

// Load configuration
function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
      if (config.botToken) {
        webClient = new WebClient(config.botToken);
        channels = config.channels || [];
        startPolling();
      }
    } catch (e) {
      console.error("Failed to parse config.json", e);
    }
  }
}

// Save configuration
function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
  loadConfig();
}

// Load last poll state (cursor timestamp)
function getLatestTs(channelId) {
  if (fs.existsSync(STATE_PATH)) {
    try {
      const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
      return state[channelId] || "0";
    } catch (e) {
      return "0";
    }
  }
  return "0";
}

// Save last poll state
function updateLatestTs(channelId, ts) {
  let state = {};
  if (fs.existsSync(STATE_PATH)) {
    try {
      state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    } catch (e) {}
  }
  state[channelId] = ts;
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

// Slack polling loop
function startPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  if (!webClient) return;

  console.log("Slack polling started for channels:", channels);
  pollingInterval = setInterval(async () => {
    for (const channelId of channels) {
      try {
        const oldest = getLatestTs(channelId);
        const result = await webClient.conversations.history({
          channel: channelId,
          oldest: oldest,
          limit: 10
        });

        const messages = result.messages || [];
        if (messages.length > 0) {
          // Sort oldest first so we process chronologically
          messages.sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));
          
          for (const msg of messages) {
            // Skip bot messages
            if (msg.bot_id || msg.subtype === "bot_message") continue;

            // Fetch user profile info
            let senderName = "External User";
            try {
              const userInfo = await webClient.users.info({ user: msg.user });
              senderName = userInfo.user.real_name || userInfo.user.name || senderName;
            } catch (e) {
              console.error("Failed to fetch user info for user ID:", msg.user, e);
            }

            const clientMsgId = msg.client_msg_id || msg.ts.replace(".", "_");
            const msgId = `msg_slack_${clientMsgId}`;

            console.log(`Slack Ingested Message: ${msgId} from ${senderName}`);
            await processInboundSlackMessage(msgId, senderName, msg.text, msg.ts, channelId);
          }

          // Update checkpoint to the ts of the newest message
          const newestTs = messages[messages.length - 1].ts;
          updateLatestTs(channelId, newestTs);
        }
      } catch (err) {
        console.error(`Error polling channel ${channelId}:`, err.message);
      }
    }
  }, 20000); // Poll every 20 seconds
}

// Handle real-time Slack message ingestion & Swarm integration
async function processInboundSlackMessage(msgId, senderName, content, ts, channelId) {
  const timestampStr = new Date(parseFloat(ts) * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const timestampIso = new Date(parseFloat(ts) * 1000).toISOString();

  try {
    // 1. Insert "processing" message state into Supabase
    await supabase.from("messages").insert([{
      message_id: msgId,
      sender_name: senderName,
      sender_role: "External Contact",
      timestamp: timestampStr,
      original_text: content,
      source: "slack",
      importance: "medium",
      ambiguity: "medium",
      agent_assigned: "Interceptor Agent",
      translation_status: "processing",
      action: "Analyzing Slack signals...",
      complexity: "Medium",
      expected_duration: "Evaluating...",
      steps: ["Parsing Slack message"],
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
      msg: `Slack message ingested. Dispatching to swarm orchestrator.`
    }]);

    // 2. Call FastAPI backend orchestrator
    const response = await fetch("http://localhost:8000/api/v1/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message_id: msgId,
        source: "slack",
        sender_name: senderName,
        sender_role: "External Contact",
        content: content,
        timestamp: timestampIso,
        thread_context: [],
        user_id: "usr_clarity_101"
      })
    });

    if (!response.ok) {
      throw new Error(`Orchestrator returned ${response.status}`);
    }

    const result = await response.json();

    // 3. Process the backend response and write final details to Supabase
    const task = result.translated_task;
    const slot = result.calendar_slot;

    let importance = "medium";
    if (task.urgency === "high" || task.urgency === "critical") importance = "high";
    if (task.urgency === "low") importance = "low";

    let startTime = "14:00";
    let endTime = "14:30";
    if (slot?.suggested_start) {
      startTime = new Date(slot.suggested_start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    }
    if (slot?.suggested_end) {
      endTime = new Date(slot.suggested_end).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    }

    const updatedMsg = {
      translation_status: "completed",
      importance: importance,
      action: task.title,
      complexity: task.urgency.charAt(0).toUpperCase() + task.urgency.slice(1),
      expected_duration: slot ? `${slot.duration_minutes} mins` : "30 mins",
      steps: task.action_items.map((item) => item.description),
      suggested_start_time: startTime,
      suggested_end_time: endTime,
      reasoning: task.decoded_subtext || slot?.rationale || "Consensus aligned successfully.",
      debate_id: result.request_id || `deb_${msgId}`
    };

    await supabase.from("messages").update(updatedMsg).eq("message_id", msgId);

    // Save proposed calendar block
    if (slot) {
      await supabase.from("calendar_blocks").insert([{
        id: `task_${msgId}`,
        start: startTime,
        end: endTime,
        title: task.title,
        type: "task",
        source_message_id: msgId,
        acknowledged: false,
        agent_generated: true,
        confidence: Math.round(result.confidence_score * 100),
        reason: slot.rationale
      }]);
    }

    // Write trace logs
    const logs = [];
    if (result.debate_summary?.final_positions) {
      for (const pos of result.debate_summary.final_positions) {
        logs.push({
          t: timestampStr,
          agent: pos.agent_name,
          tool: "consensus_debate",
          msg: pos.summary
        });
      }
    }
    logs.push({
      t: timestampStr,
      agent: "Consensus Swarm",
      event: `Swarm aligned at ${Math.round(result.confidence_score * 100)}% certainty.`
    });

    await supabase.from("trace_logs").insert(logs);

  } catch (err) {
    console.error(`Failed end-to-end swarm sync for Slack message ${msgId}:`, err);
    await supabase.from("messages").update({
      translation_status: "completed",
      action: `Action Required: Review Slack Message from ${senderName}`,
      reasoning: `Swarm processing offline: ${err.message}`
    }).eq("message_id", msgId);
  }
}

// Initial load
loadConfig();

// ── Health Check ──
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Slack MCP Server",
    configured: !!webClient,
    channels: channels
  });
});

// ── Configuration Endpoint ──
app.post("/config", (req, res) => {
  const { botToken, channels: newChannels } = req.body;
  if (!botToken) {
    return res.status(400).json({ error: "botToken is required." });
  }

  saveConfig({
    botToken,
    channels: newChannels || []
  });

  res.json({ success: true, message: "Slack configuration updated successfully." });
});

app.listen(PORT, () => {
  console.log(`Slack MCP Server running on port ${PORT}`);
});
