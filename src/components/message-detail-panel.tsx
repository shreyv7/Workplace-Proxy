import { useState, useEffect } from "react";
import { type ClarityMessage, initialDebates } from "../lib/mock-data";
import { ReplyComposer } from "./reply-composer";
import { getDebugTranscript, type DebugTranscriptMessage } from "../lib/api";
import {
  Calendar,
  AlertCircle,
  Check,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Bot,
  Scale,
  CheckCircle2,
  User,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface MessageDetailPanelProps {
  message: ClarityMessage;
  onAcknowledge: (id: string) => void;
  onOpenDebate: (debateId: string) => void;
  onEscalate?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

interface TranscriptStep {
  agent: string;
  opinion: string;
  status: "proposed" | "countered" | "agreed";
  reason: string;
}

export function MessageDetailPanel({
  message,
  onAcknowledge,
  onOpenDebate,
  onEscalate,
  onDismiss,
}: MessageDetailPanelProps) {
  const [showDebateTrail, setShowDebateTrail] = useState(false);
  const [debateTranscript, setDebateTranscript] = useState<TranscriptStep[]>([]);
  const [loadingDebate, setLoadingDebate] = useState(false);

  const { action, complexity, expected_duration, steps } = message.translated_bullet_points;

  useEffect(() => {
    if (!showDebateTrail) return;

    const fetchDebate = async () => {
      setLoadingDebate(true);

      // 1. Try seed data
      const seedDebate = initialDebates.find((d) => d.id === message.debate_id);
      if (seedDebate) {
        setDebateTranscript(seedDebate.transcript as TranscriptStep[]);
        setLoadingDebate(false);
        return;
      }

      // 2. Fetch live debug transcript from orchestrator
      try {
        const data = await getDebugTranscript();
        const targetRequestId = message.message_id || message.debate_id?.replace(/^deb_/, "");

        if (data && data.request_id === targetRequestId && data.messages) {
          const mapped: TranscriptStep[] = data.messages.map((m: DebugTranscriptMessage) => ({
            agent: m.sender || "Agent",
            opinion: m.type === "consensus" ? "Secured consensus alignment." : m.reasoning,
            status: m.type === "consensus" ? "agreed" : "proposed",
            reason: m.reasoning,
          }));
          setDebateTranscript(mapped);
        }
      } catch (err) {
        console.error("Failed to load live debate transcript:", err);
      } finally {
        setLoadingDebate(false);
      }
    };

    fetchDebate();
  }, [showDebateTrail, message.debate_id, message.message_id]);

  const complexityColors = {
    Low: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_oklch(0.85_0.22_145_/_10%)]",
    Medium:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-[0_0_8px_oklch(0.78_0.09_70_/_10%)]",
    High: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-[0_0_8px_oklch(0.6_0.18_20_/_10%)]",
  };

  const importanceColors = {
    low: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    medium:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-[0_0_8px_oklch(0.78_0.09_70_/_10%)]",
    high: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-[0_0_8px_oklch(0.6_0.18_20_/_15%)]",
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 1. Header Details */}
      <div className="border-b border-border pb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className={[
                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                importanceColors[message.importance],
              ].join(" ")}
            >
              {message.importance} urgency
            </span>
            <span className="text-xs text-muted-foreground font-mono">{message.timestamp}</span>
          </div>

          <div className="flex gap-2">
            {onEscalate && message.importance !== "high" && (
              <button
                onClick={() => onEscalate(message.message_id)}
                className="text-[10px] font-bold text-rose-500 hover:bg-rose-500/5 px-2.5 py-1.5 rounded-lg border border-rose-500/10 transition-colors cursor-pointer"
              >
                Escalate
              </button>
            )}
            {onDismiss && (
              <button
                onClick={() => onDismiss(message.message_id)}
                className="text-[10px] font-bold text-muted-foreground hover:bg-secondary px-2.5 py-1.5 rounded-lg border border-border transition-colors cursor-pointer"
              >
                Archive
              </button>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-foreground tracking-tight leading-snug">
              {message.sender_name}
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {message.sender_role || "External Contact"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Original Raw Message Block */}
      <div className="bg-secondary/40 border border-border/80 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-3 right-4 text-[9px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
          Original Signal
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed font-mono whitespace-pre-wrap mt-3 italic">
          "{message.original_text}"
        </p>
      </div>

      {/* 3. AI Translation Briefing */}
      {message.translation_status === "processing" ? (
        <div className="border border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center bg-card">
          <div className="h-8 w-8 rounded-full border-2 border-mint border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-foreground">
            Consensus Swarm actively debating subtext...
          </span>
          <span className="text-[10px] text-muted-foreground max-w-xs font-mono">
            Running Interceptor, Contextualizer, Scheduler, and Translator agents.
          </span>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col gap-5 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest bg-secondary px-2.5 py-0.5 rounded-full">
                AI Decoded Action Briefing
              </span>
              <h3 className="text-sm font-bold text-foreground tracking-tight mt-2 leading-snug">
                {action || `Review Message from ${message.sender_name}`}
              </h3>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${complexityColors[complexity] || "bg-secondary text-foreground"}`}
            >
              {complexity} Complexity
            </span>
          </div>

          {/* Time and Duration badges */}
          <div className="flex flex-wrap gap-2 text-[10px] font-mono">
            <div className="flex items-center gap-1.5 bg-secondary/55 text-foreground/80 px-2.5 py-1.5 rounded-xl font-medium">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                Suggested Slot: {message.suggested_start_time} - {message.suggested_end_time}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-secondary/55 text-foreground/80 px-2.5 py-1.5 rounded-xl font-medium">
              <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Est. Duration: {expected_duration}</span>
            </div>
          </div>

          {/* Action Items List */}
          {steps && steps.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Explicit Action Steps
              </span>
              <div className="space-y-2">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-foreground/95 bg-secondary/35 p-3 rounded-xl border border-border/40"
                  >
                    <div className="h-4.5 w-4.5 rounded-md border border-border bg-card flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-muted-foreground">{idx + 1}</span>
                    </div>
                    <span className="leading-relaxed font-sans">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning */}
          {message.reasoning && (
            <div className="bg-secondary/25 p-4 rounded-xl border border-border/40 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Decoded Context & Rationale
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                {message.reasoning}
              </p>
            </div>
          )}

          {/* Bottom Triage Confirmation */}
          <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-4 mt-1">
            <button
              onClick={() => onOpenDebate(message.debate_id || `deb_${message.message_id}`)}
              className="inline-flex items-center gap-1 text-[10.5px] font-bold text-lavender hover:text-mint hover:shadow-[0_0_8px_oklch(0.82_0.16_168_/_15%)] transition-all duration-200"
            >
              <Bot className="h-4 w-4" />
              <span>Inspect Swarm Debate Trail</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>

            {message.acknowledged ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-mint font-bold bg-mint/10 border border-mint/20 px-3 py-2 rounded-xl">
                <Check className="h-3.5 w-3.5" /> Task Scheduled
              </span>
            ) : (
              <button
                onClick={() => onAcknowledge(message.message_id)}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-mint via-indigo-500 to-lavender hover:opacity-95 text-white px-4.5 py-3 rounded-xl shadow-[0_0_15px_oklch(0.78_0.18_290_/_20%)] hover:shadow-[0_0_22px_oklch(0.82_0.16_168_/_40%)] transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm & Block Calendar</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Swarm Debate Trail Collapsible */}
      <div className="border border-border/60 rounded-2xl overflow-hidden bg-card/40">
        <button
          onClick={() => setShowDebateTrail(!showDebateTrail)}
          className="w-full flex items-center justify-between p-4 text-xs font-bold text-foreground hover:bg-secondary/60 transition-colors border-b border-border/20 outline-hidden cursor-pointer bg-gradient-to-r from-secondary/20 to-transparent"
        >
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-lavender" />
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Show Debate Consensus Trail</span>
          </div>
          {showDebateTrail ? (
            <ChevronUp className="h-4 w-4 text-lavender" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showDebateTrail && (
          <div className="p-4 border-t border-border/60 bg-card space-y-3.5 divide-y divide-border/60">
            {loadingDebate ? (
              <div className="flex justify-center items-center py-6 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                <span className="text-xs font-semibold text-muted-foreground">
                  Retrieving consensus transcript...
                </span>
              </div>
            ) : debateTranscript.length > 0 ? (
              debateTranscript.map((step, idx) => (
                <div
                  key={idx}
                  className={[
                    "pt-3.5 first:pt-0 flex flex-col gap-1.5 text-xs",
                    idx > 0 ? "border-t border-border/40" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-bold text-foreground capitalize font-mono text-[11px]">
                      {step.agent}
                    </span>
                    <span
                      className={[
                        "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                        step.status === "agreed"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-indigo-500/10 text-indigo-500",
                      ].join(" ")}
                    >
                      {step.status === "agreed" ? "CONSENSUS ALIGNED" : "DEBATING"}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed font-sans">{step.opinion}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-muted-foreground font-mono">
                No active debate records found for this message.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Reply Composer */}
      {message.translation_status !== "processing" && (
        <ReplyComposer
          messageId={message.message_id}
          originalContent={message.original_text}
          senderName={message.sender_name}
          source={message.source}
          onReplySent={() => {
            // Re-fetch or soft acknowledge
          }}
        />
      )}
    </div>
  );
}
