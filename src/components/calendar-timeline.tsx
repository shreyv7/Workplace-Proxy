import { useState } from "react";
import { Check, Lock, Brain, Sparkles, AlertTriangle, Users, Calendar, Clock } from "lucide-react";
import type { CalendarBlock } from "../lib/mock-data";

type Props = {
  blocks: CalendarBlock[];
  onAcknowledge: (id: string) => void;
};

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const calculateDuration = (start: string, end: string) => {
  return toMinutes(end) - toMinutes(start);
};

const checkOverlaps = (block: CalendarBlock, allBlocks: CalendarBlock[]) => {
  const startB = toMinutes(block.start);
  const endB = toMinutes(block.end);
  
  return allBlocks.filter(other => {
    if (other.id === block.id) return false;
    const startO = toMinutes(other.start);
    const endO = toMinutes(other.end);
    return startB < endO && startO < endB;
  });
};

export function CalendarTimeline({ blocks, onAcknowledge }: Props) {
  // Filter out task blocks that are not acknowledged (added to calendar) yet
  const visibleBlocks = blocks.filter(b => {
    if (b.type === "task") {
      return b.acknowledged === true;
    }
    return true;
  });

  // Sort blocks chronologically
  const sortedBlocks = [...visibleBlocks].sort((a, b) => {
    const startA = toMinutes(a.start);
    const startB = toMinutes(b.start);
    if (startA !== startB) return startA - startB;
    return toMinutes(a.end) - toMinutes(a.start) - (toMinutes(b.end) - toMinutes(b.start));
  });

  return (
    <div className="relative pl-8 select-none flex flex-col gap-6">
      {/* Visual vertical timeline connector line */}
      <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-border/60" />

      {sortedBlocks.length > 0 ? (
        sortedBlocks.map((b) => {
          const overlaps = checkOverlaps(b, visibleBlocks);
          return (
            <BlockCard 
              key={b.id} 
              b={b} 
              overlaps={overlaps} 
              onAcknowledge={onAcknowledge} 
            />
          );
        })
      ) : (
        <div className="py-8 text-center text-muted-foreground text-xs font-semibold">
          No calendar events scheduled for today.
        </div>
      )}
    </div>
  );
}

function BlockCard({
  b,
  overlaps,
  onAcknowledge,
}: {
  b: CalendarBlock;
  overlaps: CalendarBlock[];
  onAcknowledge: (id: string) => void;
}) {
  const [ackAnim, setAckAnim] = useState(false);
  const acked = b.acknowledged;

  // Determine styles and icon based on type
  let icon = <Brain className="h-3.5 w-3.5 text-indigo-500" />;
  let typeLabel = "Deep Focus Window";
  let nodeBg = "bg-indigo-500/10 border-indigo-500/30 text-indigo-500";
  let cardBorder = "border-indigo-500/20 bg-indigo-500/[0.02]";

  if (b.type === "meeting") {
    icon = <Users className="h-3.5 w-3.5 text-lavender" />;
    typeLabel = "Sync / Meeting";
    nodeBg = "bg-lavender/10 border-lavender/30 text-lavender";
    cardBorder = "border-lavender/25 bg-lavender-soft/[0.02]";
  } else if (b.type === "task") {
    typeLabel = acked ? "Scheduled Task" : "Draft Task Proposal";
    icon = acked 
      ? <Check className="h-3.5 w-3.5 text-mint" /> 
      : <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse-soft" />;
    nodeBg = acked 
      ? "bg-mint/10 border-mint/30 text-mint" 
      : "bg-amber-500/10 border-amber-500/30 text-amber-500";
    cardBorder = acked 
      ? "border-mint/25 bg-mint-soft/[0.02]" 
      : "border-amber-soft/25 bg-amber-tint/[0.02]";
  }

  return (
    <div className="relative flex flex-col gap-1.5 animate-slide-up">
      {/* Node Bullet point on the timeline */}
      <div className={[
        "absolute -left-[33px] top-[14px] z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-card shadow-xs",
        nodeBg
      ].join(" ")}>
        {icon}
      </div>

      {/* Main card */}
      <div className={[
        "rounded-2xl border p-4.5 shadow-2xs hover:shadow-xs transition-all duration-200",
        cardBorder,
        ackAnim ? "scale-[1.01] ring-2 ring-mint/25" : ""
      ].join(" ")}>
        
        {/* Header line: type label and confidence metrics */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
            {typeLabel}
          </span>
          {b.confidence && (
            <span className="font-mono text-[9px] font-bold text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-md">
              {b.confidence}% confidence
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-2 text-sm font-bold text-foreground leading-tight tracking-tight">
          {b.title}
        </h3>

        {/* Time slot pill */}
        <div className="mt-3 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-foreground/80 bg-secondary/80 border border-border/80 px-2 py-0.5 rounded-full">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {b.start} – {b.end}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            ({calculateDuration(b.start, b.end)} mins)
          </span>
        </div>

        {/* Scheduling reasoning */}
        {b.reason && (
          <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed italic bg-secondary/30 p-2.5 rounded-xl border border-border/40">
            {b.reason}
          </p>
        )}

        {/* Time clash overlap warnings */}
        {overlaps.length > 0 && (
          <div className="mt-2.5 flex items-start gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Conflict:</strong> Overlaps with {overlaps.map(o => `"${o.title}"`).join(", ")}
            </span>
          </div>
        )}

        {/* Action Button for Tasks */}
        {b.type === "task" && (
          <div className="mt-4 pt-3.5 border-t border-border/40 flex justify-end">
            <button
              disabled={acked}
              onClick={() => {
                setAckAnim(true);
                setTimeout(() => setAckAnim(false), 600);
                onAcknowledge(b.id);
              }}
              className={[
                "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer",
                acked
                  ? "bg-mint/15 text-mint border border-mint/20"
                  : "bg-foreground/90 text-background hover:bg-foreground shadow-sm hover:scale-[1.01]"
              ].join(" ")}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              {acked ? "Locked to Slot" : "Confirm Slot Time"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
