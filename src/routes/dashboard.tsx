import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Clock3, NotebookText, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Daily Clarity — Workplace Proxy" },
      {
        name: "description",
        content:
          "A simplified reset of the Daily Clarity experience while the planner-first redesign is being defined.",
      },
    ],
  }),
  component: DailyClarityReset,
});

const sections = [
  {
    title: "Morning brief",
    description: "A quick read on today's priorities, energy, and what needs attention first.",
    icon: Sparkles,
  },
  {
    title: "Meeting-aware calendar",
    description: "A clear schedule view that explains meetings, buffers, conflicts, and suggested focus windows.",
    icon: CalendarDays,
  },
  {
    title: "Priority flow",
    description: "Only the top tasks for today, not every system detail or backend trace.",
    icon: Clock3,
  },
  {
    title: "Notes and parking lot",
    description: "A simple space for thoughts, follow-ups, and things to revisit later.",
    icon: NotebookText,
  },
];

const loadingAnimationSrcDoc = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: transparent;
      }
      canvas {
        width: 100% !important;
        height: 100% !important;
        display: block;
        background: transparent;
      }
    </style>
    <script src="https://unpkg.com/@lottiefiles/dotlottie-web/dist/dotlottie-web.js"></script>
  </head>
  <body>
    <canvas id="loading-animation"></canvas>
    <script>
      new DotLottie({
        canvas: document.getElementById("loading-animation"),
        src: "https://lottie.host/embed/af715c09-b2c4-4c13-a08d-782831435e21/AdNwcE8RRC.lottie",
        autoplay: true,
        loop: true,
        backgroundColor: "transparent",
        layout: { fit: "contain", align: [0.5, 0.5] }
      });
    </script>
  </body>
</html>
`;

function DailyClarityReset() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    "Initializing cognitive focus shell...",
    "Aligning multi-agent debate consensus...",
    "Verifying Google Calendar MCP bindings...",
    "Pre-calculating deep work focus windows...",
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
    }, 2500);

    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 10000);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(loadTimer);
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col px-6 py-10 relative">
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center p-6 border border-border/80 bg-card/65 backdrop-blur-md rounded-[2rem] shadow-xl relative overflow-hidden min-h-[500px] animate-fade-in select-none">
          {/* Animated Neon Ambient Glows */}
          <div className="absolute -left-1/4 -top-1/4 w-96 h-96 rounded-full bg-mint/10 blur-[120px] animate-pulse" />
          <div className="absolute -right-1/4 -bottom-1/4 w-96 h-96 rounded-full bg-lavender/10 blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />

          <div className="relative z-10 flex w-full max-w-4xl flex-col items-center text-center">
            {/* Open animation stage */}
            <div className="relative flex w-full min-h-[420px] items-center justify-center rounded-[2rem] border border-border/50 bg-gradient-to-br from-background/75 via-card/75 to-secondary/20 px-6 py-8 shadow-[0_0_40px_rgba(var(--color-border),0.16)] overflow-visible">
              <iframe
                srcDoc={loadingAnimationSrcDoc}
                style={{
                  width: "min(78vw, 640px)",
                  height: "min(78vw, 640px)",
                  border: "none",
                  background: "transparent",
                }}
                title="AI Robot Lottie Animation"
                className="pointer-events-none"
              />
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
        <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-sm animate-fade-in">
          <div className="border-b border-border/70 px-6 py-4 sm:px-8">
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400">
              Daily Clarity Reset
            </span>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              A calmer planner-first page starts here.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              The previous dashboard has been cleared so this route can be rebuilt around one job:
              helping the user understand their day quickly, especially meetings, schedule pressure,
              and focus time.
            </p>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              {sections.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className="flex items-start gap-4 rounded-2xl border border-border/70 bg-background/80 p-4 transition-all duration-200 hover:border-border hover:shadow-xs"
                >
                  <div className="rounded-2xl bg-secondary p-2.5 text-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground sm:text-base">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,249,252,0.92))] dark:bg-[linear-gradient(180deg,rgba(20,20,25,0.92),rgba(15,15,20,0.92))] p-5">
              <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-background/80 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                      Planner Direction
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">Meeting + schedule clarity</h2>
                  </div>
                  <div className="rounded-full bg-amber-100 dark:bg-amber-950/30 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-400">
                    Minimal UI
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/15 p-4 border border-rose-100/10">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 dark:text-rose-400">Day schedule</p>
                    <p className="mt-2 text-sm text-foreground">Time-based calendar with meeting insights and buffers.</p>
                  </div>
                  <div className="rounded-2xl bg-lime-50 dark:bg-lime-950/15 p-4 border border-lime-100/10">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-700 dark:text-lime-400">Activities</p>
                    <p className="mt-2 text-sm text-foreground">Prep notes, top tasks, and recommended next action.</p>
                  </div>
                  <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/15 p-4 border border-sky-100/10">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-400">Focus windows</p>
                    <p className="mt-2 text-sm text-foreground">Protected blocks created after checking the real calendar.</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/15 p-4 border border-amber-100/10">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">Notes</p>
                    <p className="mt-2 text-sm text-foreground">A lightweight note area inspired by a paper daily planner.</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border/70 bg-secondary/40 p-4 text-sm text-muted-foreground">
                Detailed product spec: <span className="font-medium text-foreground">docs/daily_clarity.md</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
