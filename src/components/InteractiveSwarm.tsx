import { useEffect, useState } from "react";
import { Cpu, BrainCircuit, Waypoints, Sparkles, X } from "lucide-react";
import type { DebugRuntimeAgent, HealthResponse, DebugTranscriptResponse } from "../lib/api";
import { getAgentStatusTone, getAgentLatency } from "../routes/agents";

interface InteractiveSwarmProps {
  agents: DebugRuntimeAgent[];
  health: HealthResponse | null;
  transcript: DebugTranscriptResponse | null;
}

interface AgentConfig {
  bgClass: string;
  glowClass: string;
  icon: React.ComponentType<{ className?: string }>;
  anchors: {
    desktop: { left: string; top: string };
    mobile: { left: string; top: string };
  };
}

const agentConfigs: Record<string, AgentConfig> = {
  interceptor: {
    bgClass: "bg-gradient-to-br from-cyan-400 to-blue-600 text-white",
    glowClass: "glow-cyan",
    icon: Cpu,
    anchors: {
      desktop: { left: "24%", top: "24%" },
      mobile: { left: "20%", top: "20%" },
    },
  },
  contextualizer: {
    bgClass: "bg-gradient-to-br from-indigo-400 to-purple-600 text-white",
    glowClass: "glow-indigo",
    icon: BrainCircuit,
    anchors: {
      desktop: { left: "76%", top: "24%" },
      mobile: { left: "80%", top: "20%" },
    },
  },
  scheduler: {
    bgClass: "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
    glowClass: "glow-amber",
    icon: Waypoints,
    anchors: {
      desktop: { left: "24%", top: "76%" },
      mobile: { left: "20%", top: "80%" },
    },
  },
  translator: {
    bgClass: "bg-gradient-to-br from-pink-400 to-rose-500 text-white",
    glowClass: "glow-rose",
    icon: Sparkles,
    anchors: {
      desktop: { left: "76%", top: "76%" },
      mobile: { left: "80%", top: "80%" },
    },
  },
};

const fallbackConfigs: AgentConfig[] = [
  {
    bgClass: "bg-gradient-to-br from-cyan-400 to-blue-600 text-white",
    glowClass: "glow-cyan",
    icon: Cpu,
    anchors: {
      desktop: { left: "24%", top: "24%" },
      mobile: { left: "20%", top: "20%" },
    },
  },
  {
    bgClass: "bg-gradient-to-br from-indigo-400 to-purple-600 text-white",
    glowClass: "glow-indigo",
    icon: BrainCircuit,
    anchors: {
      desktop: { left: "76%", top: "24%" },
      mobile: { left: "80%", top: "20%" },
    },
  },
  {
    bgClass: "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
    glowClass: "glow-amber",
    icon: Waypoints,
    anchors: {
      desktop: { left: "24%", top: "76%" },
      mobile: { left: "20%", top: "80%" },
    },
  },
  {
    bgClass: "bg-gradient-to-br from-pink-400 to-rose-500 text-white",
    glowClass: "glow-rose",
    icon: Sparkles,
    anchors: {
      desktop: { left: "76%", top: "76%" },
      mobile: { left: "80%", top: "80%" },
    },
  },
];

