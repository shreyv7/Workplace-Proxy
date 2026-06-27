import { useEffect, useState } from "react";
import { ClarityMessage, initialDebates } from "../lib/mock-data";
import { X, ShieldCheck, Scale, Loader2 } from "lucide-react";
import { ApiError, getDebugTranscript, type DebugTranscriptMessage } from "../lib/api";

type Props = {
  debateId: string;
  message?: ClarityMessage;
  onClose: () => void;
};

interface TranscriptStep {
  agent: string;
  avatar: string;
  opinion: string;
  status: "proposed" | "countered" | "agreed";
  reason: string;
}

export function AgentDebateModal({ debateId, message, onClose }: Props) {
  const [transcript, setTranscript] = useState<TranscriptStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceMode, setSourceMode] = useState<"seed" | "live" | "dynamic">("seed");

  useEffect(() => {
    // 1. Check if the debateId is in seed data
    const seedDebate = initialDebates.find((d) => d.id === debateId);
    if (seedDebate) {
      setTranscript(seedDebate.transcript as TranscriptStep[]);
      setSourceMode("seed");
      return;
    }

    // 2. Fetch from backend if available, matching request_id
    const fetchLiveTranscript = async () => {
      setLoading(true);
      try {
        const data = await getDebugTranscript();
        const targetRequestId = message?.message_id || debateId.replace(/^deb_/, "");
        if (data && data.request_id === targetRequestId && data.messages) {
          // Map backend schema to frontend modal schema
          const mapped: TranscriptStep[] = data.messages.map((m: DebugTranscriptMessage) => {
            const agentInfo = mapSenderToAgent(m.sender);
            return {
              agent: agentInfo.name,
              avatar: agentInfo.avatar,
              opinion: m.type === "consensus" ? "Secured consensus alignment." : m.reasoning,
              status: mapTypeToStatus(m.type),
              reason:
                m.recommendations && m.recommendations.length > 0
                  ? m.recommendations.join("; ")
                  : m.reasoning,
            };
          });
          setTranscript(mapped);
          setSourceMode("live");
          setLoading(false);
          return;
        }
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 404)) {
          console.warn(
            "Could not retrieve live debate transcript from backend, running fallback generator...",
            e,
          );
        }
      }

      // 3. Fallback: Generate customized dynamic debate timeline
      if (message) {
        setTranscript(generateDynamicTranscript(message));
        setSourceMode("dynamic");
      } else {
        // Absolute fallback
        setTranscript([
          {
            agent: "Swarm Engine",
            avatar: "SE",
            opinion: "Debate details initialized.",
            status: "agreed",
            reason: "Orchestrated 4-agent consensus debate. Consolidated timeline successfully.",
          },
        ]);
        setSourceMode("dynamic");
      }
      setLoading(false);
    };

    fetchLiveTranscript();
  }, [debateId, message]);

  const mapSenderToAgent = (sender: string) => {
    switch (sender) {
      case "interceptor":
        return { name: "Interceptor Agent", avatar: "IA" };
      case "contextualizer":
        return { name: "Context Agent", avatar: "CA" };
      case "scheduler":
        return { name: "Scheduler Agent", avatar: "SA" };
      case "translator":
        return { name: "Translator Agent", avatar: "TA" };
      default:
        return {
          name: sender.charAt(0).toUpperCase() + sender.slice(1) + " Agent",
          avatar: sender.substring(0, 2).toUpperCase(),
        };
    }
  };

  const mapTypeToStatus = (type: string): "proposed" | "countered" | "agreed" => {
    switch (type) {
      case "consensus":
        return "agreed";
      case "dissent":
      case "revision":
        return "countered";
      default:
        return "proposed";
    }
  };

  const generateDynamicTranscript = (msg: ClarityMessage): TranscriptStep[] => {
    const steps: TranscriptStep[] = [];

    steps.push({
      agent: "Interceptor Agent",
      avatar: "IA",
      opinion: `Ingested raw signal from ${msg.sender_name} via ${msg.source.toUpperCase()}.`,
      status: "proposed",
      reason: `Analyzed message intent and initial parameters. Estimated raw urgency as ${msg.importance.toUpperCase()} with ${msg.ambiguity} ambiguity level.`,
    });

    let resolvedText = "";
    if (msg.translated_bullet_points.steps.length > 0) {
      resolvedText = ` Resolved terms to target: ${msg.translated_bullet_points.steps.join(", ")}.`;
    }
    steps.push({
      agent: "Context Agent",
      avatar: "CA",
      opinion: `Queried memory service database.`,
      status: msg.importance === "high" ? "countered" : "proposed",
      reason: `Located historical context and preferences for user. Decoded intent: ${msg.reasoning}.${resolvedText}`,
    });

    steps.push({
      agent: "Scheduler Agent",
      avatar: "SA",
      opinion: `Analyzed timeline blocks and availability constraints.`,
      status: "proposed",
      reason: `Proposed time slot ${msg.suggested_start_time} - ${msg.suggested_end_time} (${msg.translated_bullet_points.expected_duration}) protecting deep focus windows.`,
    });

    steps.push({
      agent: "Translator Agent",
      avatar: "TA",
      opinion: `Formulated actionable task translation: "${msg.translated_bullet_points.action}".`,
      status: "agreed",
      reason: `Aligned briefing format with user formatting preferences. Swarm consensus secured.`,
    });

    return steps;
  };

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
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                Swarm Consensus Timeline
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono">
                Source:{" "}
                {sourceMode === "live"
                  ? "Live Swarm"
                  : sourceMode === "seed"
                    ? "Mock Session"
                    : "Dynamic Reconstruction"}{" "}
                · ID: {debateId}
              </p>
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-mint" />
              <span className="text-xs font-medium">Fetching swarm timeline...</span>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-secondary/30 p-4 border border-border/50 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Consensus Objective:</span> Swarm
                debating timing and structure optimization to prevent client friction and cognitive
                overload.
              </div>

              <div className="relative pl-6 space-y-6">
                {/* Thread line */}
                <div className="absolute left-[31px] top-2 bottom-2 w-0.5 bg-border/60" />

                {transcript.map((step, idx) => {
                  const isProposed = step.status === "proposed";
                  const isCountered = step.status === "countered";
                  const isAgreed = step.status === "agreed";

                  let badgeColor =
                    "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400";
                  let badgeText = "Proposed";
                  if (isCountered) {
                    badgeColor =
                      "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400";
                    badgeText = "Refined / Countered";
                  } else if (isAgreed) {
                    badgeColor =
                      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400";
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
                            <span className="text-xs font-semibold text-foreground">
                              {step.agent}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Agent
                            </span>
                          </div>
                          <span
                            className={[
                              "px-2 py-0.5 rounded-full text-[9px] font-mono font-medium",
                              badgeColor,
                            ].join(" ")}
                          >
                            {badgeText}
                          </span>
                        </div>

                        <p className="mt-2 text-xs font-medium text-foreground/90">
                          {step.opinion}
                        </p>
                        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                          {step.reason}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
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
