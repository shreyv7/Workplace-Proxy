const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const { supabase } = require("../shared/supabase-client.cjs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const CONFIG_PATH = path.join(__dirname, "config.json");
const TOKEN_PATH = path.join(__dirname, "token.json");

let oauth2Client = null;
let pollingInterval = null;

// Load configuration and initialize OAuth client
function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
      if (config.clientId && config.clientSecret) {
        oauth2Client = new google.auth.OAuth2(
          config.clientId,
          config.clientSecret,
          config.redirectUri || `http://localhost:${PORT}/oauth2callback`
        );
        loadToken();
      }
    } catch (e) {
      console.error("Failed to parse config.json", e);
    }
  }
}

// Load token
function loadToken() {
  if (fs.existsSync(TOKEN_PATH) && oauth2Client) {
    try {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
      oauth2Client.setCredentials(token);
      console.log("Gmail token loaded and authenticated successfully.");
      startPolling();
    } catch (e) {
      console.error("Failed to parse token.json", e);
    }
  }
}

// Save config helper
function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
  loadConfig();
}

// Save token helper
function saveToken(token) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2), "utf8");
  if (oauth2Client) {
    oauth2Client.setCredentials(token);
    startPolling();
  }
}

// Helper: check if email is authenticated
function isEmailAuthenticated() {
  return oauth2Client && oauth2Client.credentials && oauth2Client.credentials.access_token;
}

// Gmail polling loop for unread emails
function startPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  if (!isEmailAuthenticated()) return;

  console.log("Gmail inbox polling started.");
  pollingInterval = setInterval(async () => {
    try {
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });
      const response = await gmail.users.messages.list({
        userId: "me",
        q: "is:unread",
        maxResults: 5
      });

      const messages = response.data.messages || [];
      for (const msgRef of messages) {
        // Fetch message details
        const msgDetail = await gmail.users.messages.get({
          userId: "me",
          id: msgRef.id
        });

        const headers = msgDetail.data.payload.headers || [];
        const subjectHeader = headers.find(h => h.name.toLowerCase() === "subject");
        const fromHeader = headers.find(h => h.name.toLowerCase() === "from");

        const subject = subjectHeader ? subjectHeader.value : "No Subject";
        const fromValue = fromHeader ? fromHeader.value : "Unknown Sender";
        
        // Parse snippet/body
        const body = msgDetail.data.snippet || msgDetail.data.payload.body.data || "Empty Email Body";

        const msgId = `msg_email_${msgRef.id}`;
        console.log(`Gmail Ingested Message: ${msgId} from ${fromValue}`);

        // Process message & trigger swarm consensus
        await processInboundEmailMessage(msgId, fromValue, subject, body, msgRef.id, gmail);
      }
    } catch (err) {
      console.error("Error polling Gmail inbox:", err.message);
    }
  }, 30000); // Poll every 30 seconds
}

// Handle real-time Gmail message ingestion & Swarm integration
async function processInboundEmailMessage(msgId, sender, subject, body, gmailMsgId, gmailClient) {
  const timestampStr = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const timestampIso = new Date().toISOString();

  try {
    // 1. Insert "processing" message state into Supabase
    await supabase.from("messages").insert([{
      message_id: msgId,
      sender_name: sender,
      sender_role: "External Contact",
      timestamp: timestampStr,
      original_text: `Subject: ${subject}\n\n${body}`,
      source: "email",
      importance: "medium",
      ambiguity: "medium",
      agent_assigned: "Interceptor Agent",
      translation_status: "processing",
      action: "Analyzing Email signals...",
      complexity: "Medium",
      expected_duration: "Evaluating...",
      steps: ["Parsing Gmail message"],
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
      msg: `Gmail message ingested. Dispatching to swarm orchestrator.`
    }]);

    // 2. Call FastAPI backend orchestrator
    const response = await fetch("http://localhost:8000/api/v1/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message_id: msgId,
        source: "email",
        sender_name: sender,
        sender_role: "External Contact",
        content: `Subject: ${subject}\n\n${body}`,
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

    // 4. Mark email as read in Gmail (remove UNREAD label)
    await gmailClient.users.messages.batchModify({
      userId: "me",
      requestBody: {
        ids: [gmailMsgId],
        removeLabelIds: ["UNREAD"]
      }
    });

  } catch (err) {
    console.error(`Failed end-to-end swarm sync for Email message ${msgId}:`, err);
    await supabase.from("messages").update({
      translation_status: "completed",
      action: `Action Required: Review Email from ${sender}`,
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
    service: "Email (Gmail) MCP Server",
    configured: !!oauth2Client,
    authenticated: isEmailAuthenticated()
  });
});

// ── Configuration Endpoint ──
app.post("/config", (req, res) => {
  const { clientId, clientSecret, redirectUri } = req.body;
  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: "clientId and clientSecret are required." });
  }

  saveConfig({
    clientId,
    clientSecret,
    redirectUri: redirectUri || `http://localhost:${PORT}/oauth2callback`
  });

  res.json({ success: true, message: "Email configuration saved successfully." });
});

// ── Get OAuth Consent URL ──
app.get("/auth-url", (req, res) => {
  if (!oauth2Client) {
    return res.status(400).json({ error: "Email MCP server is not configured yet. Set credentials first." });
  }
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify"
    ]
  });
  res.json({ authUrl });
});

// ── OAuth2 Callback ──
app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Authorization code missing.");
  }
  if (!oauth2Client) {
    return res.status(500).send("OAuth client not initialized.");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    saveToken(tokens);
    // Redirect user back to the frontend integration page
    res.redirect("http://localhost:5173/integrations?integration=email&status=success");
  } catch (err) {
    console.error("Error exchanging OAuth code:", err);
    res.status(500).send("Failed to retrieve access token. " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Email MCP Server running on port ${PORT}`);
});