export function InteractiveSwarm({ agents, health, transcript }: InteractiveSwarmProps) {
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close card when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveAgentId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleBallClick = (agentId: string) => {
    if (activeAgentId === agentId) return;
    setActiveAgentId(agentId);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveAgentId(null);
  };

  return (
    <div className="relative flex min-h-[580px] w-full items-center justify-center overflow-hidden rounded-3xl border border-border bg-card/45 p-4 md:min-h-[640px]">
      {/* Backdrop blur for open card state */}
      <div
        onClick={handleClose}
        className={[
          "absolute inset-0 bg-background/70 backdrop-blur-md transition-all duration-500 ease-in-out z-40",
          activeAgentId ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* Center Lottie animation centerpiece */}
      <div
        className={[
          "relative flex flex-col items-center justify-center transition-all duration-500 ease-in-out z-10 select-none pointer-events-none",
          activeAgentId ? "opacity-0 scale-75 blur-sm" : "opacity-100 scale-100",
        ].join(" ")}
      >
        <div className="animate-levitate">
          <iframe
            src="https://lottie.host/embed/9dd28675-4fa2-451b-9b06-1772a236d6aa/9nnbU7eg6R.lottie"
            style={{
              width: isMobile ? "200px" : "280px",
              height: isMobile ? "200px" : "280px",
              border: "none",
            }}
            title="AI Robot Lottie Animation"
          />
        </div>
        {/* Shadow */}
        <div
          className="rounded-full bg-foreground/15 blur-[5px] animate-shadow-pulse dark:bg-foreground/5"
          style={{
            width: isMobile ? "75px" : "110px",
            height: isMobile ? "6px" : "8px",
            marginTop: isMobile ? "-10px" : "-15px",
          }}
        />
      </div>

      {/* Orbiting / Expanding Agent Cards */}
      {agents.map((agent, index) => {
        const config = agentConfigs[agent.id] ?? fallbackConfigs[index % 4];
        const isExpanded = activeAgentId === agent.id;
        const isAnyExpanded = activeAgentId !== null;
        const tone = getAgentStatusTone(agent, health, transcript);
        const lastLatency = getAgentLatency(agent.id, transcript);

        const anchor = isMobile ? config.anchors.mobile : config.anchors.desktop;
        const IconComponent = config.icon;

        // Compute positioning styles
        let style: React.CSSProperties = {};

        if (isExpanded) {
          style = {
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: isMobile ? "94%" : "540px",
            height: isMobile ? "90%" : "auto",
            maxHeight: isMobile ? "90%" : "550px",
            borderRadius: "24px",
            zIndex: 50,
          };
        } else if (isAnyExpanded) {
          // Fade other cards out completely
          style = {
            left: anchor.left,
            top: anchor.top,
            transform: "translate(-50%, -50%) scale(0.6)",
            width: isMobile ? "90px" : "130px",
            height: isMobile ? "90px" : "130px",
            borderRadius: "9999px",
            opacity: 0,
            pointerEvents: "none",
            zIndex: 0,
          };
        } else {
          // Orbiting/Standard floating ball shape
          style = {
            left: anchor.left,
            top: anchor.top,
            transform: "translate(-50%, -50%)",
            width: isMobile ? "95px" : "135px",
            height: isMobile ? "95px" : "135px",
            borderRadius: "9999px",
            zIndex: 30,
            opacity: 1,
            cursor: "pointer",
          };
        }

        return (
          <div
            key={agent.id}
            onClick={() => handleBallClick(agent.id)}
            style={style}
            className={[
              "absolute flex flex-col items-center justify-center transition-all duration-500 ease-out overflow-hidden",
              isExpanded
                ? "bg-card border border-border shadow-2xl cursor-default"
                : `${config.bgClass} ${config.glowClass} hover:scale-108 hover:brightness-105 active:scale-95`,
            ].join(" ")}
          >
            {/* COLLAPSED CONTENT */}
            <div
              className={[
                "absolute flex flex-col items-center justify-center p-3 text-center transition-opacity duration-300 w-full h-full select-none",
                isExpanded ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto",
              ].join(" ")}
            >
              <IconComponent className={isMobile ? "h-6 w-6 mb-1.5" : "h-9 w-9 mb-2"} />
              <span className="font-bold text-[10px] uppercase tracking-wider line-clamp-1">
                {agent.display_name.split(" ")[0]}
              </span>
              <span className="text-[9px] opacity-80 mt-0.5 line-clamp-1">
                {agent.role.split(" ")[0]}
              </span>

              {/* Little Status Indicator Dot */}
              <span className="absolute bottom-2.5 flex h-2 w-2 items-center justify-center">
                <span
                  className={[
                    "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                    tone.dotClass,
                  ].join(" ")}
                />
                <span className={["relative inline-flex rounded-full h-1.5 w-1.5", tone.dotClass].join(" ")} />
              </span>
            </div>

            {/* EXPANDED CONTENT */}
            <div
              className={[
                "w-full h-full flex flex-col text-foreground transition-opacity duration-300 overflow-hidden",
                isExpanded
                  ? "opacity-100 pointer-events-auto delay-150"
                  : "opacity-0 pointer-events-none",
              ].join(" ")}
            >
              {/* Header with Title and Close */}
              <div className="flex items-start justify-between border-b border-border bg-muted/20 px-6 py-4.5">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    {agent.display_name}
                  </h3>
                  <p className="mt-1 text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    {agent.role}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      tone.badgeClass,
                    ].join(" ")}
                  >
                    <span className={["h-1.5 w-1.5 rounded-full", tone.dotClass].join(" ")} />
                    {tone.label}
                  </span>
                  <button
                    onClick={handleClose}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 expanded-card-scroll">
                {/* Specification Fields Grid */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <ExpandedField label="Primary runtime" value={agent.primary_runtime} />
                  <ExpandedField label="LLM backend" value={agent.llm_backend} />
                  <ExpandedField label="Dependency" value={agent.dependency} />
                  <ExpandedField
                    label="Last stage latency"
                    value={lastLatency ? `${lastLatency}ms` : "No run yet"}
                  />
                </div>

                {/* Fallback lane */}
                <div className="rounded-2xl border border-border/70 bg-secondary/10 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Fallback lane
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {agent.fallback_chain.length ? (
                      agent.fallback_chain.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-border/60 bg-card px-2.5 py-0.5 text-[11px] text-foreground font-medium"
                        >
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        No fallback chain configured.
                      </span>
                    )}
                  </div>
                </div>

                {/* Expertise & Constraints */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Expertise
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {agent.expertise.slice(0, 3).map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-mint/10 border border-mint/20 px-2.5 py-0.5 text-[11px] text-foreground font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Constraint
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {agent.limitations[0] ?? "No limitation declared."}
                    </p>
                    {typeof agent.confidence_baseline === "number" && (
                      <p className="mt-2 text-[11px] font-mono text-foreground font-semibold">
                        Baseline confidence {Math.round(agent.confidence_baseline * 100)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExpandedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-secondary/10 p-4">
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}
