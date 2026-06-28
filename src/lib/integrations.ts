/**
 * Integration management — Workplace Proxy
 *
 * Handles OAuth connection state for Google Calendar, Gmail, and Slack.
 * Connection status is persisted in the Supabase user_integrations table.
 *
 * Token strategy:
 *   - Google (Calendar + Gmail): reuses the Google access token from the
 *     Supabase session (provider_token). When scopes are missing, triggers
 *     a fresh OAuth consent with the required additional scopes.
 *   - Slack: redirects to slack-mcp-server /oauth/authorize which initiates
 *     the Slack OAuth app flow and stores the bot token server-side.
 */

import { supabase } from './supabase';

export type IntegrationService = 'google_calendar' | 'gmail' | 'slack' | 'whatsapp';

export interface IntegrationStatus {
  service: IntegrationService;
  connected: boolean;
  scopes: string[];
  connected_at: string | null;
  metadata: Record<string, unknown>;
}

// ── Supabase persistence ──────────────────────────────────────────────────────

export async function loadIntegrationStatuses(userId: string): Promise<Map<IntegrationService, IntegrationStatus>> {
  const { data, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.warn('[integrations] failed to load statuses:', error.message);
    return new Map();
  }

  const map = new Map<IntegrationService, IntegrationStatus>();
  for (const row of data || []) {
    map.set(row.service as IntegrationService, {
      service:      row.service,
      connected:    row.connected,
      scopes:       row.scopes || [],
      connected_at: row.connected_at,
      metadata:     row.metadata || {},
    });
  }
  return map;
}

export async function upsertIntegrationStatus(
  userId: string,
  service: IntegrationService,
  connected: boolean,
  scopes: string[] = [],
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabase.from('user_integrations').upsert(
    {
      user_id:      userId,
      service,
      connected,
      scopes,
      connected_at: connected ? new Date().toISOString() : null,
      metadata,
    },
    { onConflict: 'user_id,service' },
  );
  if (error) console.warn('[integrations] upsert failed:', error.message);
}

export async function disconnectIntegration(userId: string, service: IntegrationService): Promise<void> {
  await upsertIntegrationStatus(userId, service, false, [], {});
}

// ── MCP server base URLs (override via VITE_*_MCP_URL in .env) ───────────────

export const SLACK_MCP_URL =
  (import.meta.env.VITE_SLACK_MCP_URL as string | undefined) ?? 'http://localhost:3000';
export const GMAIL_MCP_URL =
  (import.meta.env.VITE_GMAIL_MCP_URL as string | undefined) ?? 'http://localhost:3001';
export const CALENDAR_MCP_URL =
  (import.meta.env.VITE_CALENDAR_MCP_URL as string | undefined) ?? 'http://localhost:3002';
export const WHATSAPP_MCP_URL =
  (import.meta.env.VITE_WHATSAPP_MCP_URL as string | undefined) ?? 'http://localhost:3003';

export async function checkWhatsAppMCPConnected(): Promise<boolean> {
  try {
    const resp = await fetch(`${WHATSAPP_MCP_URL}/health`);
    if (!resp.ok) return false;
    const data = await resp.json();
    return !!(data.configured);
  } catch {
    return false;
  }
}

export async function checkSlackMCPConnected(): Promise<boolean> {
  try {
    const resp = await fetch(`${SLACK_MCP_URL}/health`);
    if (!resp.ok) return false;
    const data = await resp.json();
    return !!(data.configured);
  } catch {
    return false;
  }
}

export async function checkCalendarMCPReachable(): Promise<boolean> {
  try {
    const resp = await fetch(`${CALENDAR_MCP_URL}/health`);
    return resp.ok;
  } catch {
    return false;
  }
}

export async function checkGmailMCPReachable(): Promise<boolean> {
  try {
    const resp = await fetch(`${GMAIL_MCP_URL}/health`);
    return resp.ok;
  } catch {
    return false;
  }
}

// ── Google OAuth flows ────────────────────────────────────────────────────────

/**
 * Scopes required for Google Calendar integration.
 * These are in addition to the basic profile/email scopes already granted at login.
 */
const CALENDAR_SCOPES = 'openid email profile https://www.googleapis.com/auth/calendar.readonly';

/**
 * Scopes required for Gmail integration.
 */
const GMAIL_SCOPES = 'openid email profile https://www.googleapis.com/auth/gmail.readonly';

/**
 * Combined scopes for connecting both Calendar and Gmail in one consent screen.
 */
const GOOGLE_FULL_SCOPES = 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly';

/**
 * Trigger Google OAuth re-consent with Calendar scope.
 * After the consent, Supabase session will include provider_token with calendar access.
 */
export async function connectGoogleCalendar(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo:  `${window.location.origin}/integrations?google_calendar_connected=true`,
      scopes:       CALENDAR_SCOPES,
      queryParams:  { access_type: 'offline', prompt: 'consent' },
    },
  });
  if (error) throw error;
}

/**
 * Trigger Google OAuth re-consent with Gmail scope.
 */
export async function connectGmail(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo:  `${window.location.origin}/integrations?gmail_connected=true`,
      scopes:       GMAIL_SCOPES,
      queryParams:  { access_type: 'offline', prompt: 'consent' },
    },
  });
  if (error) throw error;
}

/**
 * Trigger Slack OAuth flow via the Slack MCP server.
 * The Slack MCP server handles the callback and stores the bot token.
 */
export function connectSlack(): void {
  window.location.href = `${SLACK_MCP_URL}/oauth/authorize`;
}

/**
 * After Google OAuth redirect, read the provider_token from the Supabase session
 * and store the integration as connected in Supabase.
 */
export async function handleGoogleOAuthReturn(service: 'google_calendar' | 'gmail'): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.provider_token) return false;

  // Cache the provider token in both sessionStorage and localStorage so it
  // survives page reloads. localStorage is the authoritative store; sessionStorage
  // is a fast same-tab cache.
  if (typeof window !== 'undefined') {
    sessionStorage.setItem("google_provider_token", session.provider_token);
    localStorage.setItem("google_provider_token", session.provider_token);
  }

  const scopeMap: Record<string, string[]> = {
    google_calendar: ['calendar.readonly'],
    gmail:           ['gmail.readonly'],
  };

  await upsertIntegrationStatus(session.user.id, service, true, scopeMap[service], {
    email: session.user.email,
  });

  return true;
}
