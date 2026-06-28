/**
 * Slack MCP Server — Workplace Proxy
 *
 * Exposes Slack workspace data as HTTP endpoints consumed by the Role 2
 * Contextualizer and Interceptor agents. When a message has source="slack",
 * the pipeline can fetch the original Slack thread for richer context.
 *
 * Also handles Slack OAuth 2.0 callback — stores the bot token after the
 * user authorises the Slack App from the frontend Configure button.
 *
 * Authentication:
 *   - Bot token: SLACK_BOT_TOKEN env var (xoxb-...)
 *   - When NOT set: returns realistic demo Slack messages
 *
 * OAuth flow:
 *   GET /oauth/authorize  → redirects user to Slack OAuth consent screen
 *   GET /oauth/callback   → exchanges code for bot token, stores in memory,
 *                           redirects back to frontend /integrations
 *
 * Port: 3000 (set via PORT env var or .env file)
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WebClient } from '@slack/web-api';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Runtime token store (persists until process restarts) ─────────────────────
// For production: replace with Supabase INSERT into user_integrations table.
let runtimeBotToken = process.env.SLACK_BOT_TOKEN || null;

function getSlackClient() {
  return runtimeBotToken ? new WebClient(runtimeBotToken) : null;
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_CHANNELS = [
  { id: 'C_general', name: 'general', is_member: true, num_members: 42, topic: 'Company-wide announcements' },
  { id: 'C_dev',     name: 'dev',     is_member: true, num_members: 12, topic: 'Engineering discussions' },
  { id: 'C_infra',   name: 'infra',   is_member: true, num_members: 8,  topic: 'Infrastructure and DevOps' },
];

const DEMO_MESSAGES = [
  { id: 'msg_001', user: 'Manager Tom', text: 'Hey, can you take a look at that deployment thing whenever? No rush, but kind of important. Also ping the infra folks if it feels off.', ts: `${Date.now() / 1000 - 3600}`, channel: 'dev' },
  { id: 'msg_002', user: 'Priya (Design)', text: 'Could you maybe loop back on the onboarding flow? The colors feel a bit much and we should probably revisit the empty state at some point.', ts: `${Date.now() / 1000 - 7200}`, channel: 'general' },
  { id: 'msg_003', user: 'Sarah (Marketing)', text: 'Can we sync on the launch campaign tomorrow? Need to approve the budget breakdown and clarify if copy docs are ready.', ts: `${Date.now() / 1000 - 1800}`, channel: 'general' },
];

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'slack-mcp',
    slack_configured: !!runtimeBotToken,
    bot_token_prefix: runtimeBotToken ? runtimeBotToken.substring(0, 12) + '...' : null,
  });
});

/**
 * GET /slack/channels
 * Returns channels the bot is a member of.
 */
app.get('/slack/channels', async (_req, res) => {
  const client = getSlackClient();
  if (client) {
    try {
      const result = await client.conversations.list({ types: 'public_channel', exclude_archived: true, limit: 50 });
      const channels = (result.channels || []).map(c => ({
        id: c.id, name: c.name, is_member: c.is_member, num_members: c.num_members, topic: c.topic?.value || '',
      }));
      return res.json(channels);
    } catch (err) {
      console.warn('[Slack MCP] channels.list error:', err.message);
    }
  }
  res.json(DEMO_CHANNELS);
});

/**
 * GET /slack/messages?channel=<channel_name_or_id>&limit=20
 * Returns recent messages from a Slack channel.
 */
