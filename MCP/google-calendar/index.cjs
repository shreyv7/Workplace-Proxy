const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const { supabase } = require("../shared/supabase-client.cjs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;
const CONFIG_PATH = path.join(__dirname, "config.json");
const TOKEN_PATH = path.join(__dirname, "token.json");

let oauth2Client = null;

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
      console.log("Google Calendar token loaded and authenticated successfully.");
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
  }
}

// Initial config load
loadConfig();

// Helper: check if calendar is authenticated (own token.json credentials)
function isCalAuthenticated() {
  return oauth2Client && oauth2Client.credentials && oauth2Client.credentials.access_token;
}

// Helper: build a one-shot OAuth2 client from a Bearer token passed per-request.
// This lets the orchestrator forward the user's Supabase provider_token directly.
function buildBearerClient(bearerToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: bearerToken });
  return google.calendar({ version: "v3", auth });
}

// Helper: extract Authorization: Bearer <token> from request headers.
function resolveRequestToken(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7).trim() || null;
  return null;
}

// ── Health Check ──
app.get("/health", (req, res) => {
  const isSetup = fs.existsSync(CONFIG_PATH);
  const isAuth = isCalAuthenticated();
  res.json({
    status: "ok",
    service: "Google Calendar MCP Server",
    configured: isSetup,
    authenticated: isAuth
  });
});

// ── Config Endpoint ──
app.post("/config", (req, res) => {
  const { clientId, clientSecret, redirectUri } = req.body;
  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: "clientId and clientSecret are required." });
  }
  
  saveConfig({
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    redirectUri: (redirectUri || `http://localhost:${PORT}/oauth2callback`).trim()
  });

  res.json({ success: true, message: "Configuration saved successfully." });
});

// ── Get OAuth Consent URL ──
app.get("/auth-url", (req, res) => {
  if (!oauth2Client) {
    return res.status(400).json({ error: "Google Calendar MCP server is not configured yet. Set credentials first." });
  }
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events"
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
    const frontendUrl = process.env.PUBLIC_FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/integrations?integration=calendar&status=success`);
  } catch (err) {
    console.error("Error exchanging OAuth code:", err);
    res.status(500).send("Failed to retrieve access token. " + err.message);
  }
});

// ── Fetch Today's Calendar Blocks ──
app.get("/calendar/today", async (req, res) => {
  try {
    // Prefer a per-request Bearer token (forwarded by the orchestrator) so the
    // real signed-in user's calendar is used rather than the shared token.json.
    const bearerToken = resolveRequestToken(req);
    let calendar;
    if (bearerToken) {
      calendar = buildBearerClient(bearerToken);
    } else if (isCalAuthenticated()) {
      calendar = google.calendar({ version: "v3", auth: oauth2Client });
    } else {
      return res.json([]); // not authenticated via either path
    }

    // Today's window in local time so the server TZ matches the user's calendar.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: "startTime"
    });

    const events = response.data.items || [];
    const mapped = events.map((event) => {
      const start = event.start.dateTime || event.start.date;
      const end = event.end.dateTime || event.end.date;

      // Default to "meeting" — every Google Calendar event is a meeting unless
      // keywords indicate a personal focus or admin block.
      const titleLower = (event.summary || "").toLowerCase();
      let block_type = "meeting";
      if (titleLower.includes("deep work") || titleLower.includes("focus time") || titleLower.includes("focus block") || titleLower.includes("no meetings")) {
        block_type = "deep_work";
      } else if (titleLower.includes("admin") || titleLower.includes("billing") || titleLower.includes("expense")) {
        block_type = "admin";
      }

      return {
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        block_type,
        is_available: false,
        title: event.summary || "Busy Block"
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error("Error fetching today's events from Google Calendar:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Find Available Calendar Slot ──
app.post("/calendar/find-slot", async (req, res) => {
  try {
    const { duration_minutes, preferred_after, block_type } = req.body;
    let searchStart = preferred_after ? new Date(preferred_after) : new Date();
    
    // Ensure search window starts within working hours (09:00 - 18:00)
    if (searchStart.getHours() < 9) {
      searchStart.setHours(9, 0, 0, 0);
    }

    let busyIntervals = [];

    if (isCalAuthenticated()) {
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      
      const startRange = new Date(searchStart);
      const endRange = new Date(searchStart);
      endRange.setDate(endRange.getDate() + 3); // check up to 3 days in advance

      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: startRange.toISOString(),
        timeMax: endRange.toISOString(),
        singleEvents: true,
        orderBy: "startTime"
      });

      busyIntervals = (response.data.items || []).map((e) => ({
        start: new Date(e.start.dateTime || e.start.date),
        end: new Date(e.end.dateTime || e.end.date)
      }));
    }

    // Find next available slot during working hours (09:00 - 18:00)
    let foundSlot = null;
    let currentCandidate = new Date(searchStart);

    for (let day = 0; day < 3; day++) {
      const workdayEnd = new Date(currentCandidate);
      workdayEnd.setHours(18, 0, 0, 0);

      while (currentCandidate.getTime() + duration_minutes * 60 * 1000 <= workdayEnd.getTime()) {
        const candidateStart = new Date(currentCandidate);
        const candidateEnd = new Date(currentCandidate.getTime() + duration_minutes * 60 * 1000);

        const hasConflict = busyIntervals.some((busy) => {
          return candidateStart < busy.end && candidateEnd > busy.start;
        });

        if (!hasConflict) {
          foundSlot = { start: candidateStart, end: candidateEnd };
          break;
        }

        // Increment by 15-minute steps to scan for slots
        currentCandidate.setTime(currentCandidate.getTime() + 15 * 60 * 1000);
      }

      if (foundSlot) break;

      // Roll forward to 09:00 tomorrow
      currentCandidate.setDate(currentCandidate.getDate() + 1);
      currentCandidate.setHours(9, 0, 0, 0);
    }

    // Fallback: default to next hour
    if (!foundSlot) {
      const fallbackStart = new Date();
      fallbackStart.setHours(fallbackStart.getHours() + 1, 0, 0, 0);
      foundSlot = {
        start: fallbackStart,
        end: new Date(fallbackStart.getTime() + duration_minutes * 60 * 1000)
      };
    }

    res.json({
      start: foundSlot.start.toISOString(),
      end: foundSlot.end.toISOString(),
      block_type: block_type || "shallow_work",
      is_available: true,
      title: "Proposed Action Block"
    });

  } catch (err) {
    console.error("Error finding available slot in Google Calendar:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Create Event in Google Calendar ──
app.post("/calendar/create-event", async (req, res) => {
  try {
    const { title, start, end, description } = req.body;
    if (!title || !start || !end) {
      return res.status(400).json({ error: "title, start, and end are required." });
    }

    if (!isCalAuthenticated()) {
      return res.status(401).json({ error: "Google Calendar not authenticated." });
    }

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        description: description || "Automatically scheduled via Workplace Proxy Swarm consensus.",
        start: { dateTime: new Date(start).toISOString() },
        end: { dateTime: new Date(end).toISOString() }
      }
    });

    res.json({
      success: true,
      event_id: response.data.id,
      html_link: response.data.htmlLink
    });
  } catch (err) {
    console.error("Error creating Google Calendar event:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Disconnect Endpoint ──
app.post("/disconnect", (req, res) => {
  oauth2Client = null;
  
  if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
  if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH);

  res.json({ success: true, message: "Calendar integration disconnected successfully." });
});

app.listen(PORT, () => {
  console.log(`Google Calendar MCP Server running on port ${PORT}`);
});
