import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  Bot,
  BrainCircuit,
  Cpu,
  Database,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Waypoints,
} from "lucide-react";
import {
  ApiError,
  checkHealth,
  getDebugMetrics,
  getDebugTranscript,
  getRuntimeSnapshot,
  type DebugMetricsResponse,
  type DebugRuntimeAgent,
  type DebugRuntimeResponse,
  type DebugTranscriptResponse,
  type HealthResponse,
} from "../lib/api";
import { InteractiveSwarm } from "../components/InteractiveSwarm";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agent Swarm — Workplace Proxy" },
      {
        name: "description",
        content:
          "Inspect the live swarm runtime, fallback posture, dependency health, and last debate transcript.",
      },
    ],
  }),
  component: AgentSwarm,
});

type AgentStatusTone = {
  label: string;
  badgeClass: string;
  dotClass: string;
};

const dependencyLabels: Record<string, string> = {
  memory_service: "Memory Service",
  calendar_mcp: "Calendar MCP",
  gemini: "Gemini",
  google_adk: "Google ADK",
  lyzr: "Lyzr",
};

function AgentSwarm() {
  const [runtime, setRuntime] = useState<DebugRuntimeResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [metrics, setMetrics] = useState<DebugMetricsResponse | null>(null);
  const [transcript, setTranscript] = useState<DebugTranscriptResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    const load = async (manual = false) => {
      if (manual) {
        setIsRefreshing(true);
      }

      const [runtimeResult, healthResult, metricsResult, transcriptResult] =
        await Promise.allSettled([
          getRuntimeSnapshot(),
          checkHealth(),
          getDebugMetrics(),
          getDebugTranscript(),
        ]);

      if (disposed) {
        return;
      }

      const nextError =
        runtimeResult.status === "rejected"
          ? getErrorMessage(runtimeResult.reason, "Runtime snapshot is unavailable.")
          : healthResult.status === "rejected"
            ? getErrorMessage(healthResult.reason, "Health status is unavailable.")
            : metricsResult.status === "rejected"
              ? getErrorMessage(metricsResult.reason, "Metrics are unavailable.")
              : null;

      setError(nextError);

      if (runtimeResult.status === "fulfilled") {
        setRuntime(runtimeResult.value);
      }

      if (healthResult.status === "fulfilled") {
        setHealth(healthResult.value);
      }

      if (metricsResult.status === "fulfilled") {
        setMetrics(metricsResult.value);
      }

      if (transcriptResult.status === "fulfilled") {
        setTranscript(transcriptResult.value);
      } else {
        const reason = transcriptResult.reason as { status?: number } | undefined;
        if (reason?.status === 404) {
          setTranscript(null);
        }
      }

      setLastUpdated(new Date());

      if (manual) {
        setIsRefreshing(false);
      }
    };

    load();
    const interval = window.setInterval(() => {
      void load();
    }, 20000);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, []);

  const dependencyEntries = Object.entries(health?.dependencies ?? {});
  const healthyDependencyCount = dependencyEntries.filter(([, status]) =>
    ["ok", "configured", "available"].includes(status),
  ).length;
  const stageEntries = Object.entries(transcript?.stage_latencies ?? {}).filter(
    ([name]) => name !== "total",
  );
  const maxStageLatency = Math.max(...stageEntries.map(([, value]) => value), 1);

  return (
    <div className="mx-auto max-w-[1440px] px-6 pt-8 pb-28 animate-fade-in">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/8 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.28em] text-amber-600 dark:text-amber-300">
            <ShieldAlert className="h-3.5 w-3.5" />
            Internal Runtime Surface
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Agent Network Core
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This page is now wired to the real swarm runtime. It is best kept as an internal or
            developer-facing surface because it exposes orchestration details, fallback posture, and
            backend dependencies that most end users do not need day to day.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() =>
              void refreshSwarmState(
                setIsRefreshing,
                setError,
                setRuntime,
                setHealth,
                setMetrics,
                setTranscript,
                setLastUpdated,
              )
            }
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary/40 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw
              className={[
                "h-4 w-4 text-muted-foreground",
                isRefreshing ? "animate-spin text-mint" : "",
              ].join(" ")}
            />
            Refresh Runtime
          </button>
          <p className="text-[11px] text-muted-foreground">
            {lastUpdated ? `Updated ${formatTime(lastUpdated)}` : "Waiting for first runtime poll"}
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {error}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Cpu}
          label="Runtime Mode"
          value={runtime?.backend_mode ?? "Unavailable"}
          detail={
            runtime
              ? runtime.lyzr_per_agent
                ? "Distinct Lyzr-backed runtime per role"
                : runtime.lyzr_enabled
                  ? "Shared Lyzr runtime with backend fallbacks"
                  : "Direct Gemini backend path"
              : "Runtime snapshot pending"
          }
        />
        <SummaryCard
          icon={Waypoints}
          label="Consensus Policy"
          value={
            runtime
              ? `${runtime.consensus_threshold}/${runtime.max_debate_rounds} rounds`
              : "Unavailable"
          }
          detail={
            metrics
              ? `${metrics.average_debate_rounds.toFixed(2)} avg rounds per processed message`
              : "No debate metrics yet"
          }
        />
        <SummaryCard
          icon={Sparkles}
          label="Last Consensus"
          value={
            transcript
              ? transcript.final_consensus
                ? `${Math.round(transcript.final_confidence * 100)}% aligned`
                : "Unresolved"
              : "No transcript yet"
          }
          detail={
            transcript
              ? `${transcript.rounds_completed} rounds • ${transcript.total_processing_ms}ms total`
              : "Process one message to populate the debug transcript"
          }
        />
        <SummaryCard
          icon={Database}
          label="Fallback Posture"
          value={metrics ? `${metrics.fallback_events} fallback events` : "Unavailable"}
          detail={
            transcript?.fallback_events.length
              ? transcript.fallback_events.join(" • ")
              : "No fallback events recorded on the latest run"
          }
        />
      </div>

      <section className="mb-8 rounded-3xl border border-border bg-card/95 p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/70">
            <Bot className="h-5 w-5 text-foreground" strokeWidth={1.6} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Swarm Runtime Paths
            </h2>
            <p className="text-sm text-muted-foreground">
              Each card shows the active runtime path, the dependent service it leans on, and the
              fallback lane that keeps the pipeline alive during demo conditions.
            </p>
          </div>
        </div>

        <InteractiveSwarm
          agents={runtime?.agents ?? []}
          health={health}
          transcript={transcript}
        />
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.25fr_0.95fr]">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/70">
              <Activity className="h-5 w-5 text-foreground" strokeWidth={1.6} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Last Debate Snapshot
              </h2>
              <p className="text-sm text-muted-foreground">
                Real transcript data from the most recent `/api/v1/process` run.
              </p>
            </div>
          </div>

          {transcript ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InlineMetric
                  label="Request ID"
                  value={shortId(transcript.request_id)}
                  detail={transcript.ended_at ? formatTimestamp(transcript.ended_at) : "In flight"}
                />
                <InlineMetric
                  label="Consensus"
                  value={transcript.final_consensus ? "Reached" : "Not reached"}
                  detail={`${transcript.rounds_completed} rounds completed`}
                />
                <InlineMetric
                  label="Processing Time"
                  value={`${transcript.total_processing_ms}ms`}
                  detail={`${transcript.messages.length} transcript messages`}
                />
              </div>

              <div className="rounded-2xl border border-border/70 bg-secondary/20 p-5">
                <h3 className="text-sm font-semibold text-foreground">Stage timings</h3>
                <div className="mt-4 space-y-3">
                  {stageEntries.length ? (
                    stageEntries.map(([name, value]) => (
                      <div key={name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium capitalize text-foreground">
                            {name.replace(/_/g, " ")}
                          </span>
                          <span className="font-mono text-muted-foreground">{value}ms</span>
                        </div>
                        <div className="h-2 rounded-full bg-border/60">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-mint via-indigo-500 to-lavender"
                            style={{ width: `${Math.max((value / maxStageLatency) * 100, 12)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Stage timings will appear after the first fully processed message.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border/70 p-5">
                  <h3 className="text-sm font-semibold text-foreground">Consensus rounds</h3>
                  <div className="mt-4 space-y-3">
                    {transcript.consensus_history.length ? (
                      transcript.consensus_history.map((round) => (
                        <div
                          key={round.round}
                          className="rounded-2xl border border-border/60 bg-secondary/15 p-3"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground">
                              Round {round.round}
                            </span>
                            <span
                              className={[
                                "rounded-full px-2 py-0.5 font-mono text-[10px]",
                                round.reached
                                  ? "bg-mint-soft/30 text-mint"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-300",
                              ].join(" ")}
                            >
                              {round.reached ? "CONSENSUS" : "REVISED"}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {round.approved_count}/{round.threshold} approvals
                          </p>
                          {round.dominant_objection && (
                            <p className="mt-2 text-xs text-foreground">
                              {round.dominant_objection}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No debate rounds have been recorded yet.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 p-5">
                  <h3 className="text-sm font-semibold text-foreground">Latest agent notes</h3>
                  <div className="mt-4 space-y-3">
                    {transcript.messages.length ? (
                      transcript.messages
                        .slice(-5)
                        .reverse()
                        .map((message, index) => (
                          <div
                            key={`${message.sender}-${message.timestamp}-${index}`}
                            className="rounded-2xl border border-border/60 bg-secondary/15 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold capitalize text-foreground">
                                {message.sender}
                              </span>
                              <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                                {message.type}
                              </span>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                              {message.reasoning}
                            </p>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Agent messages are captured after the debate loop runs.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No transcript captured yet"
              description="Run a message through the real `/process` pipeline from the inbox or dashboard and this panel will show the last debate, timings, and fallback notes."
            />
          )}
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/70">
              <BrainCircuit className="h-5 w-5 text-foreground" strokeWidth={1.6} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Dependency Fabric
              </h2>
              <p className="text-sm text-muted-foreground">
                Downstream services that decide whether the swarm is running its primary path or a
                graceful fallback.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-secondary/20 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
                  Healthy services
                </p>
                <p className="mt-1 text-3xl font-black tracking-tight text-foreground">
                  {healthyDependencyCount}
                  <span className="ml-1 text-lg font-semibold text-muted-foreground">
                    / {dependencyEntries.length || 0}
                  </span>
                </p>
              </div>
              <p className="max-w-[180px] text-right text-xs text-muted-foreground">
                {metrics
                  ? `${metrics.messages_processed} processed requests since startup`
                  : "Metrics not available yet"}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {dependencyEntries.length ? (
                dependencyEntries.map(([key, value]) => {
                  const tone = getDependencyTone(value);
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/70 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {dependencyLabels[key] ?? key}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dependencyDescription(key, value)}
                        </p>
                      </div>
                      <span className={tone}>{value.replace(/_/g, " ")}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  Dependency health will appear once the backend responds to `/api/v1/health`.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4.5 w-4.5 text-muted-foreground" strokeWidth={1.6} />
      </div>
      <p className="mt-4 text-xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  );
}

function AgentCard({
  agent,
  health,
  transcript,
}: {
  agent: DebugRuntimeAgent;
  health: HealthResponse | null;
  transcript: DebugTranscriptResponse | null;
}) {
  const tone = getAgentStatusTone(agent, health, transcript);
  const lastLatency = getAgentLatency(agent.id, transcript);

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-tight text-foreground">{agent.display_name}</p>
          <p className="mt-1 text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
            {agent.role}
          </p>
        </div>
        <span
          className={[
            "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
            tone.badgeClass,
          ].join(" ")}
        >
          <span className={["h-2 w-2 rounded-full", tone.dotClass].join(" ")} />
          {tone.label}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RuntimeField label="Primary runtime" value={agent.primary_runtime} />
        <RuntimeField label="LLM backend" value={agent.llm_backend} />
        <RuntimeField label="Dependency" value={agent.dependency} />
        <RuntimeField
          label="Last stage latency"
          value={lastLatency ? `${lastLatency}ms` : "No run yet"}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-border/60 bg-secondary/15 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Fallback lane
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {agent.fallback_chain.length ? (
            agent.fallback_chain.map((item) => (
              <span
                key={item}
                className="rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] text-foreground"
              >
                {item}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">
              No dedicated fallback declared for this stage.
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Expertise
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {agent.expertise.slice(0, 3).map((item) => (
              <span
                key={item}
                className="rounded-full bg-mint-soft/20 px-2.5 py-1 text-[11px] text-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Constraint
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {agent.limitations[0] ?? "No limitation declared."}
          </p>
          {typeof agent.confidence_baseline === "number" && (
            <p className="mt-3 text-xs font-mono text-foreground">
              Baseline confidence {Math.round(agent.confidence_baseline * 100)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RuntimeField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-secondary/15 p-4">
      <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function InlineMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
      <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-secondary/15 p-8 text-center">
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function getAgentStatusTone(
  agent: DebugRuntimeAgent,
  health: HealthResponse | null,
  transcript: DebugTranscriptResponse | null,
): AgentStatusTone {
  const dependencyState =
    agent.id === "contextualizer"
      ? health?.dependencies.memory_service
      : agent.id === "scheduler"
        ? health?.dependencies.calendar_mcp
        : agent.primary_runtime.includes("ADK")
          ? health?.dependencies.google_adk
          : health?.dependencies.gemini;

  if (
    dependencyState &&
    ["unavailable", "missing_api_key", "not_installed"].includes(dependencyState)
  ) {
    return {
      label: "Degraded",
      badgeClass: "bg-rose-500/10 text-rose-500",
      dotClass: "bg-rose-500",
    };
  }

  const hasRecordedLatency = getAgentLatency(agent.id, transcript) !== null;
  if (hasRecordedLatency) {
    return {
      label: "Verified",
      badgeClass: "bg-mint-soft/30 text-mint",
      dotClass: "bg-mint",
    };
  }

  return {
    label: "Standby",
    badgeClass: "bg-secondary text-muted-foreground",
    dotClass: "bg-muted-foreground/70",
  };
}

export function getAgentLatency(
  agentId: string,
  transcript: DebugTranscriptResponse | null,
): number | null {
  if (!transcript) {
    return null;
  }

  const stageMap: Record<string, string[]> = {
    interceptor: ["interceptor"],
    contextualizer: ["contextualizer"],
    scheduler: ["scheduler"],
    translator: ["initial_translation", "debate"],
  };

  const keys = stageMap[agentId] ?? [];
  const values = keys
    .map((key) => transcript.stage_latencies[key])
    .filter((value): value is number => typeof value === "number");

  if (!values.length) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0);
}

function getDependencyTone(value: string) {
  if (["ok", "configured", "available"].includes(value)) {
    return "rounded-full bg-mint-soft/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-mint";
  }

  if (["degraded"].includes(value)) {
    return "rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300";
  }

  return "rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-500";
}

function dependencyDescription(key: string, value: string) {
  if (key === "memory_service") {
    return value === "ok"
      ? "Qdrant-backed enrichment is available."
      : "Contextualizer will fall back to default memory context.";
  }

  if (key === "calendar_mcp") {
    return value === "ok"
      ? "Scheduler can inspect live calendar availability."
      : "Scheduler will use deterministic fallback slotting.";
  }

  if (key === "lyzr") {
    return value === "available"
      ? "Lyzr SDK is installed for shared or per-agent cloud runtimes."
      : "Lyzr path is unavailable on this runtime.";
  }

  if (key === "google_adk") {
    return value === "available"
      ? "Interceptor can run through Google ADK."
      : "Interceptor will fall back to its standard backend path.";
  }

  if (key === "gemini") {
    return value === "configured"
      ? "Gemini credentials are configured for direct backend use."
      : "Direct Gemini calls are currently not configured.";
  }

  return value.replace(/_/g, " ");
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function shortId(value: string) {
  return value.slice(0, 8);
}

function getErrorMessage(reason: unknown, fallback: string) {
  if (reason instanceof ApiError) {
    return reason.message;
  }

  if (reason instanceof Error) {
    return reason.message;
  }

  return fallback;
}

async function refreshSwarmState(
  setIsRefreshing: (value: boolean) => void,
  setError: (value: string | null) => void,
  setRuntime: (value: DebugRuntimeResponse | null) => void,
  setHealth: (value: HealthResponse | null) => void,
  setMetrics: (value: DebugMetricsResponse | null) => void,
  setTranscript: (value: DebugTranscriptResponse | null) => void,
  setLastUpdated: (value: Date | null) => void,
) {
  setIsRefreshing(true);

  try {
    const [runtimeData, healthData, metricsData] = await Promise.all([
      getRuntimeSnapshot(),
      checkHealth(),
      getDebugMetrics(),
    ]);

    setRuntime(runtimeData);
    setHealth(healthData);
    setMetrics(metricsData);
    setError(null);

    try {
      const transcriptData = await getDebugTranscript();
      setTranscript(transcriptData);
    } catch (reason) {
      const apiError = reason as { status?: number } | undefined;
      if (apiError?.status === 404) {
        setTranscript(null);
      } else {
        throw reason;
      }
    }

    setLastUpdated(new Date());
  } catch (reason) {
    setError(getErrorMessage(reason, "Unable to refresh swarm state."));
  } finally {
    setIsRefreshing(false);
  }
}
