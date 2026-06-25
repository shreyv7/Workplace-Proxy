import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { initialMessages, ClarityMessage } from "../lib/mock-data";
import { Mail, MessageSquare, Layers, Users, AlertCircle, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Communication Inbox — Project Clarity" },
      {
        name: "description",
        content: "All intercepted communication threads across your connected channels.",
      },
    ],
  }),
  component: InboxPage,
});

function InboxPage() {
  const [messages, setMessages] = useState<ClarityMessage[]>(initialMessages);
  const [isSyncing, setIsSyncing] = useState(false);

  const triggerGlobalSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  const getSourceIcon = (source: ClarityMessage["source"]) => {
    switch (source) {
      case "slack":
        return <MessageSquare className="h-4 w-4 text-emerald-500" />;
      case "email":
        return <Mail className="h-4 w-4 text-indigo-500" />;
      case "jira":
        return <Layers className="h-4 w-4 text-blue-500" />;
      case "teams":
        return <Users className="h-4 w-4 text-sky-500" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getImportanceStyles = (importance: ClarityMessage["importance"]) => {
    switch (importance) {
      case "high":
        return "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30";
      case "medium":
        return "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30";
      default:
        return "bg-secondary text-muted-foreground border-transparent";
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-8 pb-28 animate-fade-in select-none">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Triage Stream</span>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Communication Inbox
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View the raw background messages currently intercepted and aligned by the AI consensus layer.
          </p>
        </div>

        <button 
          onClick={triggerGlobalSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-secondary/40 text-xs font-semibold px-4 py-2.5 transition-all text-foreground"
        >
          <RefreshCw className={["h-4.5 w-4.5 text-muted-foreground", isSyncing ? "animate-spin text-mint" : ""].join(" ")} />
          Sync All Channels
        </button>
      </header>

      {/* Sync Telemetry cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Triage Queue</span>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">{messages.filter(m => !m.acknowledged).length} Pending</p>
          <p className="text-xs text-muted-foreground mt-1">Awaiting calendar block confirmation</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sync State</span>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-mint">Perfect</p>
          <p className="text-xs text-muted-foreground mt-1">Slack, Email, Jira, and Teams online</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Consensus Engine</span>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-indigo-500">Active</p>
          <p className="text-xs text-muted-foreground mt-1">Swarm resolving threshold set to 90% cert</p>
        </div>
      </div>

      {/* Message Timeline */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Chronological Feed</h3>
        <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border/60 bg-card">
          {messages.map((m) => {
            const importanceStyle = getImportanceStyles(m.importance);

            return (
              <div 
                key={m.message_id} 
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/15 transition-colors"
              >
                {/* Source & Sender */}
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary shrink-0">
                    {getSourceIcon(m.source)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground">{m.sender_name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{m.sender_role}</span>
                    </div>
                    {/* Raw Text preview */}
                    <p className="mt-1 text-xs text-foreground/80 leading-relaxed font-mono">
                      "{m.original_text}"
                    </p>
                  </div>
                </div>

                {/* Status elements */}
                <div className="flex items-center gap-4 shrink-0 justify-end sm:justify-start">
                  <span className={["px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border", importanceStyle].join(" ")}>
                    {m.importance}
                  </span>
                  
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground font-mono block">Assigned agent:</span>
                    <span className="text-[10px] font-semibold text-foreground font-mono">{m.agent_assigned}</span>
                  </div>

                  <div className="h-9 w-px bg-border/60" />

                  <div>
                    {m.acknowledged ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-mint font-semibold bg-mint-soft/30 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Scheduled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-indigo-500 font-semibold bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-lg">
                        <AlertCircle className="h-3.5 w-3.5" /> Triage lock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
