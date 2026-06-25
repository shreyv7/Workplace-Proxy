import { cognitiveLoad } from "../lib/mock-data";
import { Brain, Sparkles, Battery, Zap, AlertTriangle } from "lucide-react";

export function CognitiveLoadWidget() {
  const { current_load, status, focus_window, current_energy, burnout_risk, history } = cognitiveLoad;

  // Determine colors based on load status
  const isHigh = current_load >= 70;
  const isMed = current_load >= 40 && current_load < 70;
  const strokeColor = isHigh 
    ? "stroke-[var(--destructive)]" 
    : isMed 
      ? "stroke-[var(--amber-soft)]" 
      : "stroke-[var(--mint)]";
      
  const textColor = isHigh 
    ? "text-red-500" 
    : isMed 
      ? "text-amber-500" 
      : "text-emerald-500";

  // Calculate SVG arc parameters for a semi-circle gauge
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const semiCircumference = circumference / 2;
  const strokeDashoffset = semiCircumference - (current_load / 100) * semiCircumference;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm animate-scale-in">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-4.5 w-4.5 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Cognitive State</h3>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-medium font-mono text-muted-foreground uppercase bg-secondary/50 px-2 py-0.5 rounded-full">
          <Sparkles className="h-3 w-3 text-mint" /> Live
        </span>
      </div>

      <div className="flex flex-col items-center justify-center pt-2">
        {/* Semi-circular gauge */}
        <div className="relative flex items-center justify-center h-28 w-44 overflow-hidden">
          <svg className="absolute top-0 left-0 w-full h-full transform -rotate-180" viewBox="0 0 120 70">
            {/* Background Track */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="stroke-muted fill-none"
              strokeWidth={strokeWidth}
              strokeDasharray={semiCircumference}
              strokeDashoffset="0"
              strokeLinecap="round"
            />
            {/* Active Indication */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              className={`fill-none transition-all duration-1000 ease-out ${strokeColor}`}
              strokeWidth={strokeWidth}
              strokeDasharray={semiCircumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          
          <div className="absolute bottom-0 text-center pb-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">{current_load}%</span>
            <p className={`text-xs font-semibold ${textColor} uppercase tracking-wider mt-1`}>{status}</p>
          </div>
        </div>

        {/* Weekly Load Sparks */}
        <div className="w-full mt-4">
          <div className="flex items-end justify-between px-1 h-12 gap-1.5">
            {history.map((day) => {
              const heightPercent = `${day.load}%`;
              const isToday = day.day === "Thu";
              const barColor = day.load >= 70
                ? "bg-red-400"
                : day.load >= 40
                  ? "bg-amber-400"
                  : "bg-emerald-400/80";
                  
              return (
                <div key={day.day} className="flex flex-col items-center flex-1">
                  <div className="w-full bg-secondary/55 rounded-t-sm h-10 flex items-end">
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-500 ${barColor} ${isToday ? "ring-2 ring-foreground/20" : ""}`}
                      style={{ height: heightPercent }}
                    />
                  </div>
                  <span className={`text-[10px] font-mono mt-1 ${isToday ? "font-bold text-foreground" : "text-muted-foreground"}`}>{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sub-metrics */}
        <div className="grid grid-cols-2 gap-3 w-full mt-5 pt-4 border-t border-border/70">
          <div className="flex items-center gap-2 rounded-xl bg-secondary/30 p-2.5">
            <Zap className="h-4 w-4 text-amber-500/80 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Focus Peak</p>
              <p className="text-xs font-medium text-foreground truncate">{focus_window}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-secondary/30 p-2.5">
            <Battery className="h-4 w-4 text-emerald-500/80 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Energy Reserve</p>
              <p className="text-xs font-medium text-foreground">{current_energy}%</p>
            </div>
          </div>
        </div>

        {/* Fatigue Warning */}
        <div className="flex items-center gap-2 w-full mt-3 px-3 py-2 rounded-xl bg-secondary/20 text-muted-foreground text-[11px]">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span>Burnout risk is <strong className="text-foreground">{burnout_risk}</strong>. Swarm Core protecting workspace.</span>
        </div>
      </div>
    </div>
  );
}
