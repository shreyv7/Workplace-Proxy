/**
 * Calendar MCP Server — Workplace Proxy
 *
 * Exposes Role 1's calendar integration as an HTTP server.
 * The Role 2 orchestrator's Scheduler agent calls this server to:
 *   - Retrieve today's calendar blocks  (GET /calendar/today)
 *   - Find the next available time slot  (POST /calendar/find-slot)
 *
 * Authentication strategy (in priority order):
 *   1. Bearer token in Authorization header  (per-request, from frontend OAuth)
 *   2. GOOGLE_ACCESS_TOKEN env var           (configured once for the demo)
 *   3. Demo mode: returns realistic mock data (default when no token is available)
 *
 * Port: 3002 (set via PORT env var or .env file)
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// ── Token resolution ──────────────────────────────────────────────────────────

function resolveToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return process.env.GOOGLE_ACCESS_TOKEN || null;
}

function buildCalendarClient(accessToken) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth });
}

// ── Demo data ─────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function demoTodayBlocks() {
  const d = todayISO();
  return [
    { start: `${d}T09:00:00Z`, end: `${d}T11:00:00Z`, block_type: 'deep_work', is_available: false, title: 'Deep Work — Architecture Review' },
    { start: `${d}T11:00:00Z`, end: `${d}T13:00:00Z`, block_type: 'free',      is_available: true,  title: null },
    { start: `${d}T13:00:00Z`, end: `${d}T13:45:00Z`, block_type: 'meeting',   is_available: false, title: 'Team Standup' },
    { start: `${d}T13:45:00Z`, end: `${d}T15:45:00Z`, block_type: 'free',      is_available: true,  title: null },
    { start: `${d}T15:45:00Z`, end: `${d}T17:30:00Z`, block_type: 'deep_work', is_available: false, title: 'Deep Work — Quiet Block' },
  ];
}

function demoNextSlot(durationMinutes, preferredAfter) {
  const base = preferredAfter ? new Date(preferredAfter) : new Date();
  // Round up to the next 30-minute boundary
  const m = base.getMinutes();
  base.setMinutes(m < 30 ? 30 : 60, 0, 0);
  if (base.getHours() >= 18) {
    base.setDate(base.getDate() + 1);
    base.setHours(9, 0, 0, 0);
  }
  const end = new Date(base.getTime() + durationMinutes * 60_000);
  return { start: base.toISOString(), end: end.toISOString(), block_type: 'shallow_work', is_available: true, title: null };
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'calendar-mcp',
    google_configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_ACCESS_TOKEN),
  });
});

/**
 * GET /calendar/today?user_id=<uid>
 * Returns all calendar blocks for today.
 * Tries the Google Calendar API when an access token is available; falls back to demo data.
 */