app.get('/slack/messages', async (req, res) => {
  const { channel = 'general', limit = 20 } = req.query;
  const client = getSlackClient();

  if (client) {
    try {
      // Resolve channel name to ID if needed
      let channelId = channel;
      if (!channel.startsWith('C')) {
        const listResp = await client.conversations.list({ types: 'public_channel', limit: 200 });
        const found = (listResp.channels || []).find(c => c.name === channel);
        if (found) channelId = found.id;
      }

      const result = await client.conversations.history({ channel: channelId, limit: parseInt(limit, 10) });
      const messages = await Promise.all((result.messages || []).map(async msg => {
        let username = msg.username || msg.user || 'unknown';
        if (msg.user && client) {
          try {
            const userInfo = await client.users.info({ user: msg.user });
            username = userInfo.user?.real_name || userInfo.user?.name || username;
          } catch {}
        }
        return { id: msg.ts, user: username, text: msg.text || '', ts: msg.ts, channel };
      }));

      return res.json(messages);
    } catch (err) {
      console.warn('[Slack MCP] conversations.history error:', err.message);
    }
  }

  res.json(DEMO_MESSAGES.filter(m => m.channel === channel || channel === 'general'));
});

// ── Slack OAuth flow ──────────────────────────────────────────────────────────

/**
 * GET /oauth/authorize
 * Redirects the browser to the Slack OAuth consent screen.
 * Triggered by the frontend Configure button for the Slack integration.
 */
app.get('/oauth/authorize', (req, res) => {
  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ error: 'SLACK_CLIENT_ID not configured. Set it in slack-mcp-server/.env' });
  }

  const redirectUri  = process.env.PUBLIC_SLACK_CALLBACK_URL || `http://localhost:${PORT}/oauth/callback`;
  const scopes       = 'channels:history,channels:read,chat:write,users:read';
  const state        = req.query.return_to || 'integrations';

  const url = `https://slack.com/oauth/v2/authorize?client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
  res.redirect(url);
});

/**
 * GET /oauth/callback?code=<code>&state=<state>
 * Slack redirects here after user grants permission.
 * Exchanges the code for a bot token, stores it in memory, redirects to frontend.
 */
app.get('/oauth/callback', async (req, res) => {
  const { code, error: oauthError } = req.query;
  const frontendUrl = process.env.PUBLIC_FRONTEND_URL || "http://localhost:5173";

  if (oauthError) {
    console.error('[Slack MCP] OAuth error from Slack:', oauthError);
    return res.redirect(`${frontendUrl}/integrations?slack_error=${encodeURIComponent(oauthError)}`);
  }

  if (!code) {
    return res.redirect(`${frontendUrl}/integrations?slack_error=missing_code`);
  }

  const clientId     = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri  = process.env.PUBLIC_SLACK_CALLBACK_URL || `http://localhost:${PORT}/oauth/callback`;

  if (!clientId || !clientSecret) {
    return res.redirect(`${frontendUrl}/integrations?slack_error=server_not_configured`);
  }

  try {
    const tempClient = new WebClient();
    const result = await tempClient.oauth.v2.access({
      client_id:     clientId,
      client_secret: clientSecret,
      code,
      redirect_uri:  redirectUri,
    });

    runtimeBotToken = result.access_token;
    console.log('[Slack MCP] OAuth complete — bot token stored');

    // Redirect back to the frontend integrations page with success indicator
    res.redirect(`${frontendUrl}/integrations?slack_connected=true`);
  } catch (err) {
    console.error('[Slack MCP] token exchange failed:', err.message);
    res.redirect(`${frontendUrl}/integrations?slack_error=${encodeURIComponent(err.message)}`);
  }
});

/**
 * GET /oauth/status
 * Returns whether a bot token is currently configured.
 * Frontend polls this after the OAuth callback to update the integration card.
 */
app.get('/oauth/status', (_req, res) => {
  res.json({ connected: !!runtimeBotToken });
});

app.listen(PORT, () => {
  console.log(`[Slack MCP] Listening on port ${PORT} | slack_auth=${runtimeBotToken ? 'configured' : 'demo_mode'}`);
  if (!process.env.SLACK_CLIENT_ID) {
    console.log('[Slack MCP] SLACK_CLIENT_ID not set — OAuth Configure button will be disabled.');
  }
});
