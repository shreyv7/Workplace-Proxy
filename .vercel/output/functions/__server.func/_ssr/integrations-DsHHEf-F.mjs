import { t as supabase } from "./supabase-gMqJtobQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/integrations-DsHHEf-F.js
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
async function loadIntegrationStatuses(userId) {
	const { data, error } = await supabase.from("user_integrations").select("*").eq("user_id", userId);
	if (error) {
		console.warn("[integrations] failed to load statuses:", error.message);
		return /* @__PURE__ */ new Map();
	}
	const map = /* @__PURE__ */ new Map();
	for (const row of data || []) map.set(row.service, {
		service: row.service,
		connected: row.connected,
		scopes: row.scopes || [],
		connected_at: row.connected_at,
		metadata: row.metadata || {}
	});
	return map;
}
async function upsertIntegrationStatus(userId, service, connected, scopes = [], metadata = {}) {
	const { error } = await supabase.from("user_integrations").upsert({
		user_id: userId,
		service,
		connected,
		scopes,
		connected_at: connected ? (/* @__PURE__ */ new Date()).toISOString() : null,
		metadata
	}, { onConflict: "user_id,service" });
	if (error) console.warn("[integrations] upsert failed:", error.message);
}
async function disconnectIntegration(userId, service) {
	await upsertIntegrationStatus(userId, service, false, [], {});
}
var SLACK_MCP_URL = "http://localhost:3000";
var GMAIL_MCP_URL = "http://localhost:3001";
var CALENDAR_MCP_URL = "http://localhost:3002";
var WHATSAPP_MCP_URL = "http://localhost:3003";
async function checkWhatsAppMCPConnected() {
	try {
		const resp = await fetch(`${WHATSAPP_MCP_URL}/health`);
		if (!resp.ok) return false;
		return !!(await resp.json()).configured;
	} catch {
		return false;
	}
}
async function checkSlackMCPConnected() {
	try {
		const resp = await fetch(`${SLACK_MCP_URL}/health`);
		if (!resp.ok) return false;
		return !!(await resp.json()).configured;
	} catch {
		return false;
	}
}
async function checkCalendarMCPReachable() {
	try {
		return (await fetch(`${CALENDAR_MCP_URL}/health`)).ok;
	} catch {
		return false;
	}
}
async function checkGmailMCPReachable() {
	try {
		return (await fetch(`${GMAIL_MCP_URL}/health`)).ok;
	} catch {
		return false;
	}
}
/**
* Scopes required for Google Calendar integration.
* These are in addition to the basic profile/email scopes already granted at login.
*/
var CALENDAR_SCOPES = "openid email profile https://www.googleapis.com/auth/calendar.readonly";
/**
* Scopes required for Gmail integration.
*/
var GMAIL_SCOPES = "openid email profile https://www.googleapis.com/auth/gmail.readonly";
/**
* Trigger Google OAuth re-consent with Calendar scope.
* After the consent, Supabase session will include provider_token with calendar access.
*/
async function connectGoogleCalendar() {
	const { error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo: `${window.location.origin}/integrations?google_calendar_connected=true`,
			scopes: CALENDAR_SCOPES,
			queryParams: {
				access_type: "offline",
				prompt: "consent"
			}
		}
	});
	if (error) throw error;
}
/**
* Trigger Google OAuth re-consent with Gmail scope.
*/
async function connectGmail() {
	const { error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo: `${window.location.origin}/integrations?gmail_connected=true`,
			scopes: GMAIL_SCOPES,
			queryParams: {
				access_type: "offline",
				prompt: "consent"
			}
		}
	});
	if (error) throw error;
}
/**
* After Google OAuth redirect, read the provider_token from the Supabase session
* and store the integration as connected in Supabase.
*/
async function handleGoogleOAuthReturn(service) {
	const { data: { session } } = await supabase.auth.getSession();
	if (!session?.provider_token) return false;
	if (typeof window !== "undefined") sessionStorage.setItem("google_provider_token", session.provider_token);
	await upsertIntegrationStatus(session.user.id, service, true, {
		google_calendar: ["calendar.readonly"],
		gmail: ["gmail.readonly"]
	}[service], { email: session.user.email });
	return true;
}
//#endregion
export { checkWhatsAppMCPConnected as a, disconnectIntegration as c, upsertIntegrationStatus as d, checkSlackMCPConnected as i, handleGoogleOAuthReturn as l, checkCalendarMCPReachable as n, connectGmail as o, checkGmailMCPReachable as r, connectGoogleCalendar as s, SLACK_MCP_URL as t, loadIntegrationStatuses as u };
