import { useEffect, useRef, useState } from "react";
import { Terminal, ChevronUp, ChevronDown } from "lucide-react";
import { traceLogSeed } from "@/lib/mock-data";

const tools = [
  "qdrant_semantic_search",
  "get_calendar_free_busy",
  "slack_thread_resolve",
  "notion_lookup_doc",
  "memory_recall",
  "calendar_propose_slot",
];
const agents = ["Agent 1", "Agent 2", "Agent 3", "Agent 4"];
const events = [
  "A2A State: Resolution achieved via 3-agent consensus debate",
  "A2A State: Dispatch ack → Composer",
  "A2A State: Negotiating slot",
  "A2A State: Confidence ↑ 0.82",
];

const mockLine = () => {
  const t = new Date().toLocaleTimeString("en-GB");
  if (Math.random() < 0.25) {
    return `{"t":"${t}","agent":"A2A","event":"${events[Math.floor(Math.random() * events.length)]}"}`;
  }
  const a = agents[Math.floor(Math.random() * agents.length)];
  const tool = tools[Math.floor(Math.random() * tools.length)];
  return `{"t":"${t}","agent":"${a}","tool":"${tool}"}`;
};

export function TraceLog() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<string[]>(traceLogSeed);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setLines((prev) => [...prev.slice(-80), mockLine()]);
    }, 1400);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, open]);

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 md:left-64">
      <div className="pointer-events-auto mx-auto max-w-5xl px-4 pb-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-lg backdrop-blur">
          <button
            onClick={() => setOpen(!open)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/40"
          >
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-xs text-foreground/80">
              Agent Orchestration Trace Log
            </span>
            <span className="ml-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint" />
              </span>
              live
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
              {open ? "Hide" : "Show"}
              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </span>
          </button>
          {open && (
            <div
              ref={scrollRef}
              className="scrollbar-calm max-h-64 overflow-y-auto border-t border-border bg-[oklch(0.18_0.02_250)] px-4 py-3 font-mono text-[11px] leading-relaxed text-[oklch(0.85_0.04_170)] animate-fade-in"
            >
              {lines.map((l, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  <span className="text-[oklch(0.6_0.04_240)]">›</span> {l}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
