import { useState } from "react";
import { Check, Lock, Brain } from "lucide-react";
import type { CalendarBlock } from "@/lib/mock-data";

type Props = {
  blocks: CalendarBlock[];
  onAcknowledge: (id: string) => void;
};

const START_HOUR = 9;
const END_HOUR = 18;
const HOUR_HEIGHT = 64; // px per hour

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
    <div className="relative">
      <div className="flex">
        {/* Hour gutter */}
        <div className="w-14 shrink-0">
          {hours.map((h) => (
            <div
              key={h}
              style={{ height: HOUR_HEIGHT }}
              className="flex items-start justify-end pr-2 pt-0 text-[11px] font-mono text-muted-foreground"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Track */}
        <div
          className="relative flex-1 rounded-xl border border-border bg-card/60"
          style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}
        >
          {hours.slice(0, -1).map((h, i) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-dashed border-border/70"
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
  const top = topFor(b.start);
  const h = heightFor(b.start, b.end);

  const style: React.CSSProperties = {
    top,
    height: h,
    left: 8,
    right: 8,
  };

  if (b.type === "focus") {
    return (
      <div
        style={style}
        className="absolute rounded-xl border border-deep-focus bg-deep-focus/40 p-3 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
          <Brain className="h-3.5 w-3.5" />
          Deep Work Focus Window
          <span className="ml-auto rounded-full bg-background/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            🔕 muted
          </span>
        </div>
        <div className="mt-1 text-sm text-foreground/85">{b.title}</div>
        <div className="mt-0.5 text-[11px] font-mono text-muted-foreground">
          {b.start} – {b.end}
        </div>
      </div>
    );
  }

  if (b.type === "meeting") {
    return (
      <div
        style={style}
        className="absolute rounded-xl border border-lavender/50 bg-lavender-soft p-3"
      >
        <div className="text-xs font-medium text-foreground/75">Meeting</div>
        <div className="text-sm text-foreground/85">{b.title}</div>
        <div className="text-[11px] font-mono text-muted-foreground">
          {b.start} – {b.end}
        </div>
      </div>
    );
  }

  // Task
  const acked = b.acknowledged;
  return (
    <div
      style={style}
      className={[
        "absolute flex flex-col rounded-xl border p-3 transition-all",
        acked
          ? "border-mint/60 bg-mint-soft"
          : "border-amber-soft/60 bg-amber-tint/70",
        ackAnim ? "scale-[1.01] ring-2 ring-mint/40" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-foreground/70">
        {acked ? <Lock className="h-3 w-3" /> : null}
        Agent Routed Task
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {b.start} – {b.end}
        </span>
      </div>
      <div className="mt-0.5 text-sm text-foreground">{b.title}</div>

      <div className="mt-auto pt-2">
        <button
          disabled={acked}
          onClick={() => {
            setAckAnim(true);
            setTimeout(() => setAckAnim(false), 600);
            onAcknowledge(b.id);
          }}
          className={[
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
            acked
              ? "bg-mint/30 text-foreground/70"
              : "bg-foreground/85 text-background hover:bg-foreground",
          ].join(" ")}
        >
          <Check className={`h-3.5 w-3.5 ${ackAnim ? "animate-scale-in" : ""}`} />
          {acked ? "Block locked" : "Acknowledge & Schedule Block"}
        </button>
      </div>
    </div>
  );
}
