import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Loader2, FlaskConical, RefreshCw } from "lucide-react";
import { useAuth } from "../../personalisation/auth/useAuth";
import { supabase } from "../lib/supabase";

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? "http://localhost:8000";

export const Route = createFileRoute("/test-ui-gcp")({
  head: () => ({
    meta: [
      { title: "GCP Integration Test — Workplace Proxy" },
      { name: "description", content: "Verify Google OAuth token propagation to Calendar and Gmail MCP servers." },
    ],
  }),
  component: TestGCPPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface MCPServiceResult {
  reachable: boolean;
  token_forwarded: boolean;
  demo_mode: boolean;
  data_count: number;
  sample: unknown[];
  error: string | null;
}

interface GCPTestResponse {
  token_provided: boolean;
  tested_at: string;
  calendar: MCPServiceResult;
  gmail: MCPServiceResult;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
        ok
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
          : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30",
      ].join(" ")}
    >
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {label}
    </span>
  );
}

function ServiceCard({ name, result }: { name: string; result: MCPServiceResult }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-bold text-foreground">{name}</h3>
        <div className="flex gap-2 flex-wrap">
          <StatusBadge ok={result.reachable} label={result.reachable ? "Reachable" : "Unreachable"} />
          <StatusBadge
            ok={!result.demo_mode}
            label={result.demo_mode ? "Demo data" : "Real Google API"}
          />
          <StatusBadge ok={result.token_forwarded} label={result.token_forwarded ? "Bearer sent" : "No token"} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg bg-secondary/50 px-3 py-2">
          <p className="text-muted-foreground font-mono uppercase tracking-widest text-[9px] mb-0.5">
            Items returned
          </p>
          <p className="font-bold text-foreground">{result.data_count}</p>
        </div>
        <div className="rounded-lg bg-secondary/50 px-3 py-2">
          <p className="text-muted-foreground font-mono uppercase tracking-widest text-[9px] mb-0.5">
            Auth mode
          </p>
          <p className="font-bold text-foreground">
            {result.demo_mode ? "Demo / mock" : "Live Google APIs"}
          </p>
        </div>
      </div>

      {result.error && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 px-3 py-2 text-xs text-rose-700 dark:text-rose-400 font-mono break-all">
          {result.error}
        </div>
      )}

      {result.sample.length > 0 && (
        <details>
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground font-mono tracking-wide select-none">
            Sample data ({result.sample.length} item{result.sample.length !== 1 ? "s" : ""})
          </summary>
          <pre className="mt-2 overflow-auto rounded-lg bg-secondary/50 p-3 text-[10px] text-foreground/80 font-mono max-h-48">
            {JSON.stringify(result.sample, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function TestGCPPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GCPTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<"present" | "absent" | "unknown">("unknown");

  const runTest = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setTokenStatus("unknown");

    try {
      // Read the live Supabase session — provider_token is the Google OAuth access token
      // issued after signInWithOAuth. It is only present immediately after login/consent;
      // it does not survive a hard page refresh.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.provider_token ?? null;
      setTokenStatus(token ? "present" : "absent");

      if (!token) {
        setError(
          "No provider_token found in the current Supabase session. " +
            "Go to Integrations → click Connect on Google Calendar or Gmail, " +
            "complete the OAuth consent, then return here and run the test again. " +
            "(The token is only available immediately after OAuth — it is not persisted across page refreshes.)"
        );
        return;
      }

      const resp = await fetch(`${BACKEND_URL}/api/v1/test-gcp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          google_access_token: token,
          user_id: user?.id ?? "test_user",
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Backend ${resp.status}: ${text}`);
      }

      const data = (await resp.json()) as GCPTestResponse;
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const bothReal =
    result && !result.calendar.demo_mode && !result.gmail.demo_mode;
  const bothReachable =
    result && result.calendar.reachable && result.gmail.reachable;

  return (
    <div className="mx-auto max-w-3xl px-6 pt-8 pb-28 animate-fade-in">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 shrink-0">
            <FlaskConical className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
            Diagnostic Tool
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Google OAuth Integration Test
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-prose">
          Reads{" "}
          <code className="font-mono text-xs bg-secondary px-1 py-0.5 rounded">
            session.provider_token
          </code>{" "}
          from your active Supabase session and calls both MCP servers with{" "}
          <code className="font-mono text-xs bg-secondary px-1 py-0.5 rounded">
            Authorization: Bearer &lt;token&gt;
          </code>
          . Confirms whether the Calendar and Gmail integrations are reaching real
          Google APIs or falling back to demo data.
        </p>
      </header>

      {/* How it works */}
      <div className="mb-6 rounded-2xl border border-border bg-card/50 p-4 text-xs text-muted-foreground space-y-1.5">
        <p className="font-semibold text-foreground text-[11px] uppercase tracking-widest font-mono mb-2">
          How it works
        </p>
        <p>
          1. Reads <code className="font-mono bg-secondary px-1 rounded">provider_token</code> from the in-memory Supabase session (Google OAuth token).
        </p>
        <p>
          2. Sends <code className="font-mono bg-secondary px-1 rounded">POST /api/v1/test-gcp</code> to the Role 2 orchestrator with the token.
        </p>
        <p>
          3. Orchestrator calls <code className="font-mono bg-secondary px-1 rounded">GET /calendar/today</code> and <code className="font-mono bg-secondary px-1 rounded">GET /gmail/threads</code> with <code className="font-mono bg-secondary px-1 rounded">Authorization: Bearer</code>.
        </p>
        <p>
          4. Demo-mode is detected from the response: real Calendar events have{" "}
          <code className="font-mono bg-secondary px-1 rounded">block_type: "meeting"</code> only; real Gmail thread IDs are hex strings, not{" "}
          <code className="font-mono bg-secondary px-1 rounded">demo_thread_*</code>.
        </p>
      </div>

      {/* Run button */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <button
          onClick={runTest}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background hover:opacity-90 text-sm font-semibold px-5 py-2.5 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running…
            </>
          ) : result ? (
            <>
              <RefreshCw className="h-4 w-4" />
              Run again
            </>
          ) : (
            <>
              <FlaskConical className="h-4 w-4" />
              Run integration test
            </>
          )}
        </button>

        {tokenStatus === "present" && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            provider_token found in session
          </span>
        )}
        {tokenStatus === "absent" && (
          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            No provider_token — connect a Google integration first
          </span>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-400 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Top-level summary */}
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono">
              {new Date(result.tested_at).toLocaleTimeString()}
            </span>
            <StatusBadge
              ok={result.token_provided}
              label={result.token_provided ? "Token forwarded" : "No token — demo mode"}
            />
            <StatusBadge
              ok={!!bothReachable}
              label={bothReachable ? "Both MCP servers reachable" : "MCP server(s) unreachable"}
            />
            <StatusBadge
              ok={!!bothReal}
              label={bothReal ? "Real Google APIs confirmed" : "Demo/mock data returned"}
            />
          </div>

          <ServiceCard name="📅  Calendar MCP  (localhost:3002)" result={result.calendar} />
          <ServiceCard name="✉️  Gmail MCP  (localhost:3001)" result={result.gmail} />

          {/* Full JSON */}
          <details>
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground font-mono select-none">
              Raw JSON response
            </summary>
            <pre className="mt-2 overflow-auto rounded-xl bg-secondary/50 p-4 text-[10px] text-foreground/80 font-mono max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