function determineBlockType(ev) {
  // 0. Identify Google Calendar native Tasks and Focus blocks
  if (ev.eventType === 'task') {
    return 'shallow_work';
  }
  if (ev.eventType === 'focusTime') {
    return 'deep_work';
  }

  const summary = (ev.summary || '').toLowerCase();
  
  // 1. Break / meal blocks
  if (summary.includes('lunch') || summary.includes('dinner') || summary.includes('breakfast') || summary.includes('break')) {
    return 'free';
  }

  // 1.5 Special check: admin routine tasks containing 'meeting' keywords should not be meeting tags
  if (summary.includes('check for meetings') || summary.includes('check meetings') || summary.includes('verify meetings')) {
    return 'shallow_work';
  }

  // 2. Check for other attendees (definitely a meeting)
  const otherAttendees = (ev.attendees || []).filter(a => !a.self);
  if (otherAttendees.length > 0) {
    return 'meeting';
  }

  // 3. Typical meeting keywords
  const meetingKeywords = ['meeting', 'sync', 'standup', 'alignment', '1:1', '1on1', 'call', 'discussion', 'align', 'review', 'huddle', 'catchup', 'catch up'];
  if (meetingKeywords.some(kw => summary.includes(kw))) {
    return 'meeting';
  }

  // 4. Calculate duration in hours
  let durationHours = 0;
  if (ev.start && ev.end) {
    const startStr = ev.start.dateTime || ev.start.date;
    const endStr = ev.end.dateTime || ev.end.date;
    if (startStr && endStr) {
      const startMs = new Date(startStr).getTime();
      const endMs = new Date(endStr).getTime();
      durationHours = (endMs - startMs) / (1000 * 60 * 60);
    }
  }

  // 5. Rule: Anything with a 2 hours or more interval isn't shallow (it's deep work)
  if (durationHours >= 2) {
    return 'deep_work';
  }

  // 6. Deep work / focus indicators for shorter durations
  if (
    summary.includes('deep work') || 
    summary.includes('focus block') || 
    summary.includes('quiet block') || 
    summary.includes('deep-work') ||
    summary.includes('architecture review')
  ) {
    return 'deep_work';
  }

  // 7. Shallow work / tasks
  if (
    summary.includes('shallow work') || 
    summary.includes('admin') || 
    summary.includes('email') || 
    summary.includes('task') || 
    summary.includes('project work') || 
    summary.includes('internship work') || 
    summary.includes('check for meetings')
  ) {
    return 'shallow_work';
  }

  // Default to shallow_work for personal entries
  return 'shallow_work';
}

app.get('/calendar/today', async (req, res) => {
  const token = resolveToken(req);

  if (token) {
    try {
      const cal = buildCalendarClient(token);
      const now = new Date();
      const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay   = new Date(now); endOfDay.setHours(23, 59, 59, 999);

      const resp = await cal.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const blocks = (resp.data.items || []).map(ev => ({
        start:      ev.start?.dateTime || ev.start?.date || null,
        end:        ev.end?.dateTime   || ev.end?.date   || null,
        block_type: determineBlockType(ev),
        is_available: false,
        title: ev.summary || 'Busy',
      }));

      return res.json(blocks);
    } catch (err) {
      console.warn('[Calendar MCP] Google API error — using demo data:', err.message);
    }
  }

  res.json(demoTodayBlocks());
});

/**
 * POST /calendar/find-slot
 * Body: { user_id, duration_minutes, preferred_after, block_type }
 * Returns the next available calendar block matching the request.
 */
app.post('/calendar/find-slot', async (req, res) => {
  const { duration_minutes = 30, preferred_after, block_type = 'shallow_work' } = req.body;
  const token = resolveToken(req);

  if (token) {
    try {
      const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
      auth.setCredentials({ access_token: token });

      const preferredStart = preferred_after ? new Date(preferred_after) : new Date();
      const endSearch = new Date(preferredStart);
      endSearch.setDate(endSearch.getDate() + 7);

      const fbResp = await google.calendar({ version: 'v3', auth }).freebusy.query({
        resource: {
          timeMin: preferredStart.toISOString(),
          timeMax: endSearch.toISOString(),
          items: [{ id: 'primary' }],
        },
      });

      const busy = (fbResp.data.calendars?.primary?.busy || []);
      let candidate = new Date(preferredStart);
      const m = candidate.getMinutes();
      candidate.setMinutes(m < 30 ? 30 : 60, 0, 0);

      for (let attempt = 0; attempt < 96; attempt++) {
        const candidateEnd = new Date(candidate.getTime() + duration_minutes * 60_000);
        const conflicts = busy.filter(b => candidate < new Date(b.end) && candidateEnd > new Date(b.start));

        if (conflicts.length === 0) {
          return res.json({ start: candidate.toISOString(), end: candidateEnd.toISOString(), block_type, is_available: true, title: null });
        }

        const latestEnd = new Date(Math.max(...conflicts.map(c => new Date(c.end).getTime())));
        candidate = latestEnd;
        const cm = candidate.getMinutes();
        candidate.setMinutes(cm < 30 ? 30 : 60, 0, 0);
      }
    } catch (err) {
      console.warn('[Calendar MCP] freebusy error — using demo slot:', err.message);
    }
  }

  res.json(demoNextSlot(duration_minutes, preferred_after));
});

