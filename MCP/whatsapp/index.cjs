const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { supabase } = require("../shared/supabase-client.cjs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3003;
const CONFIG_PATH = path.join(__dirname, "config.json");

let config = {
  accessToken: "",
  phoneNumberId: "",
  verifyToken: ""
};

const lastIngestedWAMessages = [];

// Load config
function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
      console.log("[WhatsApp MCP] Configuration loaded successfully.");
    } catch (e) {
      console.error("[WhatsApp MCP] Failed to parse config.json", e);
    }
  }
}

// Save config
function saveConfig(newConfig) {
  config = { ...config, ...newConfig };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
  console.log("[WhatsApp MCP] Configuration updated.");
}

// Inbound webhook processing & Swarm integration
async function processInboundWAMessage(msgId, senderName, senderPhone, text, timestamp) {
  const timeStr = new Date(parseInt(timestamp) * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const timeIso = new Date(parseInt(timestamp) * 1000).toISOString();

  try {
    // 1. Insert "processing" message state into Supabase
    await supabase.from("messages").insert([{
      message_id: msgId,
      sender_name: senderName,
      sender_role: `WhatsApp (${senderPhone})`,
      timestamp: timeStr,
      original_text: text,
      source: "whatsapp",
      importance: "medium",
      ambiguity: "medium",
      agent_assigned: "Interceptor Agent",
      translation_status: "processing",
      action: "Analyzing WhatsApp signals...",
      complexity: "Medium",
      expected_duration: "Evaluating...",
      steps: ["Parsing WhatsApp message"],
      suggested_start_time: "12:00",
      suggested_end_time: "13:00",
      fidelity_rating: 3,
      acknowledged: false,
      reasoning: "Debating consensus bounds with agent swarm...",
      debate_id: `deb_${msgId}`
    }]);

    await supabase.from("trace_logs").insert([{
      t: timeStr,
      agent: "Interceptor Agent",
      tool: "whatsapp_intercept",
      msg: `WhatsApp message ingested from ${senderName}. Dispatching to swarm orchestrator.`
    }]);

    // 2. Call FastAPI backend orchestrator
    const response = await fetch(`${process.env.VITE_BACKEND_URL || "http://localhost:8000"}/api/v1/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message_id: msgId,
        source: "whatsapp",
        sender_name: senderName,
        sender_role: "External Contact",
        content: text,
        timestamp: timeIso,
        thread_context: [],
        user_id: "usr_clarity_101"
      })
    });

    if (!response.ok) {
      throw new Error(`Orchestrator returned ${response.status}`);
    }

    const result = await response.json();

    // 3. Process backend response and write final details to Supabase
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
          t: timeStr,
          agent: pos.agent_name,
          tool: "consensus_debate",
          msg: pos.summary
        });
      }
    }
    logs.push({
      t: timeStr,
      agent: "Consensus Swarm",
      event: `Swarm aligned at ${Math.round(result.confidence_score * 100)}% certainty.`
    });

    await supabase.from("trace_logs").insert(logs);

  } catch (err) {
    console.error(`[WhatsApp MCP] Failed end-to-end swarm sync for WhatsApp message ${msgId}:`, err);
    await supabase.from("messages").update({
      translation_status: "completed",
      action: `Action Required: Review WhatsApp from ${senderName}`,
      reasoning: `Swarm processing offline: ${err.message}`
    }).eq("message_id", msgId);
  }
}

// Load config initially
loadConfig();

// ── Health Check ──
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "WhatsApp MCP Server",
    configured: !!(config.accessToken && config.phoneNumberId)
  });
});

// ── Configuration Endpoint ──
app.post("/config", (req, res) => {
  const { accessToken, phoneNumberId, verifyToken } = req.body;
  if (!accessToken || !phoneNumberId || !verifyToken) {
    return res.status(400).json({ error: "accessToken, phoneNumberId, and verifyToken are required." });
  }

  saveConfig({
    accessToken: accessToken.trim(),
    phoneNumberId: phoneNumberId.trim(),
    verifyToken: verifyToken.trim()
  });

  res.json({ success: true, message: "WhatsApp configuration updated successfully." });
});

// ── Disconnect Endpoint ──
app.post("/disconnect", (req, res) => {
  config = {
    accessToken: "",
    phoneNumberId: "",
    verifyToken: ""
  };
  if (fs.existsSync(CONFIG_PATH)) {
    fs.unlinkSync(CONFIG_PATH);
  }
  res.json({ success: true, message: "WhatsApp disconnected successfully." });
});

// ── Meta Webhook Challenge Handshake (GET) ──
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === config.verifyToken) {
    console.log("[WhatsApp MCP] Webhook verified successfully via GET challenge handshake.");
    res.status(200).send(challenge);
  } else {
    console.warn("[WhatsApp MCP] Webhook verification failed. Tokens mismatched.");
    res.sendStatus(403);
  }
});

// ── Meta Inbound Messages Receiver (POST) ──
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "whatsapp_business_account") {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (message && message.type === "text") {
      const senderPhone = message.from;
      const contactName = value?.contacts?.[0]?.profile?.name || `Contact (${senderPhone})`;
      const text = message.text.body;
      const msgId = `msg_wa_${message.id}`;
      const timestamp = message.timestamp;

      console.log(`[WhatsApp MCP] Ingested message: ${msgId} from ${contactName}`);

      lastIngestedWAMessages.unshift({
        msgId,
        senderName: contactName,
        senderPhone,
        text,
        ts: new Date(parseInt(timestamp) * 1000).toISOString(),
        rawPayload: body
      });

      if (lastIngestedWAMessages.length > 20) {
        lastIngestedWAMessages.pop();
      }

      // Process message in swarm async to unblock Meta callback
      processInboundWAMessage(msgId, contactName, senderPhone, text, timestamp);
    }

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// ── Outbound Reply API ──
app.post("/reply", async (req, res) => {
  const { recipientPhone, text } = req.body;
  if (!recipientPhone || !text) {
    return res.status(400).json({ error: "recipientPhone and text are required." });
  }

  if (!config.accessToken || !config.phoneNumberId) {
    return res.status(400).json({ error: "WhatsApp is not configured." });
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientPhone,
        type: "text",
        text: { body: text }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Meta API response error");
    }

    res.json({ success: true, result: data });
  } catch (err) {
    console.error("[WhatsApp MCP] Reply failed:", err);
    res.status(500).json({ error: "Failed to send WhatsApp reply: " + err.message });
  }
});

// ── Test Page showing Ingested Messages ──
app.get("/test-ui", (req, res) => {
  let messagesHtml = "";
  if (lastIngestedWAMessages.length === 0) {
    messagesHtml = `
      <div class="text-center py-16 border border-dashed border-gray-800 rounded-2xl">
        <p class="text-gray-500 text-sm">No WhatsApp messages have been ingested since the server started.</p>
        <p class="text-xs text-gray-600 mt-1">Configure Webhook callback in Meta Dev Portal, launch ngrok, and text your WhatsApp Business number.</p>
      </div>
    `;
  } else {
    const sorted = [...lastIngestedWAMessages].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    messagesHtml = `<div class="space-y-4">` + sorted.map(msg => `
      <div class="bg-gray-950/80 border border-gray-800 rounded-2xl p-5 hover:border-emerald-500/30 transition-all duration-300">
        <div class="flex justify-between items-start gap-4 mb-3">
          <div>
            <span class="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">${msg.senderName}</span>
            <span class="text-[10px] text-gray-500 font-mono ml-2">${msg.msgId} (Phone: ${msg.senderPhone})</span>
          </div>
          <span class="text-[10px] text-gray-500 font-mono">${new Date(msg.ts).toLocaleTimeString()}</span>
        </div>
        <p class="text-sm text-gray-200 bg-gray-900/40 p-3.5 rounded-xl border border-gray-900/50 leading-relaxed font-sans mb-3">${msg.text}</p>
        
        <details class="text-[11px] text-gray-400">
          <summary class="cursor-pointer hover:text-white font-semibold outline-hidden select-none">View Raw Meta Payload JSON</summary>
          <pre class="bg-gray-900/50 p-4 rounded-xl mt-2 overflow-x-auto code-font text-emerald-300/90 text-xs border border-gray-850">${JSON.stringify(msg.rawPayload, null, 2)}</pre>
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
      <title>WhatsApp MCP Test Harness</title>
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
            <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">WhatsApp MCP Test Harness</h1>
            <p class="text-gray-400 mt-2 text-sm">Real-time WhatsApp Webhook listener and payload inspector.</p>
          </div>
          <div class="bg-gray-900/80 border border-gray-800 rounded-2xl px-5 py-3 text-right">
            <span class="text-[10px] font-bold tracking-widest text-emerald-500 uppercase block">Port Listener</span>
            <span class="text-xl font-extrabold text-white mt-1 block">3003 /webhook</span>
          </div>
        </header>

        <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left side: Status -->
          <div class="space-y-6">
            <div class="bg-gray-900/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-xl">
              <h2 class="text-lg font-bold mb-4">MCP Health Status</h2>
              <div class="space-y-4 text-sm">
                <div class="flex justify-between py-2 border-b border-gray-850">
                  <span class="text-gray-400">Connection State:</span>
                  <span class="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span class="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span> Active Webhook
                  </span>
                </div>
                <div class="flex justify-between py-2 border-b border-gray-850">
                  <span class="text-gray-400">Configured:</span>
                  <span class="font-mono">${config.accessToken ? "Yes (Token Valid)" : "No"}</span>
                </div>
                <div class="flex justify-between py-2">
                  <span class="text-gray-400">Phone ID:</span>
                  <span class="font-mono text-emerald-400 font-bold">${config.phoneNumberId || "None"}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right side: Ingested Payloads -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-gray-900/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-xl">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold">Ingested WhatsApp Payloads</h2>
                <span class="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold font-mono">Last 20 Runs</span>
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
  console.log(`WhatsApp MCP Server running on port ${PORT}`);
});
