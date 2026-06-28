import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useAuth } from "../../personalisation/auth/AuthProvider";
import {
  getDailyClarity,
  saveDailyNotes,
  rescheduleBlock,
  type NormalizedEvent,
  type PriorityTask,
  type DailyClarityResponse,
} from "../lib/api";
import { supabase } from "../lib/supabase";
import {
  CalendarDays,
  Clock,
  Sparkles,
  Notebook,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Calendar,
  AlertCircle,
  ArrowRight,
  ShieldAlert
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Daily Clarity — Workplace Proxy" },
      {
        name: "description",
        content:
          "Today's translated workspace signals and a cognitive-load calendar of your scheduled focus and tasks.",
      },
    ],
  }),
  component: DailyClarity,
});

const getBlockStyles = (blockType: string) => {
  switch (blockType) {
    case "meeting":
      return {
        stripe: "bg-indigo-500",
        tag: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold",
      };
    case "deep_work":
      return {
        stripe: "bg-sky-500",
        tag: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/25 px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold",
      };
    case "shallow_work":
      return {
        stripe: "bg-amber-500",
        tag: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold",
      };
    case "free":
      return {
        stripe: "bg-emerald-500",
        tag: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold",
      };
    default:
      return {
        stripe: "bg-muted",
        tag: "bg-muted/10 text-muted-foreground border border-muted/20 px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold",
      };
  }
};

