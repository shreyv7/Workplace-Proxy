import { useState } from "react";
import { Check, Lock, Brain, Sparkles, HelpCircle } from "lucide-react";
import type { CalendarBlock } from "../lib/mock-data";

type Props = {
  blocks: CalendarBlock[];
  onAcknowledge: (id: string) => void;
};

const START_HOUR = 9;
const END_HOUR = 18;
const HOUR_HEIGHT = 70; // px per hour

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const topFor = (start: string) =>
  ((toMinutes(start) - START_HOUR * 60) / 60) * HOUR_HEIGHT;

const heightFor = (start: string, end: string) =>
  ((toMinutes(end) - toMinutes(start)) / 60) * HOUR_HEIGHT;

export function CalendarTimeline({ blocks, onAcknowledge }: Props) {
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  return (
    <div className="relative select-none">
      <div className="flex">
        {/* Hour gutter */}
        <div className="w-14 shrink-0">
          {hours.map((h) => (
            <div
              key={h}
              style={{ height: HOUR_HEIGHT }}
              className="flex items-start justify-end pr-3 pt-0 text-[10px] font-mono text-muted-foreground"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Track */}
        <div
          className="relative flex-1 rounded-2xl border border-border bg-card/40"
          style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}
        >
          {hours.slice(0, -1).map((h, i) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-dashed border-border/60"
              style={{ top: (i + 1) * HOUR_HEIGHT - HOUR_HEIGHT, height: HOUR_HEIGHT }}
            />
          ))}

          {blocks.map((b) => (
            <BlockEl key={b.id} b={b} onAcknowledge={onAcknowledge} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BlockEl({
  b,
  onAcknowledge,
}: {
  b: CalendarBlock;
  onAcknowledge: (id: string) => void;
}) {
  const [ackAnim, setAckAnim] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const top = topFor(b.start);
  const h = heightFor(b.start, b.end);

  const style: React.CSSProperties = {
    top,
    height: h,
    left: 8,
    right: 8,
  };

  if (b.type === "focus") {
    const isAgent = b.agent_generated;
    return (
      <div
        style={style}
        className="absolute rounded-xl border border-deep-focus/60 bg-deep-focus/25 p-3.5 backdrop-blur-sm shadow-xs transition-all hover:bg-deep-focus/35"
      >
        <div className="flex items-center gap-2 text-[10px] font-semibold text-foreground/75">
          <Brain className="h-3.5 w-3.5 text-slate-cool" />
          <span>Deep Focus Window</span>
          {isAgent && (
            <span className="ml-auto flex items-center gap-0.5 rounded-full bg-mint-soft px-1.5 py-0.5 font-mono text-[9px] text-mint">
              <Sparkles className="h-2.5 w-2.5 animate-pulse-soft" /> Agent Protected
            </span>
          )}
        </div>
        <div className="mt-1 text-xs font-semibold text-foreground">{b.title}</div>
        <div className="mt-0.5 text-[10px] font-mono text-muted-foreground">
          {b.start} – {b.end}
        </div>
        {b.reason && (
          <p className="mt-1 text-[10px] text-muted-foreground italic truncate">
            {b.reason}
          </p>
        )}
      </div>
    );
  }

  if (b.type === "meeting") {
    return (
      <div
        style={style}
        className="absolute rounded-xl border border-lavender/50 bg-lavender-soft/45 p-3.5 shadow-xs transition-all hover:bg-lavender-soft/65"
      >
        <div className="text-[10px] font-semibold text-lavender uppercase tracking-wider">Sync / Meeting</div>
        <div className="mt-1 text-xs font-semibold text-foreground">{b.title}</div>
        <div className="text-[10px] font-mono text-muted-foreground">
          {b.start} – {b.end}
        </div>
      </div>
    );
  }

  // Task Block
  const acked = b.acknowledged;
  return (
    <div
      style={style}
      className={[
        "absolute flex flex-col rounded-xl border p-3.5 transition-all shadow-xs",
        acked
          ? "border-mint/55 bg-mint-soft/50 hover:bg-mint-soft/70"
          : "border-amber-soft/50 bg-amber-tint/40 hover:bg-amber-tint/60",
        ackAnim ? "scale-[1.01] ring-2 ring-mint/35" : "",
      ].join(" ")}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground/75">
        {acked ? <Lock className="h-3 w-3 text-mint" /> : <Sparkles className="h-3 w-3 text-amber-500 animate-pulse-soft" />}
        <span>Agent Scheduled Task</span>
        {b.confidence && (
          <span className="ml-auto font-mono text-[9px] text-indigo-500 bg-secondary/80 px-1 rounded">
            {b.confidence}% cert
          </span>
        )}
      </div>
      
      <div className="mt-1 text-xs font-semibold text-foreground">{b.title}</div>
      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
        {b.start} – {b.end}
      </div>

      {showTooltip && b.reason && (
        <div className="absolute left-1/2 -bottom-16 z-25 -translate-x-1/2 w-64 rounded-xl border border-border bg-card p-3 shadow-md animate-fade-in text-[10px] text-muted-foreground leading-normal">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground mb-1">
            <HelpCircle className="h-3.5 w-3.5 text-mint" /> Scheduling Rationale
          </div>
          {b.reason}
        </div>
      )}

      <div className="mt-auto pt-2 flex items-center justify-between">
        <button
          disabled={acked}
          onClick={() => {
            setAckAnim(true);
            setTimeout(() => setAckAnim(false), 600);
            onAcknowledge(b.id);
          }}
          className={[
            "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-all",
            acked
              ? "bg-mint/20 text-mint"
              : "bg-foreground/80 text-background hover:bg-foreground shadow-sm",
          ].join(" ")}
        >
          <Check className={`h-3 w-3 ${ackAnim ? "animate-scale-in" : ""}`} />
          {acked ? "Locked to slot" : "Confirm Slot"}
        </button>
      </div>
    </div>
  );
}