/**
 * POST /calendar/create-event
 * Creates an event in the user's primary Google Calendar.
 */
app.post('/calendar/create-event', async (req, res) => {
  try {
    const { title, start, end, description } = req.body;
    if (!title || !start || !end) {
      return res.status(400).json({ error: "title, start, and end are required." });
    }

    const token = resolveToken(req);
    if (!token) {
      return res.status(401).json({ error: "Google Calendar not authenticated." });
    }

    const calendar = buildCalendarClient(token);
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

// ── Test UI ───────────────────────────────────────────────────────────────────

app.get('/test-ui', (req, res) => {
  const hasToken = !!(process.env.GOOGLE_ACCESS_TOKEN || process.env.GOOGLE_CLIENT_ID);
  const authMode = hasToken ? 'Google OAuth Configured' : 'Demo Mode (No Token)';
  const authColor = hasToken ? '#34d399' : '#f59e0b';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Calendar MCP Test Harness</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0b0f19; color: #f3f4f6; }
        .code-font { font-family: 'JetBrains Mono', monospace; }
        .result-box { min-height: 120px; background: #0d1117; border: 1px solid #1e2a3a; border-radius: 1rem; padding: 1rem; overflow-x: auto; white-space: pre-wrap; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #6ee7b7; }
        .spinner { display: none; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #34d399; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading .spinner { display: inline-block; }
        .loading .btn-text { display: none; }
        input, textarea { background: #0d1117; border: 1px solid #1e2a3a; border-radius: 0.5rem; padding: 0.5rem 0.75rem; width: 100%; color: #f3f4f6; font-size: 13px; font-family: 'JetBrains Mono', monospace; }
        input:focus, textarea:focus { outline: none; border-color: #34d399; }
        label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; display: block; }
      </style>
    </head>
    <body class="p-8 min-h-screen">
      <div class="max-w-6xl mx-auto">

        <!-- Header -->
        <header class="mb-10 flex justify-between items-center border-b border-gray-800 pb-6">
          <div>
            <h1 class="text-3xl font-extrabold tracking-tight" style="background: linear-gradient(to right, #34d399, #6ee7b7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Calendar MCP Test Harness</h1>
            <p class="text-gray-400 mt-2 text-sm">Live Google Calendar API payload inspector and endpoint tester.</p>
          </div>
          <div class="bg-gray-900/80 border border-gray-800 rounded-2xl px-5 py-3 text-right">
            <span class="text-[10px] font-bold tracking-widest text-emerald-500 uppercase block">Server Port</span>
            <span class="text-xl font-extrabold text-white mt-1 block">${PORT}</span>
          </div>
        </header>

        <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <!-- Left: Status + API refs -->
          <div class="space-y-6">
            <div class="bg-gray-900/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-xl">
              <h2 class="text-lg font-bold mb-4">MCP Health Status</h2>
              <div class="space-y-4 text-sm">
                <div class="flex justify-between py-2 border-b border-gray-800">
                  <span class="text-gray-400">Service:</span>
                  <span class="font-bold flex items-center gap-1.5" style="color: #34d399;">
                    <span class="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block"></span> Online
                  </span>
                </div>
                <div class="flex justify-between py-2 border-b border-gray-800">
                  <span class="text-gray-400">Auth Mode:</span>
                  <span class="font-mono font-bold" style="color: ${authColor};">${authMode}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-gray-800">
                  <span class="text-gray-400">Client ID:</span>
                  <span class="font-mono text-xs" style="color: #9ca3af;">${process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.slice(0, 12) + '…' : 'Not set'}</span>
                </div>
                <div class="flex justify-between py-2">
                  <span class="text-gray-400">Access Token:</span>
                  <span class="font-mono text-xs" style="color: #9ca3af;">${process.env.GOOGLE_ACCESS_TOKEN ? '●●●●' + process.env.GOOGLE_ACCESS_TOKEN.slice(-6) : 'Not set'}</span>
                </div>
              </div>
            </div>

            <div class="bg-gray-900/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-xl">
              <h2 class="text-lg font-bold mb-3">API Endpoints</h2>
              <p class="text-xs text-gray-400 leading-relaxed mb-4">This server bridges the Google Calendar API into structured cognitive time-block payloads for the Role 2 orchestrator's Scheduler agent.</p>
              <div class="space-y-2">
                <a href="/health" class="flex items-center text-xs font-semibold gap-1" style="color: #34d399;">View Health JSON →</a>
                <a href="/calendar/today" class="flex items-center text-xs font-semibold gap-1" style="color: #34d399;">GET /calendar/today →</a>
              </div>
            </div>
          </div>

          <!-- Right: Interactive Testers -->
          <div class="lg:col-span-2 space-y-6">

            <!-- GET /calendar/today -->
            <div class="bg-gray-900/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-xl">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mr-2">GET</span>
                  <span class="text-lg font-bold">/calendar/today</span>
                </div>
                <button id="btn-today" onclick="fetchToday()" class="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm" style="background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3); color: #34d399;">
                  <span class="spinner" id="spinner-today"></span>
                  <span class="btn-text">Fetch Today's Blocks</span>
                </button>
              </div>
              <p class="text-xs text-gray-400 mb-4">Returns all calendar blocks for today. Uses Google Calendar API if a token is present, otherwise returns realistic demo data.</p>
              <div id="result-today" class="result-box text-gray-500 italic">Click "Fetch Today's Blocks" to call the endpoint…</div>
            </div>

            <!-- POST /calendar/find-slot -->
            <div class="bg-gray-900/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-xl">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 mr-2">POST</span>
                  <span class="text-lg font-bold">/calendar/find-slot</span>
                </div>
                <button id="btn-slot" onclick="findSlot()" class="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm" style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); color: #f59e0b;">
                  <span class="spinner" id="spinner-slot"></span>
                  <span class="btn-text">Find Slot</span>
                </button>
              </div>
              <p class="text-xs text-gray-400 mb-4">Finds the next available time slot matching the given duration and preferred start time.</p>
              <div class="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label>Duration (mins)</label>
                  <input type="number" id="slot-duration" value="30" min="5" max="480">
                </div>
                <div>
                  <label>Block Type</label>
                  <input type="text" id="slot-type" value="shallow_work" placeholder="e.g. deep_work">
                </div>
                <div>
                  <label>Preferred After (ISO)</label>
                  <input type="text" id="slot-after" placeholder="e.g. 2026-06-28T14:00:00">
                </div>
              </div>
              <div id="result-slot" class="result-box text-gray-500 italic">Fill in the fields and click "Find Slot"…</div>
            </div>

            <!-- POST /calendar/create-event -->
            <div class="bg-gray-900/50 border border-gray-800/80 rounded-3xl p-6 backdrop-blur-xl">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 mr-2">POST</span>
                  <span class="text-lg font-bold">/calendar/create-event</span>
                </div>
                <button id="btn-create" onclick="createEvent()" class="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm" style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); color: #818cf8;">
                  <span class="spinner" id="spinner-create"></span>
                  <span class="btn-text">Create Event</span>
                </button>
              </div>
              <p class="text-xs text-gray-400 mb-4">Creates a new event in the authenticated user's primary Google Calendar. Requires a valid Google access token.</p>
              <div class="grid grid-cols-2 gap-3 mb-3">
                <div class="col-span-2">
                  <label>Event Title</label>
                  <input type="text" id="ev-title" value="Deep Work — Workplace Proxy Test" placeholder="Event title">
                </div>
                <div>
                  <label>Start (ISO)</label>
                  <input type="text" id="ev-start" placeholder="e.g. 2026-06-28T15:00:00">
                </div>
                <div>
                  <label>End (ISO)</label>
                  <input type="text" id="ev-end" placeholder="e.g. 2026-06-28T16:00:00">
                </div>
                <div class="col-span-2">
                  <label>Description (optional)</label>
                  <input type="text" id="ev-desc" placeholder="Scheduled by Workplace Proxy swarm consensus.">
                </div>
              </div>
              <div id="result-create" class="result-box text-gray-500 italic">Fill in the fields and click "Create Event"…</div>
            </div>

          </div>
        </section>
      </div>

      <script>
        function setLoading(btnId, spinnerId, loading) {
          const btn = document.getElementById(btnId);
          const sp = document.getElementById(spinnerId);
          if (loading) { btn.classList.add('loading'); sp.style.display = 'inline-block'; }
          else { btn.classList.remove('loading'); sp.style.display = 'none'; }
        }

        function pretty(data) {
          return JSON.stringify(data, null, 2);
        }

        async function fetchToday() {
          setLoading('btn-today', 'spinner-today', true);
          const el = document.getElementById('result-today');
          try {
            const r = await fetch('/calendar/today');
            const data = await r.json();
            const blocks = Array.isArray(data) ? data : [data];
            el.style.color = '#6ee7b7';
            el.textContent = pretty(blocks);
          } catch(e) {
            el.style.color = '#f87171';
            el.textContent = 'Error: ' + e.message;
          } finally {
            setLoading('btn-today', 'spinner-today', false);
          }
        }

        async function findSlot() {
          setLoading('btn-slot', 'spinner-slot', true);
          const el = document.getElementById('result-slot');
          const body = {
            duration_minutes: parseInt(document.getElementById('slot-duration').value) || 30,
            block_type: document.getElementById('slot-type').value || 'shallow_work',
            preferred_after: document.getElementById('slot-after').value || undefined,
          };
          try {
            const r = await fetch('/calendar/find-slot', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            const data = await r.json();
            el.style.color = '#fcd34d';
            el.textContent = pretty(data);
          } catch(e) {
            el.style.color = '#f87171';
            el.textContent = 'Error: ' + e.message;
          } finally {
            setLoading('btn-slot', 'spinner-slot', false);
          }
        }

        async function createEvent() {
          setLoading('btn-create', 'spinner-create', true);
          const el = document.getElementById('result-create');
          const body = {
            title: document.getElementById('ev-title').value,
            start: document.getElementById('ev-start').value,
            end: document.getElementById('ev-end').value,
            description: document.getElementById('ev-desc').value,
          };
          if (!body.title || !body.start || !body.end) {
            el.style.color = '#f87171';
            el.textContent = 'Error: title, start, and end are required.';
            setLoading('btn-create', 'spinner-create', false);
            return;
          }
          try {
            const r = await fetch('/calendar/create-event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            const data = await r.json();
            el.style.color = r.ok ? '#818cf8' : '#f87171';
            el.textContent = pretty(data);
          } catch(e) {
            el.style.color = '#f87171';
            el.textContent = 'Error: ' + e.message;
          } finally {
            setLoading('btn-create', 'spinner-create', false);
          }
        }

        // Auto-populate start/end with sensible defaults
        const now = new Date();
        now.setMinutes(now.getMinutes() < 30 ? 30 : 60, 0, 0);
        const later = new Date(now.getTime() + 60 * 60 * 1000);
        const fmt = d => d.toISOString().slice(0, 19);
        document.getElementById('ev-start').value = fmt(now);
        document.getElementById('ev-end').value = fmt(later);
        document.getElementById('slot-after').value = fmt(now);
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

app.listen(PORT, () => {
  const hasToken = !!(process.env.GOOGLE_ACCESS_TOKEN || process.env.GOOGLE_CLIENT_ID);
  console.log(`[Calendar MCP] Listening on port ${PORT} | google_auth=${hasToken ? 'configured' : 'demo_mode'}`);
});

