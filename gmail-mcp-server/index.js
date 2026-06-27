/**
 * Gmail MCP Server — Workplace Proxy
 *
 * Exposes Gmail data as HTTP endpoints consumed by the Role 2 Contextualizer agent.
 * When a message has source="email", the Contextualizer fetches recent thread
 * context from this server to enrich its analysis.
 *
 * Authentication strategy (in priority order):
 *   1. Bearer token in Authorization header  (per-request from frontend session)
 *   2. GOOGLE_ACCESS_TOKEN env var           (configured once for the demo)
 *   3. Demo mode: returns realistic mock threads (default)
 *
 * Port: 3001 (set via PORT env var or .env file)
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Token resolution ──────────────────────────────────────────────────────────

function resolveToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return process.env.GOOGLE_ACCESS_TOKEN || null;
}

function buildGmailClient(accessToken) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth });
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_THREADS = [
  {
    thread_id: 'demo_thread_001',
    subject: 'Q3 Roadmap Alignment',
    from: 'client@northwind.com',
    snippet: 'Following up on our conversation — would love to align on the Q3 roadmap soon.',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    message_count: 3,
    unread: true,
  },
  {
    thread_id: 'demo_thread_002',
    subject: 'Re: Onboarding flow feedback',
    from: 'design@company.com',
    snippet: 'Could you maybe loop back on the onboarding flow? The colors feel a bit much.',
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    message_count: 5,
    unread: false,
  },
  {
    thread_id: 'demo_thread_003',
    subject: 'Launch campaign approval needed',
    from: 'marketing@company.com',
    snippet: 'Can we sync on the launch campaign tomorrow? Need to approve the budget breakdown.',
    date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    message_count: 2,
    unread: true,
  },
];

const DEMO_MESSAGES = {
  demo_thread_001: [
    { id: 'msg_001a', from: 'client@northwind.com', body: 'Hi, following up on our convo. Open Thursday?', date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
    { id: 'msg_001b', from: 'me@company.com',       body: 'Sure, let me check my calendar and get back to you.', date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    { id: 'msg_001c', from: 'client@northwind.com', body: 'Would love to align on the Q3 roadmap. No rush, whenever works.', date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  ],
};

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'gmail-mcp',
    google_configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_ACCESS_TOKEN),
  });
});

/**
 * GET /gmail/threads?user_id=<uid>&max_results=10
 * Returns recent email threads for context enrichment.
 */
app.get('/gmail/threads', async (req, res) => {
  const maxResults = parseInt(req.query.max_results || '10', 10);
  const token = resolveToken(req);

  if (token) {
    try {
      const gmail = buildGmailClient(token);
      const listResp = await gmail.users.threads.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox is:unread',
      });

      const threads = listResp.data.threads || [];
      const enriched = await Promise.all(threads.map(async t => {
        try {
          const detail = await gmail.users.threads.get({ userId: 'me', id: t.id, format: 'metadata', metadataHeaders: ['Subject', 'From', 'Date'] });
          const msgs = detail.data.messages || [];
          const headers = msgs[0]?.payload?.headers || [];
          const get = name => (headers.find(h => h.name === name) || {}).value || '';
          return {
            thread_id:     t.id,
            subject:       get('Subject'),
            from:          get('From'),
            snippet:       msgs[0]?.snippet || '',
            date:          get('Date'),
            message_count: msgs.length,
            unread:        true,
          };
        } catch {
          return { thread_id: t.id, subject: '(unable to fetch)', from: '', snippet: '', date: null, message_count: 0, unread: true };
        }
      }));

      return res.json(enriched);
    } catch (err) {
      console.warn('[Gmail MCP] Google API error — using demo data:', err.message);
    }
  }

  res.json(DEMO_THREADS.slice(0, maxResults));
});

/**
 * GET /gmail/messages?thread_id=<id>
 * Returns the messages in a specific thread.
 */
app.get('/gmail/messages', async (req, res) => {
  const { thread_id } = req.query;
  const token = resolveToken(req);

  if (token && thread_id) {
    try {
      const gmail = buildGmailClient(token);
      const detail = await gmail.users.threads.get({ userId: 'me', id: thread_id, format: 'full' });
      const messages = (detail.data.messages || []).map(msg => {
        const headers = msg.payload?.headers || [];
        const get = name => (headers.find(h => h.name === name) || {}).value || '';
        const bodyData = msg.payload?.body?.data || msg.payload?.parts?.[0]?.body?.data || '';
        const body = bodyData ? Buffer.from(bodyData, 'base64').toString('utf-8') : msg.snippet || '';
        return { id: msg.id, from: get('From'), body, date: get('Date') };
      });
      return res.json(messages);
    } catch (err) {
      console.warn('[Gmail MCP] thread fetch error:', err.message);
    }
  }

  const demoMsgs = (thread_id && DEMO_MESSAGES[thread_id]) || DEMO_MESSAGES.demo_thread_001;
  res.json(demoMsgs);
});

app.listen(PORT, () => {
  const hasToken = !!(process.env.GOOGLE_ACCESS_TOKEN || process.env.GOOGLE_CLIENT_ID);
  console.log(`[Gmail MCP] Listening on port ${PORT} | google_auth=${hasToken ? 'configured' : 'demo_mode'}`);
});