function DailyClarity() {
  const { user } = useAuth();
  const userId = user?.id || "mock_user";
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("calibrationLoaded") !== "true";
    }
    return true;
  });
  const [loadingStep, setLoadingStep] = useState(0);
  const [data, setData] = useState<DailyClarityResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [notes, setNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null);

  const loadingSteps = [
    "Initializing cognitive focus shell...",
    "Aligning multi-agent debate consensus...",
    "Verifying Google Calendar MCP bindings...",
    "Pre-calculating deep work focus windows...",
  ];

  // Fetch daily clarity data
  const loadClarityData = useCallback(async () => {
    setLoadError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const googleToken = session?.provider_token ?? (typeof window !== "undefined" ? sessionStorage.getItem("google_provider_token") : null) ?? undefined;
      const res = await getDailyClarity(date, userId, googleToken);
      setData(res);
      setNotes(res.notes || "");
      setSelectedEvent((current) => {
        if (current) {
          const matching = res.schedule_blocks.find((block) => block.id === current.id);
          if (matching) return matching;
        }
        const firstMeeting = res.schedule_blocks.find((block) => block.block_type === "meeting");
        return firstMeeting || res.schedule_blocks[0] || null;
      });
    } catch (err) {
      console.error("Failed to load daily clarity:", err);
      setLoadError("Daily Clarity could not load right now.");
    }
  }, [date, userId]);

  useEffect(() => {
    loadClarityData();
  }, [loadClarityData]);

  // Loading animation triggers
  useEffect(() => {
    if (!isLoading) return;

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
    }, 2500);

    const loadTimer = setTimeout(() => {
      setIsLoading(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("calibrationLoaded", "true");
      }
    }, 10000);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(loadTimer);
    };
  }, [isLoading]);

  // Save notes handler
  const handleSaveNotes = async () => {
    setSaveStatus("saving");
    try {
      await saveDailyNotes(userId, date, notes);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to save notes:", err);
      setSaveStatus("error");
    }
  };

  // Handle reschedule suggestion acceptance
  const handleReschedule = async (blockId: string) => {
    try {
      const block = data?.schedule_blocks.find(b => b.id === blockId);
      if (block) {
        const originalStart = new Date(block.start);
        const originalEnd = new Date(block.end);
        const newStart = new Date(originalStart.getTime() + 30 * 60 * 1000).toISOString();
        const newEnd = new Date(originalEnd.getTime() + 30 * 60 * 1000).toISOString();
        
        await rescheduleBlock(userId, blockId, newStart, newEnd);
        loadClarityData();
      }
    } catch (err) {
      console.error("Reschedule failed:", err);
    }
  };

  // Helper formatting for simple clock time (HH:MM) in the user's local timezone
  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col px-6 py-8 relative">
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden min-h-[500px] animate-scale-in select-none">
          {/* Animated Neon Ambient Glows */}
          <div className="absolute -left-1/4 -top-1/4 w-96 h-96 rounded-full bg-mint/10 blur-[120px] animate-pulse" />
          <div className="absolute -right-1/4 -bottom-1/4 w-96 h-96 rounded-full bg-lavender/10 blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />

          <div className="relative z-10 flex w-full max-w-5xl flex-col items-center text-center">
            <div className="relative flex w-full min-h-[420px] items-center justify-center overflow-hidden">
              <div className="relative z-10 h-[min(76vw,560px)] w-[min(76vw,560px)]">
                <DotLottieReact
                  src="https://lottie.host/af715c09-b2c4-4c13-a08d-782831435e21/AdNwcE8RRC.lottie"
                  autoplay
                  loop
                />
              </div>
            </div>

            {/* Connection Telemetry Badge */}
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/5 px-3.5 py-1 text-[10px] font-mono uppercase tracking-wider text-mint shadow-[0_0_10px_oklch(0.82_0.16_168_/_15%)]">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Calibrating daily context</span>
            </div>

            {/* Loading Steps text */}
            <p className="mt-4 text-xs font-bold font-mono text-muted-foreground min-h-[1.5rem] tracking-wide animate-pulse">
              [ {loadingSteps[loadingStep]} ]
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Header Dashboard section */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6 relative overflow-hidden group p-6 bg-card/45 backdrop-blur-md rounded-3xl border border-border/50">
            <div className="absolute -inset-px bg-gradient-to-r from-mint/5 to-lavender/5 rounded-3xl opacity-50 blur-xs" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-mint/10 text-mint border border-mint/20">
                  Daily Clarity Reset
                </span>
                <span className="text-xs font-mono text-muted-foreground">{date}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight mt-2">
                Good morning, {user?.email?.split("@")[0] || "Planner"}!
              </h1>
              <p className="text-xs text-muted-foreground font-mono mt-1 max-w-2xl leading-relaxed">
                {loadError ? <span className="text-rose-400">{loadError}</span> : <>🎯 {data?.summary}</>}
              </p>
            </div>

            {/* Header statistics chips */}
            <div className="relative z-10 flex flex-wrap gap-2 md:self-end">
              <div className="px-3 py-1.5 rounded-xl bg-secondary/60 border border-border/60 text-[10px] font-bold font-mono text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-lavender" /> {data?.stats.meetings} Meetings
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-secondary/60 border border-border/60 text-[10px] font-bold font-mono text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-mint" /> {data?.stats.focusBlocks} Focus Blocks
              </div>
              {data?.stats.conflicts && data.stats.conflicts > 0 ? (
                <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold font-mono text-rose-500 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> {data.stats.conflicts} Conflict
                </div>
              ) : null}
            </div>
          </header>

          {/* Main Grid: Left Timeline Schedule (60%) | Right Meeting Prep + Priorities + Notes (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
            
            {/* Left Column: Daily Planner Calendar Timeline */}
            <section className="lg:col-span-6 flex flex-col gap-4">
              <div className="bg-card/70 border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <CalendarDays className="h-4.5 w-4.5 text-mint" /> Today's Focus Schedule
                  </h2>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">09:00 - 18:00</span>
                </div>

                {/* Timeline schedule slots */}
                <div className="flex flex-col gap-3.5">
                  {data?.schedule_blocks?.map((block) => {
                    const isMeeting = block.block_type === "meeting";
                    const isSelected = selectedEvent?.id === block.id;
                    const hasConflict = block.conflict_level === "medium" || block.conflict_level === "high";

                    return (
                      <div
                        key={block.id}
                        onClick={() => setSelectedEvent(block)}
                        className={[
                          "p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 relative",
                          isSelected
                            ? "bg-secondary/70 border-lavender shadow-[0_0_15px_oklch(0.78_0.18_290_/_10%)]"
                            : "bg-background/40 border-border/50 hover:bg-secondary/35",
                        ].join(" ")}
                      >
                        {/* Status sidebar stripe indicator */}
                        <div
                          className={[
                            "w-1 h-full absolute left-0 top-0 rounded-l-2xl",
                            getBlockStyles(block.block_type).stripe,
                          ].join(" ")}
                        />

                        {/* Event Time */}
                        <div className="min-w-[65px] font-mono text-xs font-semibold text-muted-foreground flex flex-col gap-0.5">
                          <span>{formatTime(block.start)}</span>
                          <span className="text-[9px] opacity-75">{formatTime(block.end)}</span>
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xs font-bold text-foreground truncate">{block.title}</h3>
                            <span className={getBlockStyles(block.block_type).tag}>
                              {block.block_type.replace("_", " ")}
                            </span>
                          </div>
                          
                          {block.prep_required && (
                            <div className="mt-2 text-[10px] text-amber-500 font-semibold flex items-center gap-1 sensory-detail">
                              <Sparkles className="h-3 w-3 animate-pulse" /> Required prep checklist available
                            </div>
                          )}
                          
                          {hasConflict && (
                            <div className="mt-2 text-[10px] text-rose-500 font-bold flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Overload Warning: overlap detected
                            </div>
                          )}
                        </div>

                        {/* Action details slot */}
                        {block.can_reschedule && hasConflict && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReschedule(block.id);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-mint/20 hover:border-mint/50 bg-mint/5 hover:bg-mint/10 text-[9px] font-bold text-mint transition-all"
                          >
                            Reschedule
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Right Column: Insights + Priorities + Notes */}
            <section className="lg:col-span-4 flex flex-col gap-6">
              
              {/* 1. Meeting Prep Insight Card */}
              {selectedEvent && selectedEvent.block_type === "meeting" && (
                <div className="bg-card/70 border border-border/50 rounded-3xl p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
                  <div className="absolute -inset-px bg-gradient-to-r from-lavender/5 to-transparent rounded-3xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5 relative z-10">
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-lavender" /> Meeting Insight: {selectedEvent.title}
                    </h3>
                  </div>
                  
                  <div className="relative z-10 flex flex-col gap-2">
                    <p className="text-[11px] leading-relaxed text-muted-foreground font-mono">
                      "{data?.meeting_insights[selectedEvent.id] || "No detailed insights found for this event."}"
                    </p>
                    
                    {selectedEvent.prep_required && selectedEvent.prep_notes && (
                      <div className="mt-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider font-mono block">Required Prep Checklist</span>
                        <p className="text-[10px] text-foreground font-semibold mt-1">📝 {selectedEvent.prep_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Today's Top Priorities */}
              <div className="bg-card/70 border border-border/50 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-mint" /> Top Priorities
                  </h3>
                  <span className="text-[9px] font-mono text-muted-foreground">TOP 3 TASKS</span>
                </div>

                <div className="flex flex-col gap-3">
                  {data?.top_priorities?.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl bg-background/35 border border-border/40 hover:border-border/80 transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10.5px] font-bold text-foreground line-clamp-1">{task.title}</span>
                        <span
                          className={[
                            "px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase",
                            task.importance === "high" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400",
                          ].join(" ")}
                        >
                          {task.importance}
                        </span>
                      </div>

                      <p className="text-[9.5px] text-muted-foreground font-mono line-clamp-2 leading-relaxed sensory-detail">
                        {task.why_important}
                      </p>

                      <div className="flex items-center justify-between mt-1 text-[9px] text-muted-foreground font-mono sensory-detail">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {task.expected_duration}</span>
                        <span className="px-2 py-0.5 rounded-full bg-secondary/80 text-foreground font-bold">{task.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Notes / Parking Lot */}
              <div className="bg-card/70 border border-border/50 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Notebook className="h-4 w-4 text-lavender" /> Notes & Parking Lot
                  </h3>
                  <span className="text-[9px] font-mono text-muted-foreground">MENTAL OFFLOAD</span>
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Capture quick thoughts, items to reschedule, questions to ask, or tasks that can wait..."
                  className="w-full min-h-[120px] p-3 text-xs bg-background/35 text-foreground rounded-xl border border-border/50 focus:border-lavender focus:ring-1 focus:ring-lavender/30 outline-hidden transition-all duration-200 resize-none font-mono placeholder:opacity-65"
                />

                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-muted-foreground font-mono">
                    {saveStatus === "saving" && "Saving notes..."}
                    {saveStatus === "saved" && "✅ Notes saved"}
                    {saveStatus === "error" && "❌ Save failed"}
                  </span>
                  <button
                    onClick={handleSaveNotes}
                    disabled={saveStatus === "saving"}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-mint to-lavender hover:opacity-90 text-[10px] font-bold text-white shadow-xs hover:shadow-[0_0_12px_rgba(20,220,180,0.25)] transition-all cursor-pointer flex items-center gap-1"
                  >
                    Save Notes
                  </button>
                </div>
              </div>

            </section>
          </div>
        </div>
      )}
    </div>
  );
}
