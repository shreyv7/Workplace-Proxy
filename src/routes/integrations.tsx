import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "../../personalisation/auth/useAuth";
import {
  type IntegrationService,
  type IntegrationStatus,
  loadIntegrationStatuses,
  upsertIntegrationStatus,
  disconnectIntegration,
  checkSlackMCPConnected,
  checkCalendarMCPReachable,
  checkGmailMCPReachable,
  connectGoogleCalendar,
  connectGmail,
  connectSlack,
  handleGoogleOAuthReturn,
} from "../lib/integrations";

export const Route = createFileRoute("/integrations")({
  validateSearch: (search: Record<string, unknown>) => search,
  head: () => ({
    meta: [
      { title: "Integrations — Workplace Proxy" },
      { name: "description", content: "Connect your workplace services to the cognitive compiler." },
    ],
  }),
  component: IntegrationsPage,
});

// ── Integration definitions ───────────────────────────────────────────────────

interface IntegrationDef {
  id: IntegrationService | string;
  name: string;
  icon: string;
  description: string;
  permissions: string[];
  latency: string;
  /** Managed integrations have live OAuth; others are demo/future */
  managed: boolean;
}

const INTEGRATION_DEFS: IntegrationDef[] = [
  {
    id: "google_calendar",
    name: "Google Calendar",
    icon: "📅",
    description: "Checks your real calendar availability to slot translated tasks into optimal deep-work blocks.",
    permissions: ["Read Events", "Free/Busy Lookup"],
    latency: "25ms",
    managed: true,
  },
  {
    id: "gmail",
    name: "Gmail",
    icon: "✉️",
    description: "Reads email threads so the Contextualizer agent can enrich analysis with actual message history.",
    permissions: ["Read Threads", "Read Messages"],
    latency: "120ms",
    managed: true,
  },
  {
    id: "slack",
    name: "Slack",
    icon: "💬",
    description: "Ingests messages from channels and DMs so the Interceptor agent processes your real Slack workload.",
    permissions: ["Read Channels", "Read Messages", "Resolve User Names"],
    latency: "14ms",
    managed: true,
  },
  {
    id: "jira",
    name: "Jira Cloud",
    icon: "🎫",
    description: "Monitors active sprints, assignments, and ticket priority tags.",
    permissions: ["Read Tickets", "Update Status"],
    latency: "95ms",
    managed: false,
  },
  {
    id: "linear",
    name: "Linear",
    icon: "⚡",
    description: "Tracks engineering issues and product backlogs.",
    permissions: ["Read Issues", "Assign Tasks"],
    latency: "45ms",
    managed: false,
  },
  {
    id: "github",
    name: "GitHub",
    icon: "🐙",
    description: "Parses pull request reviews, comments, and issue updates.",
    permissions: ["Read Repository", "Read Notifications"],
    latency: "30ms",
    managed: false,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

function IntegrationsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [statuses, setStatuses]     = useState<Map<string, IntegrationStatus>>(new Map());
  const [syncing, setSyncing]       = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // ── Load statuses ───────────────────────────────────────────────────────────

  const refreshStatuses = useCallback(async () => {
    if (!user?.id) return;
    setLoadingState(true);
    try {
      const fromDB = await loadIntegrationStatuses(user.id);

      // Layer in live MCP server checks for managed integrations
      const calReachable   = await checkCalendarMCPReachable();
      const gmailReachable = await checkGmailMCPReachable();
      const slackConnected = await checkSlackMCPConnected();

      // Merge live MCP status into what we have from DB
      if (slackConnected && !fromDB.get("slack")?.connected) {
        await upsertIntegrationStatus(user.id, "slack", true, ["channels:history", "channels:read", "users:read"]);
        fromDB.set("slack", { service: "slack", connected: true, scopes: ["channels:history", "channels:read", "users:read"], connected_at: new Date().toISOString(), metadata: {} });
      }

      // If MCP server is unreachable, mark as disconnected in UI (but don't write to DB)
      const merged = new Map(fromDB);
      if (!calReachable) merged.set("google_calendar", { ...(fromDB.get("google_calendar") || { service: "google_calendar", scopes: [], connected_at: null, metadata: {} }), connected: false });
      if (!gmailReachable) merged.set("gmail", { ...(fromDB.get("gmail") || { service: "gmail", scopes: [], connected_at: null, metadata: {} }), connected: false });

      setStatuses(merged);
    } catch (err: unknown) {
      console.warn("[integrations] status load error:", err);
    } finally {
      setLoadingState(false);
    }
  }, [user?.id]);

  // ── Handle OAuth return params ──────────────────────────────────────────────

  useEffect(() => {
    if (authLoading || !user?.id) return;

    const params = new URLSearchParams(window.location.search);

    const handleReturn = async () => {
      if (params.get("google_calendar_connected") === "true") {
        const ok = await handleGoogleOAuthReturn("google_calendar");
        if (ok) showNotification("Google Calendar connected successfully.");
        window.history.replaceState({}, "", "/integrations");
      }
      if (params.get("gmail_connected") === "true") {
        const ok = await handleGoogleOAuthReturn("gmail");
        if (ok) showNotification("Gmail connected successfully.");
        window.history.replaceState({}, "", "/integrations");
      }
      if (params.get("slack_connected") === "true") {
        await upsertIntegrationStatus(user.id, "slack", true, ["channels:history", "channels:read", "users:read"]);
        showNotification("Slack connected successfully.");
        window.history.replaceState({}, "", "/integrations");
      }
      if (params.get("slack_error")) {
        setError(`Slack connection failed: ${params.get("slack_error")}`);
        window.history.replaceState({}, "", "/integrations");
      }

      await refreshStatuses();
    };

    handleReturn();
  }, [authLoading, user?.id, refreshStatuses]);

  useEffect(() => {
    if (!authLoading && user?.id) refreshStatuses();
  }, [authLoading, user?.id, refreshStatuses]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  function showNotification(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  }

  async function handleConfigure(id: string) {
    if (!user) return;
    setConnecting(id);
    setError(null);

    try {
      if (id === "google_calendar") {
        await connectGoogleCalendar();
        // Browser will navigate away — execution resumes only if redirect blocked
      } else if (id === "gmail") {
        await connectGmail();
      } else if (id === "slack") {
        connectSlack();
      } else {
        showNotification(`${id} integration coming soon.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to connect ${id}: ${msg}`);
    } finally {
      setConnecting(null);
    }
  }

  async function handleDisconnect(id: string) {
    if (!user) return;
    setSyncing(id);
    await disconnectIntegration(user.id, id as IntegrationService);
    await refreshStatuses();
    setSyncing(null);
    showNotification(`${id} disconnected.`);
  }

  async function handleSync(id: string) {
    setSyncing(id);
    await new Promise(r => setTimeout(r, 800));
    await refreshStatuses();
    setSyncing(null);
    showNotification(`${id} status refreshed.`);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-8 pb-28 animate-fade-in select-none">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">MCP Integration Layer</span>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Connected integrations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            OAuth-authenticated MCP bridges for Calendar, Gmail, and Slack. Powered by real API calls.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background hover:opacity-90 text-xs font-semibold px-4 py-2.5 transition-all shadow-sm"
          onClick={refreshStatuses}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh All
        </button>
      </header>

      {/* Notification banner */}
      {notification && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {notification}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-400 font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600">✕</button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {INTEGRATION_DEFS.map((def, idx) => {
          const status     = statuses.get(def.id);
          const connected  = !!(status?.connected);
          const isSyncing  = syncing === def.id;
          const isConnecting = connecting === def.id;

          return (
            <div
              key={def.id}
              className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col gap-4 animate-scale-in"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Loading overlay */}
              {loadingState && (
                <div className="absolute inset-0 rounded-2xl bg-card/70 flex items-center justify-center z-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Top metadata */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/80 text-xl shadow-2xs group-hover:scale-105 transition-transform duration-300">
                    {def.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-1.5">
                      {def.name}
                      {def.managed && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30">
                          LIVE
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-mono">MCP latency: {def.latency}</p>
                  </div>
                </div>

                <span className={[
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 border flex-shrink-0",
                  connected
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                    : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30",
                ].join(" ")}>
                  {connected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  {connected ? "connected" : "disconnected"}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">{def.description}</p>

              {/* Scopes */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  {connected && status?.scopes?.length ? "Granted scopes" : "Required scopes"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(connected && status?.scopes?.length ? status.scopes : def.permissions).map(perm => (
                    <span
                      key={perm}
                      className="text-[11px] font-medium px-3 py-1 rounded-lg bg-secondary/50 text-secondary-foreground/90 border border-border/50 group-hover:border-border/80 group-hover:bg-secondary transition-all duration-300"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Connected-at */}
              {connected && status?.connected_at && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  Connected {new Date(status.connected_at).toLocaleString()}
                </p>
              )}

              {/* Footer controls */}
              <div className="border-t border-border/50 pt-4 mt-auto flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground font-mono">
                  {connected ? "Active" : def.managed ? "Requires OAuth" : "Coming soon"}
                </span>

                <div className="flex gap-2">
                  {connected && (
                    <button
                      onClick={() => handleSync(def.id)}
                      disabled={isSyncing}
                      className="h-8 px-3 rounded-lg border border-border bg-card hover:bg-secondary/40 text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1.5 transition-colors text-[11px]"
                    >
                      <RefreshCw className={["h-3.5 w-3.5", isSyncing ? "animate-spin text-mint" : ""].join(" ")} />
                      Sync
                    </button>
                  )}

                  {def.managed && (
                    <button
                      onClick={() => connected ? handleDisconnect(def.id) : handleConfigure(def.id)}
                      disabled={isConnecting || isSyncing}
                      className={[
                        "h-8 px-3 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors text-[11px]",
                        connected
                          ? "border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400"
                          : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400",
                        (isConnecting || isSyncing) ? "opacity-60 cursor-not-allowed" : "",
                      ].join(" ")}
                    >
                      {isConnecting
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting…</>
                        : connected
                          ? "Disconnect"
                          : <><ExternalLink className="h-3.5 w-3.5" />Connect</>
                      }
                    </button>
                  )}

                  {!def.managed && (
                    <button
                      disabled
                      className="h-8 px-3 rounded-lg border border-border bg-card text-muted-foreground/50 font-semibold text-[11px] cursor-not-allowed"
                    >
                      Configure
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Setup instructions for non-connected managed integrations */}
      {!loadingState && !authLoading && user && [...INTEGRATION_DEFS.filter(d => d.managed)].some(d => !statuses.get(d.id)?.connected) && (
        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-sm font-bold text-foreground mb-3">Setup instructions</h2>
          <div className="space-y-3 text-xs text-muted-foreground">
            {!statuses.get("google_calendar")?.connected && (
              <p><span className="font-semibold text-foreground">Google Calendar:</span> Click Connect above — your Google account (already signed in) will be asked to grant calendar read access. No separate login required.</p>
            )}
            {!statuses.get("gmail")?.connected && (
              <p><span className="font-semibold text-foreground">Gmail:</span> Click Connect above — grants Gmail read access to your signed-in Google account.</p>
            )}
            {!statuses.get("slack")?.connected && (
              <p><span className="font-semibold text-foreground">Slack:</span> Requires a Slack App. Create one at <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">api.slack.com/apps</a>, add scopes <code>channels:history channels:read users:read</code>, set redirect URI to <code>http://localhost:3000/oauth/callback</code>, then set <code>SLACK_CLIENT_ID</code> and <code>SLACK_CLIENT_SECRET</code> in <code>slack-mcp-server/.env</code>.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
