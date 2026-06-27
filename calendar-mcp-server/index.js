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
        block_type: 'meeting',
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

app.listen(PORT, () => {
  const hasToken = !!(process.env.GOOGLE_ACCESS_TOKEN || process.env.GOOGLE_CLIENT_ID);
  console.log(`[Calendar MCP] Listening on port ${PORT} | google_auth=${hasToken ? 'configured' : 'demo_mode'}`);
});
