import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SlidersHorizontal, Sparkles, Check, Info, Bell, Eye, EyeOff, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/preferences")({
  head: () => ({
    meta: [
      { title: "Preferences & Calibration — Workplace Proxy" },
      {
        name: "description",
        content: "Tune sensory load, agent verbosity and translation fidelity to match your cognitive style.",
      },
    ],
  }),
  component: PreferencesPage,
});

function PreferencesPage() {
  const [style, setStyle] = useState<"checklist" | "summary" | "bullets" | "paragraph">("checklist");
  const [deadline, setDeadline] = useState<"strict" | "flexible" | "suggest">("suggest");
  const [verbosity, setVerbosity] = useState<"minimal" | "balanced" | "detailed">("balanced");
  const [calendarMode, setCalendarMode] = useState<"auto" | "ask" | "never">("ask");
  const [neuroMode, setNeuroMode] = useState(true);
  const [animations, setAnimations] = useState(true);
  const [sensoryDensity, setSensoryDensity] = useState(40); // slider 0-100

  const [savedMessage, setSavedMessage] = useState(false);

  const [rawMessage, setRawMessage] = useState(
    "Hey, can we quickly align on the roadmap sync whenever you get a chance? Might need to pivot some priorities soon."
  );
  const [previewOutput, setPreviewOutput] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);

  const handlePreviewSynthesis = async () => {
    setIsPreviewLoading(true);
    setPreviewOutput("");
    try {
      const response = await fetch("http://localhost:8000/api/v1/synthesis/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: rawMessage,
          format: style,
          verbosity: verbosity,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to Swarm synthesis api.");
      }

      const data = await response.json();
      setPreviewOutput(data.synthesized_text);
      setIsSimulated(!!data.simulated);
    } catch (err: any) {
      setPreviewOutput(`Error: ${err.message || "Something went wrong during Swarm synthesis."}`);
      setIsSimulated(true);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const saveSettings = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="mx-auto max-w-[1000px] px-6 pt-8 pb-28 animate-fade-in select-none">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Calibration Panel</span>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Cognitive Preferences
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Adapt how agents structure notifications, estimate task parameters, and schedule periods of deep focus.
          </p>
        </div>

        {savedMessage && (
          <span className="text-xs font-semibold text-mint bg-mint-soft/30 px-3.5 py-2 rounded-xl flex items-center gap-1.5 animate-scale-in">
            <Check className="h-4 w-4" /> Calibration bindings locked!
          </span>
        )}
      </header>

      {/* Main Form Box */}
      <div className="space-y-6">
        
        {/* Neuro-inclusive Accommodation alert */}
        <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-soft shrink-0">
            <Sparkles className="h-5 w-5 text-mint" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">Active Neuro-inclusive Calibration</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Workspace parameters are currently calibrated to match active ADHD & Neurodivergent focus profiles. High sensory noise filtering and automated scheduling breaks are active by default.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Box 1: Synthesis Format */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <Info className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Translation synthesis</h3>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-foreground/80 block">Preferred Output Structure</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "checklist", label: "Checklist (Detailed)" },
                  { id: "summary", label: "Executive Summary" },
                  { id: "bullets", label: "Bullet points" },
                  { id: "paragraph", label: "Paragraph format" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setStyle(item.id as any)}
                    className={[
                      "p-3 rounded-xl border text-[11px] font-semibold text-left transition-all duration-200",
                      style === item.id 
                        ? "border-mint bg-mint-soft/30 text-foreground" 
                        : "border-border hover:bg-secondary/40 text-muted-foreground"
                    ].join(" ")}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-foreground/80 block">Agent Verbosity Level</label>
              <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl border border-border/50">
                {[
                  { id: "minimal", label: "Minimal" },
                  { id: "balanced", label: "Balanced" },
                  { id: "detailed", label: "Detailed" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setVerbosity(item.id as any)}
                    className={[
                      "flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all text-center",
                      verbosity === item.id 
                        ? "bg-card text-foreground shadow-2xs" 
                        : "text-muted-foreground hover:text-foreground"
                    ].join(" ")}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Box 2: Time Allocation Behavior */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Calendar schedule patterns</h3>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-foreground/80 block">Dynamic scheduling options</label>
              <div className="flex flex-col gap-2.5">
                {[
                  { id: "auto", label: "Auto Schedule directly on Calendar", desc: "Let Scheduler Agent book confirmed items without confirmation." },
                  { id: "ask", label: "Ask first (Confirmation draft block)", desc: "Draw draft boxes first, book only when user confirms." },
                  { id: "never", label: "Never Schedule automatically", desc: "Disable calendar routing entirely." }
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setCalendarMode(item.id as any)}
                    className={[
                      "p-3 rounded-xl border cursor-pointer transition-all duration-200",
                      calendarMode === item.id 
                        ? "border-mint bg-mint-soft/20 text-foreground" 
                        : "border-border hover:bg-secondary/40 text-muted-foreground"
                    ].join(" ")}
                  >
                    <div className="text-[11px] font-bold text-foreground">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Box 3: Sensory & Neuro-inclusive controls */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <Eye className="h-4.5 w-4.5 text-muted-foreground" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Sensory presentation</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground">High Contrast / Focus Palette</h4>
                  <p className="text-[10px] text-muted-foreground">Swap colors out to maximize reader ease</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={neuroMode} 
                  onChange={(e) => setNeuroMode(e.target.checked)}
                  className="rounded border-border text-mint focus:ring-mint"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Smooth transitions & animations</h4>
                  <p className="text-[10px] text-muted-foreground">Enable calming keyframe motion filters</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={animations} 
                  onChange={(e) => setAnimations(e.target.checked)}
                  className="rounded border-border text-mint focus:ring-mint"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                <span>Sensory Density Level</span>
                <span className="font-semibold text-foreground font-mono">{sensoryDensity}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={sensoryDensity}
                onChange={(e) => setSensoryDensity(parseInt(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-mint"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
                <span>Minimalist (Low Load)</span>
                <span>Standard</span>
                <span>Hyper-granular Details</span>
              </div>
            </div>
          </div>
        </div>

        {/* Box 4: Swarm Synthesis Sandbox */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6 relative overflow-hidden group">
          {/* Subtle neon ambient overlay */}
          <div className="absolute -inset-px bg-gradient-to-r from-mint/5 to-lavender/5 rounded-2xl opacity-60 pointer-events-none" />

          <div className="flex items-center gap-2 pb-2 border-b border-border/60 relative z-10">
            <Sparkles className="h-4.5 w-4.5 text-mint animate-pulse" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Swarm Translation Sandbox</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
            {/* Input message - 5cols */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <label className="text-xs font-semibold text-foreground/80 block">Vague Corporate Signal Input</label>
              <textarea
                value={rawMessage}
                onChange={(e) => setRawMessage(e.target.value)}
                placeholder="Type a vague Slack or email message here to test..."
                className="w-full text-xs font-mono rounded-xl border border-border bg-secondary/30 text-foreground p-3.5 outline-hidden focus:border-mint focus:ring-1 focus:ring-mint/20 min-h-[140px] resize-y leading-relaxed transition-all duration-200"
              />
              <button
                onClick={handlePreviewSynthesis}
                disabled={isPreviewLoading || !rawMessage.trim()}
                className={[
                  "w-full py-3 rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-all duration-200 text-center flex items-center justify-center gap-2",
                  isPreviewLoading 
                    ? "bg-secondary text-muted-foreground border border-border" 
                    : "bg-mint-soft text-mint border border-mint/20 hover:bg-mint-soft/80"
                ].join(" ")}
              >
                {isPreviewLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Synthesizing via Swarm...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" /> Synthesize Preview Output
                  </>
                )}
              </button>
            </div>

            {/* Synthesized Preview - 7cols */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-foreground/80 block">Swarm Cognition Preview</label>
                {isSimulated && previewOutput && (
                  <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/15 animate-pulse">
                    ⚠️ Simulated Fallback
                  </span>
                )}
              </div>

              <div className="relative rounded-xl border border-border bg-secondary/20 p-4 min-h-[185px] flex flex-col justify-between overflow-hidden">
                {isPreviewLoading && (
                  <div className="absolute inset-0 bg-card/65 backdrop-blur-xs flex flex-col items-center justify-center gap-2 animate-in fade-in duration-200">
                    <div className="h-7 w-7 rounded-full border-2 border-mint border-t-transparent animate-spin" />
                    <span className="text-[10px] font-mono text-muted-foreground animate-pulse">Debating consensus...</span>
                  </div>
                )}

                {previewOutput ? (
                  <div className="text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap select-text selection:bg-mint/20">
                    {previewOutput}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground min-h-[150px]">
                    <Sparkles className="h-7 w-7 text-muted-foreground/30 mb-2" />
                    <p className="text-xs font-semibold">Your synthesized preview will appear here.</p>
                    <p className="text-[10px] mt-1 text-muted-foreground/72 max-w-sm">
                      Select your preferred format (e.g., Checklist or Bullet points) and click "Synthesize Preview" to watch the swarm process it.
                    </p>
                  </div>
                )}

                {isSimulated && previewOutput && (
                  <div className="mt-4 pt-3 border-t border-border/50 text-[9px] text-amber-500 leading-normal flex items-start gap-1">
                    <span>⚠️</span>
                    <span>
                      Google Gemini API Key is not configured. Real Swarm preview is unavailable. To connect your Gemini key, configure <strong>GOOGLE_API_KEY</strong> in <code>backend/.env</code>.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={saveSettings}
            className="px-6 py-3 rounded-xl bg-foreground text-background font-bold text-xs hover:opacity-90 transition-opacity shadow-md"
          >
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}
