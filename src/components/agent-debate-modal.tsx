import { initialDebates } from "../lib/mock-data";
import { X, Bot, ShieldCheck, Scale, AlertTriangle, ArrowRight } from "lucide-react";

type Props = {
  debateId: string;
  onClose: () => void;
};

export function AgentDebateModal({ debateId, onClose }: Props) {
  const debate = initialDebates.find((d) => d.id === debateId);

  if (!debate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4.5 bg-secondary/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-soft text-mint">
              <Scale className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">Swarm Consensus Timeline</h3>
              <p className="text-[10px] text-muted-foreground font-mono">Session ID: {debate.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-xl border border-border bg-card p-2 text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-6 scrollbar-calm">
          <div className="rounded-xl bg-secondary/30 p-4 border border-border/50 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Consensus Objective:</span> Swarm debating timing and structure optimization to prevent client friction and cognitive overload.
          </div>

          <div className="relative pl-6 space-y-6">
            {/* Thread line */}
            <div className="absolute left-[31px] top-2 bottom-2 w-0.5 bg-border/60" />

            {debate.transcript.map((step, idx) => {
              const isProposed = step.status === "proposed";
              const isCountered = step.status === "countered";
              const isAgreed = step.status === "agreed";

              let badgeColor = "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400";
              let badgeText = "Proposed";
              if (isCountered) {
                badgeColor = "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400";
                badgeText = "Refined / Countered";
              } else if (isAgreed) {
                badgeColor = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400";
                badgeText = "Aligned";
              }

              return (
                <div 
                  key={idx} 
                  className="relative flex items-start gap-4 animate-slide-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {/* Agent Avatar Icon */}
                  <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-xl bg-secondary border border-border/80 text-[10px] font-bold text-foreground shrink-0 shadow-xs">
                    {step.avatar}
                  </div>

                  {/* Speech Bubble */}
                  <div className="flex-1 rounded-2xl border border-border bg-card/70 p-4 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">{step.agent}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">Agent</span>
                      </div>
                      <span className={["px-2 py-0.5 rounded-full text-[9px] font-mono font-medium", badgeColor].join(" ")}>
                        {badgeText}
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-medium text-foreground/90">{step.opinion}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{step.reason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/70 px-6 py-4 bg-secondary/10">
          <div className="flex items-center gap-2 text-xs text-emerald-500 font-semibold">
            <ShieldCheck className="h-4.5 w-4.5" />
            <span>Swarm core consensus secured (94% confidence)</span>
          </div>
          <button 
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2 bg-foreground text-background rounded-xl hover:opacity-90 transition-opacity"
          >
            Acknowledge Decision
          </button>
        </div>
      </div>
    </div>
  );
}
