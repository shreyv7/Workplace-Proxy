const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { WebClient } = require("@slack/web-api");
const { supabase } = require("./supabase-client.cjs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const CONFIG_PATH = path.join(__dirname, "config.json");
const STATE_PATH = path.join(__dirname, "state.json");

let webClient = null;
let channels = [];
let pollingInterval = null;
const lastIngestedSlackMessages = [];
const channelNameCache = {};

async function getChannelName(channelId) {
  if (channelNameCache[channelId]) return channelNameCache[channelId];
  if (!webClient) return channelId;
  try {
    const info = await webClient.conversations.info({ channel: channelId });
    if (info.ok && info.channel) {
      channelNameCache[channelId] = info.channel.name;
      return info.channel.name;
    }
  } catch (e) {
    console.error("Failed to fetch channel info for ID:", channelId, e);
  }
  return channelId;
}

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

            // Fallback dictionary for known demo user IDs when users:read scope is missing
            const SENDER_FALLBACKS = {
              "U0BD4GY8B8F": "Shrey Vashistha",
              "U0BDDSL7UQ3": "Devansh"
            };

            // Fetch user profile info
            let senderName = SENDER_FALLBACKS[msg.user] || "Teammate";
            try {
              const userInfo = await webClient.users.info({ user: msg.user });
              if (userInfo && userInfo.ok && userInfo.user) {
                senderName = userInfo.user.real_name || userInfo.user.name || senderName;
              }
            } catch (e) {
              console.error("Failed to fetch user info for user ID:", msg.user, e.message);
            }

            const clientMsgId = msg.client_msg_id || msg.ts.replace(".", "_");
            const msgId = `msg_slack_${clientMsgId}`;

            const channelName = await getChannelName(channelId);

            console.log(`Slack Ingested Message: ${msgId} from ${senderName} in #${channelName}`);
            
            // Log to test UI memory array
            lastIngestedSlackMessages.unshift({
              msgId,
              senderName,
              text: msg.text,
              ts: new Date(parseFloat(msg.ts) * 1000).toISOString(),
              channelId,
              rawPayload: {
                ...msg,
                user_name: senderName,
                channel_name: channelName
              }
            });
            if (lastIngestedSlackMessages.length > 20) lastIngestedSlackMessages.pop();

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
    const response = await fetch(`${process.env.VITE_BACKEND_URL || "http://localhost:8000"}/api/v1/process`, {
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
    botToken: botToken.trim(),
    channels: (newChannels || []).map(c => c.trim()).filter(Boolean)
  });

  res.json({ success: true, message: "Slack configuration updated successfully." });
});

// ── Disconnect Endpoint ──
app.post("/disconnect", (req, res) => {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = null;
  webClient = null;
  channels = [];
  
  if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
  if (fs.existsSync(STATE_PATH)) fs.unlinkSync(STATE_PATH);

  res.json({ success: true, message: "Slack integration disconnected successfully." });
});

// ── Reply Endpoint ──
app.post("/reply", async (req, res) => {
  if (!webClient) {
    return res.status(400).json({ error: "Slack is not configured or authenticated." });
  }

  const { channelId, text, threadTs } = req.body;
  if (!channelId || !text) {
    return res.status(400).json({ error: "channelId and text are required." });
  }

  try {
    const result = await webClient.chat.postMessage({
      channel: channelId,
      text: text,
      thread_ts: threadTs
    });

    res.json({ success: true, result });
  } catch (err) {
    console.error("Slack reply failed:", err);
    res.status(500).json({ error: "Failed to send Slack reply: " + err.message });
  }
});

