import { useEffect, useRef, useState } from "react";
import { Terminal, ChevronUp, ChevronDown } from "lucide-react";
import { traceLogSeed } from "../lib/mock-data";

const tools = [
  "qdrant_semantic_search",
  "get_calendar_free_busy",
  "slack_thread_resolve",
  "notion_lookup_doc",
  "memory_recall",
  "calendar_propose_slot",
];
const agents = ["Interceptor Agent", "Context Agent", "Scheduler Agent", "Translator Agent"];
const events = [
  "Swarm Core: Consensus achieved on scheduling priority",
  "A2A State: Dispatch briefing ack → Composer",
  "A2A State: Proposing calendar conflict resolution",
  "Swarm Core: Consensus confidence updated to 94%",
];

const mockLine = () => {
  const t = new Date().toLocaleTimeString("en-GB");
  if (Math.random() < 0.3) {
    return `{"t":"${t}","agent":"Consensus Swarm","event":"${events[Math.floor(Math.random() * events.length)]}"}`;
  }
  const a = agents[Math.floor(Math.random() * agents.length)];
  const tool = tools[Math.floor(Math.random() * tools.length)];
  return `{"t":"${t}","agent":"${a}","tool":"${tool}","msg":"Invoked system lookup call successfully"}`;
};

export function TraceLog() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<string[]>(traceLogSeed);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setLines((prev) => [...prev.slice(-80), mockLine()]);
    }, 1800);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, open]);

  const parseLogLine = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      return (
        <div className="flex items-start gap-2.5 hover:bg-white/5 py-0.5 px-1 rounded transition-colors">
          <span className="text-[oklch(0.55_0.03_240)] shrink-0 font-medium font-mono">[{parsed.t}]</span>
          <span className="text-mint shrink-0 font-semibold">{parsed.agent}</span>
          {parsed.tool && (
            <span className="text-[oklch(0.7_0.05_295)] font-medium font-mono shrink-0">({parsed.tool})</span>
          )}
          <span className="text-white/80 select-all font-mono">
            {parsed.event || parsed.msg || "Executing agent routine"}
          </span>
        </div>
      );
    } catch {
      return <div className="text-white/70 font-mono py-0.5">{raw}</div>;
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 md:left-64">
      <div className="pointer-events-auto mx-auto max-w-5xl px-4 pb-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-lg backdrop-blur">
          <button
            onClick={() => setOpen(!open)}
            className="flex w-full items-center gap-3 px-4.5 py-3 text-left text-sm transition-colors hover:bg-muted/40"
          >
            <Terminal className="h-4.5 w-4.5 text-muted-foreground" />
            <span className="font-semibold text-xs tracking-tight text-foreground/80">
              Agent Swarm Orchestration Trace
            </span>
            <span className="ml-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_4px_var(--mint)]" />
              </span>
              live telemetry
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
              {open ? "Minimize" : "Expand"}
              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </span>
          </button>
          {open && (
            <div
              ref={scrollRef}
              className="scrollbar-calm max-h-64 overflow-y-auto border-t border-border bg-[oklch(0.18_0.02_250)] px-4 py-3.5 leading-relaxed animate-fade-in"
            >
              <div className="flex flex-col gap-1">
                {lines.map((l, i) => (
                  <div key={i}>{parseLogLine(l)}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
