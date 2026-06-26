import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { initialAgents, AgentNode } from "../lib/mock-data";
import { Bot, Zap, ShieldAlert, Cpu, Sparkles, Network, RefreshCw, Layers } from "lucide-react";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agent Swarm — Workplace Proxy" },
      {
        name: "description",
        content: "Explore the live operational status, tool triggers, latency, and consensus logic of active AI agents.",
      },
    ],
  }),
  component: AgentSwarm,
});

function AgentSwarm() {
  const [agents, setAgents] = useState<AgentNode[]>(initialAgents);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate live-state telemetry updates
  useEffect(() => {
    const id = setInterval(() => {
      setAgents((prev) =>
        prev.map((a) => {
          // Keep Interceptor mostly idle, randomise others
          if (a.id === "agent_interceptor") return a;
          
          const statuses: AgentNode["status"][] = ["idle", "processing", "sleeping"];
          const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
          const newLatency = `${Math.floor(Math.random() * 80) + 15}ms`;
          const newConf = Math.floor(Math.random() * 10) + 89;

          return {
            ...a,
            status: newStatus,
            latency: newLatency,
            confidence: newConf,
          };
        })
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const triggerManualDiagnostics = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const activeCount = agents.filter((a) => a.status === "processing").length;

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-8 pb-28 animate-fade-in select-none">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">System Grid</span>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Agent Network Core
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Observe the active decision pipeline. {activeCount} agents are currently processing signals in parallel.
          </p>
        </div>

        <button 
          onClick={triggerManualDiagnostics}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-secondary/40 text-xs font-semibold px-4 py-2.5 transition-all text-foreground"
        >
          <RefreshCw className={["h-4.5 w-4.5 text-muted-foreground", isRefreshing ? "animate-spin text-mint" : ""].join(" ")} />
          Run System Diagnostics
        </button>
      </header>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {agents.map((agent) => {
          const isIdle = agent.status === "idle";
          const isProcessing = agent.status === "processing";
          
          let statusText = "Sleeping";
          let statusColor = "text-muted-foreground bg-secondary/80";
          let dotColor = "bg-muted-foreground/50";
          let cardBorder = "border-border";
          
          if (isProcessing) {
            statusText = "Processing";
            statusColor = "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400";
            dotColor = "bg-indigo-500 animate-ping";
            cardBorder = "border-indigo-500/35 ring-1 ring-indigo-500/10";
          } else if (isIdle) {
            statusText = "Online (Idle)";
            statusColor = "text-mint bg-mint-soft/30";
            dotColor = "bg-mint shadow-[0_0_4px_var(--mint)]";
          }

          return (
            <div 
              key={agent.id} 
              className={["relative rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md flex flex-col gap-4", cardBorder].join(" ")}
            >
              {/* Top Details */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/80">
                  <Bot className="h-5 w-5 text-slate-cool" strokeWidth={1.5} />
                </div>
                <span className={["px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wide flex items-center gap-1.5", statusColor].join(" ")}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className={["absolute inline-flex h-full w-full rounded-full opacity-70", dotColor].join(" ")} />
                    <span className={["relative inline-flex h-1.5 w-1.5 rounded-full", dotColor].join(" ")} />
                  </span>
                  {statusText}
                </span>
              </div>

              {/* Title & Role */}
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">{agent.name}</h3>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{agent.role}</p>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                {agent.description}
              </p>

              {/* Telemetry Stats */}
              <div className="border-t border-border/60 pt-4 mt-auto space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Task</span>
                  <span className="font-semibold text-foreground truncate max-w-[140px]">{agent.current_task || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Tool</span>
                  <span className="font-mono text-[10px] text-indigo-500 bg-secondary/60 px-1 rounded truncate max-w-[140px]">
                    {agent.tool_in_use || "idle"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agent Latency</span>
                  <span className="font-mono text-foreground font-semibold">{agent.latency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consensus Weight</span>
                  <span className="font-mono text-foreground font-semibold">{agent.confidence}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Consensus Engine Graphic Section */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border/70">
          <Network className="h-4.5 w-4.5 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Consensus Engine (State Matrix)</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Real-time debate agreement & semantic resolving vector weights</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Diagnostic Panel */}
          <div className="lg:col-span-1 border border-border/75 rounded-2xl p-5 bg-secondary/15 space-y-4">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Engine Status</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Consensus Mode</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-mint" /> 4-Swarm Agreement
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Decoupled Queue</span>
                <span className="font-semibold text-foreground">0 Pending Signals</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Avg Swarm Debate Cycles</span>
                <span className="font-semibold text-foreground">3.2 passes</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Average Consensus Confidence</span>
                <span className="font-semibold text-mint text-sm">96.4%</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 animate-pulse-soft" />
              <span>Vector matching is optimized according to corporate memory bindings.</span>
            </div>
          </div>

          {/* Network Graphic */}
          <div className="lg:col-span-2 relative flex items-center justify-center border border-border/60 rounded-2xl bg-card p-10 h-64 overflow-hidden">
            {/* Visual background rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 dark:opacity-10">
              <div className="border border-foreground rounded-full w-48 h-48 animate-pulse" />
              <div className="absolute border border-foreground rounded-full w-72 h-72 animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            {/* Simulated interactive node graph */}
            <div className="relative flex items-center justify-center gap-16 font-mono text-[10px] z-10 w-full max-w-md">
              {/* Left Node */}
              <div className="flex flex-col items-center gap-1">
                <div className="h-12 w-12 rounded-xl bg-mint-soft border border-mint flex items-center justify-center text-mint font-bold shadow-xs">
                  A1
                </div>
                <span className="text-foreground font-semibold">Ingest</span>
              </div>

              {/* Center cluster of arrows/lines */}
              <div className="flex-1 flex flex-col gap-2 items-center text-muted-foreground">
                <div className="h-0.5 bg-gradient-to-r from-mint via-indigo-500 to-lavender w-full relative">
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 w-1.5 bg-mint rounded-full animate-pulse-soft" style={{ left: "20%" }} />
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 w-1.5 bg-indigo-500 rounded-full animate-pulse-soft" style={{ left: "60%" }} />
                </div>
                <div className="text-[9px] uppercase tracking-wider font-semibold">Debate Weight Vector</div>
              </div>

              {/* Right Node */}
              <div className="flex flex-col items-center gap-1">
                <div className="h-12 w-12 rounded-xl bg-lavender-soft border border-lavender flex items-center justify-center text-lavender font-bold shadow-xs">
                  A4
                </div>
                <span className="text-foreground font-semibold">Brief</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