// ── Test Page showing Slack Data ──
app.get("/test-ui", (req, res) => {
  let messagesHtml = "";
  if (lastIngestedSlackMessages.length === 0) {
    messagesHtml = `
      <div class="text-center py-16 border border-dashed border-gray-800 rounded-2xl">
        <p class="text-gray-500 text-sm">No Slack messages have been ingested since the server started.</p>
        <p class="text-xs text-gray-600 mt-1">Send a message in your configured Slack channel to trigger polling.</p>
      </div>
    `;
  } else {
    const sorted = [...lastIngestedSlackMessages].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    messagesHtml = `<div class="space-y-4">` + sorted.map(msg => `
      <div class="bg-gray-950/80 border border-gray-800 rounded-2xl p-5 hover:border-amber-500/30 transition-all duration-300">
        <div class="flex justify-between items-start gap-4 mb-3">
          <div>
            <span class="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">${msg.senderName}</span>
            <span class="text-[10px] text-gray-500 font-mono ml-2">${msg.msgId}</span>
          </div>
          <span class="text-[10px] text-gray-500 font-mono">${new Date(msg.ts).toLocaleTimeString()}</span>
        </div>
        <p class="text-sm text-gray-200 bg-gray-900/40 p-3.5 rounded-xl border border-gray-900/50 leading-relaxed font-sans mb-3">${msg.text}</p>
        
        <details class="text-[11px] text-gray-400">
          <summary class="cursor-pointer hover:text-white font-semibold outline-hidden select-none">View Raw Slack Payload JSON</summary>
          <pre class="bg-gray-900/50 p-4 rounded-xl mt-2 overflow-x-auto code-font text-amber-300/90 text-xs border border-gray-850">${JSON.stringify(msg.rawPayload, null, 2)}</pre>
        </details>
      </div>
    `).join("") + `</div>`;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Slack MCP Test Harness</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background-color: #0b0f19;
          color: #f3f4f6;
        }
        .code-font {
          font-family: 'JetBrains Mono', monospace;
        }
      </style>
    </head>
    <body class="p-8 min-h-screen">
      <div class="max-w-6xl mx-auto">
        <header class="mb-10 flex justify-between items-center border-b border-gray-800 pb-6">
          <div>
            <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Slack MCP Test Harness</h1>
            <p class="text-gray-400 mt-2 text-sm">Real-time Slack polling debugger and ingested payload inspector.</p>
          </div>
          <div class="bg-gray-900/80 border border-gray-800 rounded-2xl px-5 py-3 text-right">
            <span class="text-[10px] font-bold tracking-widest text-amber-500 uppercase block">Polling Interval</span>
            <span class="text-xl font-extrabold text-white mt-1 block">20 Seconds</span>
          </div>
        </header>

        <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left side: Status & Config -->
          <div class="space-y-6">
            <div class="bg-gray-900/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-xl">
              <h2 class="text-lg font-bold mb-4">MCP Health Status</h2>
              <div class="space-y-4 text-sm">
                <div class="flex justify-between py-2 border-b border-gray-850">
                  <span class="text-gray-400">Connection State:</span>
                  <span class="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span class="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span> Active Polling
                  </span>
                </div>
                <div class="flex justify-between py-2 border-b border-gray-850">
                  <span class="text-gray-400">Configured:</span>
                  <span class="font-mono">${webClient ? "Yes (Token Valid)" : "No"}</span>
                </div>
                <div class="flex justify-between py-2">
                  <span class="text-gray-400">Monitored Channels:</span>
                  <span class="font-mono text-amber-400 font-bold">${channels.join(", ") || "None"}</span>
                </div>
              </div>
            </div>

            <div class="bg-gray-900/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-xl">
              <h2 class="text-lg font-bold mb-3">API References</h2>
              <p class="text-xs text-gray-400 leading-relaxed mb-4">This server acts as a middleware bridge, transforming incoming Slack webhook-equivalent history segments into structured agent cognitive prompts.</p>
              <a href="/health" class="inline-flex items-center text-xs text-amber-400 hover:text-amber-300 font-semibold gap-1">
                View Server Health JSON &rarr;
              </a>
            </div>
          </div>

          <!-- Right side: Ingested Payloads -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-gray-900/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-xl">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold">Ingested Slack Payloads</h2>
                <span class="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold font-mono">Last 20 Runs</span>
              </div>

              ${messagesHtml}
            </div>
          </div>
        </section>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Slack MCP Server running on port ${PORT}`);
});
