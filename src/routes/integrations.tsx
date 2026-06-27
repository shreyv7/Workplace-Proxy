import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { initialIntegrations, Integration } from "../lib/mock-data";
import { Plug, CheckCircle2, AlertCircle, RefreshCw, Plus, X, Settings2, Key, HelpCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/integrations")({
  validateSearch: (search: Record<string, unknown>) => search,
  head: () => ({
    meta: [
      { title: "Integrations — Workplace Proxy" },
      {
        name: "description",
        content: "Manage the connected services feeding workspace data streams into the cognitive compiler.",
      },
    ],
  }),
  component: IntegrationsSettings,
});

const MCP_SERVERS: Record<string, string> = {
  int_slack: "http://localhost:3000",
  int_email: "http://localhost:3001",
  int_calendar: "http://localhost:3002",
};

function IntegrationsSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  
  // Modal states
  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const [slackToken, setSlackToken] = useState("");
  const [slackChannels, setSlackChannels] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [authUrlLoading, setAuthUrlLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Poll MCP health status
  const checkHealth = async () => {
    const updated = await Promise.all(
      integrations.map(async (it) => {
        const mcpUrl = MCP_SERVERS[it.id];
        if (!mcpUrl) return it; // Skip mock integrations (jira, linear, etc)

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);
          const res = await fetch(`${mcpUrl}/health`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!res.ok) throw new Error();
          const data = await res.json();
          
          let status: "connected" | "disconnected" | "error" = "disconnected";
          if (it.id === "int_slack") {
            status = data.configured ? "connected" : "disconnected";
          } else {
            status = (data.configured && data.authenticated) ? "connected" : "disconnected";
          }

          return {
            ...it,
            status,
            latency: `${Math.floor(Math.random() * 15) + 10}ms`,
            last_sync: "Just now",
          };
        } catch {
          return {
            ...it,
            status: "disconnected" as const,
            latency: "---",
          };
        }
      })
    );
    setIntegrations(updated);
  };

  // Use safe URLSearchParams parsing to guarantee zero router context crashes
  const [urlParams] = useState(() => typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null);
  const integration = urlParams ? urlParams.get("integration") : null;
  const status = urlParams ? urlParams.get("status") : null;

  useEffect(() => {
    if (integration && status === "success") {
      const integrationName = integration === "calendar" ? "Google Calendar" : "Email/Gmail";
      setFeedbackMsg({
        type: "success",
        text: `Successfully authenticated ${integrationName}!`,
      });
      const id = integration === "calendar" ? "int_calendar" : "int_email";
      setConfiguringId(id);
      
      // Clean up parameters from browser URL to prevent modal popping again on page reload
      if (typeof window !== "undefined" && window.history) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, [integration, status]);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerSync = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      setSyncingId(null);
      checkHealth();
    }, 1000);
  };

  const handleOpenConfigure = (id: string) => {
    setConfiguringId(id);
    setFeedbackMsg(null);
    // Prefill form states
    if (id === "int_slack") {
      setSlackToken("");
      setSlackChannels("");
    } else {
      setGoogleClientId("");
      setGoogleClientSecret("");
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuringId) return;

    const mcpUrl = MCP_SERVERS[configuringId];
    if (!mcpUrl) return;

    setSaveLoading(true);
    setFeedbackMsg(null);

    try {
      let body = {};
      if (configuringId === "int_slack") {
        body = {
          botToken: slackToken,
          channels: slackChannels.split(",").map(c => c.trim()).filter(Boolean)
        };
      } else {
        body = {
          clientId: googleClientId,
          clientSecret: googleClientSecret
        };
      }

      const res = await fetch(`${mcpUrl}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        throw new Error("Failed to save configuration.");
      }

      setFeedbackMsg({ type: "success", text: "Configuration saved successfully." });
      
      // If it is slack, we are done
      if (configuringId === "int_slack") {
        setTimeout(() => {
          setConfiguringId(null);
          checkHealth();
        }, 1500);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Failed to update configuration." });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!configuringId) return;
    const mcpUrl = MCP_SERVERS[configuringId];
    if (!mcpUrl) return;

    setAuthUrlLoading(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`${mcpUrl}/auth-url`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Please save OAuth client credentials first.");
      }
      const { authUrl } = await res.json();
      // Redirect or open auth URL in a new window
      window.open(authUrl, "_blank");
      setFeedbackMsg({ type: "success", text: "Consent URL opened. Please complete authentication in the browser tab." });
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Failed to retrieve consent URL." });
    } finally {
      setAuthUrlLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-8 pb-28 animate-fade-in select-none">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">External API Swarms</span>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Connected integrations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage live authentication tokens, webhook handlers, and vector parsing settings for external services.
          </p>
        </div>
      </header>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {integrations.map((it, idx) => {
          const isConnected = it.status === "connected";
          const isSyncing = syncingId === it.id;
          const isConfigurable = !!MCP_SERVERS[it.id];

          return (
            <div
              key={it.id}
              className={[
                "group relative overflow-hidden rounded-[24px] border border-white/10 dark:border-white/5 bg-gradient-to-b from-card to-card/50 p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col gap-6 animate-scale-in",
                (!isConnected && !isConfigurable) ? "opacity-50 saturate-50 hover:opacity-80 transition-all" : ""
              ].join(" ")}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Dynamic hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Top metadata */}
              <div className="relative flex items-start justify-between gap-4 z-10">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-secondary/40 text-2xl shadow-lg border border-white/20 dark:border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay rounded-2xl" />
                    <span className="relative z-10">{it.icon}</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="text-base font-extrabold text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">{it.name}</h3>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">Latency: {it.latency}</p>
                  </div>
                </div>

                <span className={[
                  "px-3 py-1.5 rounded-full text-[10px] font-extrabold tracking-widest uppercase flex items-center gap-1.5 border shadow-sm backdrop-blur-md transition-all duration-300",
                  isConnected 
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)] dark:text-rose-400"
                ].join(" ")}>
                  {isConnected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  {it.status}
                </span>
              </div>

              {/* Description */}
              <p className="relative z-10 text-sm text-muted-foreground leading-relaxed">
                {it.description}
              </p>

              {/* Permissions list */}
              <div className="relative z-10 space-y-2.5">
                <p className="text-[10px] font-extrabold text-muted-foreground/70 uppercase tracking-widest">Active scopes</p>
                <div className="flex flex-wrap gap-2">
                  {it.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="text-[11px] font-medium px-3 py-1 rounded-lg bg-secondary/50 text-secondary-foreground/90 border border-border/50 group-hover:border-border/80 group-hover:bg-secondary transition-all duration-300"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer controls */}
              <div className="relative z-10 border-t border-border/40 pt-5 mt-auto flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity">Synced {it.last_sync}</span>
                
                <div className="flex gap-2.5">
                  <button
                    onClick={() => triggerSync(it.id)}
                    disabled={isSyncing}
                    className="h-9 px-4 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm hover:bg-foreground hover:text-background hover:border-foreground hover:shadow-lg font-bold flex items-center gap-2 transition-all duration-300"
                  >
                    <RefreshCw className={["h-3.5 w-3.5", isSyncing ? "animate-spin text-mint" : ""].join(" ")} />
                    Sync
                  </button>
                  {isConfigurable && (
                    <button
                      onClick={() => handleOpenConfigure(it.id)}
                      className="h-9 px-4 rounded-xl border border-transparent bg-foreground text-background shadow-md hover:shadow-xl hover:-translate-y-0.5 hover:bg-primary font-bold transition-all duration-300"
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

      {/* Configuration Modal */}
      {configuringId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setConfiguringId(null)} />
          
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
            <button
              onClick={() => setConfiguringId(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <header className="mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-xl">
                  {integrations.find(i => i.id === configuringId)?.icon}
                </div>
                <div>
                  <h2 className="text-base font-extrabold tracking-tight">
                    Configure {integrations.find(i => i.id === configuringId)?.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Connect local MCP swarm server to real-time APIs.
                  </p>
                </div>
              </div>
            </header>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              {configuringId === "int_slack" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Slack Access Token</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <input
                        type="password"
                        placeholder="xoxb-... or xoxp-... / xoxe..."
                        value={slackToken}
                        onChange={(e) => setSlackToken(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background/50 pl-10 pr-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-hidden transition-all"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Provide the Bot OAuth Token (starts with <code>xoxb-</code>) or Access Token (starts with <code>xoxp-</code> / <code>xoxe</code>) from your Slack App page.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Channel Filter (Comma-separated IDs)</label>
                    <input
                      type="text"
                      placeholder="C0123456789, C9876543210"
                      value={slackChannels}
                      onChange={(e) => setSlackChannels(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-hidden transition-all"
                      required
                    />
                    <p className="text-[10px] text-muted-foreground leading-normal font-sans">
                      List the channel IDs the bot has been invited to. The Interceptor monitors these channels.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Google OAuth Client ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 123456-abcdef.apps.googleusercontent.com"
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-hidden transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Google OAuth Client Secret</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••••••"
                      value={googleClientSecret}
                      onChange={(e) => setGoogleClientSecret(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-hidden transition-all"
                      required
                    />
                  </div>

                  <div className="rounded-xl bg-secondary/50 border border-border/40 p-3.5 flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground block mb-0.5">Instructions:</span>
                      1. Save the credentials above.<br />
                      2. Ensure the redirect URI in Google Cloud Console matches:<br />
                      <code className="text-foreground bg-secondary px-1 py-0.5 rounded text-[10px] font-mono">
                        {configuringId === "int_email" ? "http://localhost:3001/oauth2callback" : "http://localhost:3002/oauth2callback"}
                      </code><br />
                      3. Click <strong>"Authenticate Account"</strong> to generate token.
                    </div>
                  </div>
                </>
              )}

              {feedbackMsg && (
                <div className={[
                  "p-3 rounded-xl text-xs font-medium border flex items-center gap-2",
                  feedbackMsg.type === "success" 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" 
                    : "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
                ].join(" ")}>
                  <span>{feedbackMsg.text}</span>
                </div>
              )}

              <footer className="flex items-center justify-end gap-3 border-t border-border/50 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setConfiguringId(null)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                
                <div className="flex gap-2">
                  {configuringId !== "int_slack" && (
                    <button
                      type="button"
                      disabled={authUrlLoading}
                      onClick={handleGoogleAuth}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/20 bg-cyan-950/10 text-cyan-500 hover:bg-cyan-500/10 text-xs font-bold px-4 py-2.5 transition-all"
                    >
                      {authUrlLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Authenticate Account
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-foreground text-background hover:opacity-90 text-xs font-semibold px-5 py-2.5 transition-all shadow-sm"
                  >
                    {saveLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-background" /> : null}
                    Save Configuration
                  </button>
                </div>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

