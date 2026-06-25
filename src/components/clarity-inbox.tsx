import { useState } from "react";
import { ChevronDown, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { ClarityMessage } from "@/lib/mock-data";

type Props = {
  messages: ClarityMessage[];
  onRatingChange: (id: string, value: number) => void;
};

export function ClarityInbox({ messages, onRatingChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((m) => (
        <MessageCard key={m.message_id} m={m} onRatingChange={onRatingChange} />
      ))}
    </div>
  );
}

function MessageCard({
  m,
  onRatingChange,
}: {
  m: ClarityMessage;
  onRatingChange: (id: string, value: number) => void;
}) {
  const [open, setOpen] = useState(true);

  const ambColor =
    m.ambiguity === "high"
      ? "bg-destructive/70"
      : m.ambiguity === "medium"
        ? "bg-amber-soft"
        : "bg-mint";

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_0_oklch(0.92_0.012_240)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${ambColor}`} aria-hidden />
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">{m.sender_name}</div>
          <div className="text-xs text-muted-foreground">
            {m.sender_role} · {m.timestamp}
          </div>
        </div>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Suggested {m.suggested_start_time}–{m.suggested_end_time}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-border/70 bg-background/40 p-4 sm:p-5 animate-fade-in">
          <div className="grid gap-3 md:grid-cols-2">
            {/* Original */}
            <div className="rounded-xl border border-amber-soft/60 bg-amber-tint/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground/80">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-amber-soft opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-soft" />
                </span>
                Original Source Signal
                <AlertCircle className="ml-auto h-3.5 w-3.5 opacity-60" />
              </div>
              <p className="text-sm leading-relaxed text-foreground/85">{m.original_text}</p>
            </div>

            {/* Translation */}
            <div className="rounded-xl border-2 border-mint/50 bg-mint-soft/60 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground/80">
                <CheckCircle2 className="h-3.5 w-3.5 text-mint" />
                Clarity Translation
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                  {m.translated_bullet_points.action}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Pill>Complexity: {m.translated_bullet_points.complexity}</Pill>
                  <Pill icon={<Clock className="h-3 w-3" />}>
                    {m.translated_bullet_points.expected_duration}
                  </Pill>
                </div>
                <ul className="ml-1 mt-2 space-y-1.5 text-sm text-foreground/85">
                  {m.translated_bullet_points.steps.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Fidelity slider */}
          <div className="mt-5 rounded-xl bg-muted/40 px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <label htmlFor={`fid-${m.message_id}`}>
                Calibrate agent understanding accuracy
              </label>
              <span className="font-mono text-foreground/70">{m.fidelity_rating} / 5</span>
            </div>
            <Slider
              id={`fid-${m.message_id}`}
              value={[m.fidelity_rating]}
              min={1}
              max={5}
              step={1}
              onValueChange={(v) => onRatingChange(m.message_id, v[0] ?? 3)}
            />
            <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
              <span>Off</span>
              <span>Perfect</span>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function Pill({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-0.5 text-foreground/75 ring-1 ring-border">
      {icon}
      {children}
    </span>
  );
}
