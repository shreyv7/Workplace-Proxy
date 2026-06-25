import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { initialIntegrations, Integration } from "../lib/mock-data";
import { Plug, CheckCircle2, AlertCircle, RefreshCw, Plus } from "lucide-react";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — Project Clarity" },
      {
        name: "description",
        content: "Manage the connected services feeding workspace data streams into the cognitive compiler.",
      },
    ],
  }),
  component: IntegrationsSettings,
});

function IntegrationsSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const triggerSync = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      setSyncingId(null);
      setIntegrations((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, last_sync: "Just now", latency: `${Math.floor(Math.random() * 50) + 15}ms` } : it
        )
      );
    }, 1000);
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

        <button className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background hover:opacity-90 text-xs font-semibold px-4.5 py-2.5 transition-all shadow-sm">
          <Plus className="h-4 w-4" />
          Connect New Account
        </button>
      </header>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {integrations.map((it, idx) => {
          const isConnected = it.status === "connected";
          const isSyncing = syncingId === it.id;

          return (
            <div
              key={it.id}
              className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col gap-4 animate-scale-in"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Top metadata */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/80 text-xl shadow-2xs group-hover:scale-105 transition-transform duration-300">
                    {it.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground tracking-tight">{it.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">Sync latency: {it.latency}</p>
                  </div>
                </div>

                <span className={[
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 border",
                  isConnected 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                    : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
                ].join(" ")}>
                  {isConnected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  {it.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {it.description}
              </p>

              {/* Permissions list */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Active scopes</p>
                <div className="flex flex-wrap gap-1.5">
                  {it.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="text-[9px] font-mono px-2 py-0.5 rounded bg-secondary/60 text-muted-foreground border border-border/40"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer controls */}
              <div className="border-t border-border/50 pt-4 mt-auto flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground font-mono">Synced {it.last_sync}</span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => triggerSync(it.id)}
                    disabled={isSyncing}
                    className="h-8 px-3 rounded-lg border border-border bg-card hover:bg-secondary/40 text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1.5 transition-colors text-[11px]"
                  >
                    <RefreshCw className={["h-3.5 w-3.5", isSyncing ? "animate-spin text-mint" : ""].join(" ")} />
                    Sync
                  </button>
                  <button className="h-8 px-3 rounded-lg border border-border bg-card hover:bg-secondary/40 text-muted-foreground hover:text-foreground font-semibold transition-colors text-[11px]">
                    Configure
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
