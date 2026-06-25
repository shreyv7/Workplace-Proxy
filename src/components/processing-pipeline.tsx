import { initialPipelineStages } from "../lib/mock-data";
import { CheckCircle2, Loader2, Play, Cpu } from "lucide-react";

export function ProcessingPipeline() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm animate-scale-in">
      <div className="flex items-center gap-2 pb-5 border-b border-border/70">
        <Cpu className="h-4.5 w-4.5 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground tracking-tight">Active Ingestion Pipeline</h3>
      </div>

      <div className="relative mt-6 pl-4 space-y-6">
        {/* Connection pipeline line */}
        <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-border/60" />

        {initialPipelineStages.map((stage, idx) => {
          const isCompleted = stage.status === "completed";
          const isProcessing = stage.status === "processing";
          
          return (
            <div 
              key={stage.id} 
              className="relative flex items-start gap-4 group animate-slide-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Timeline Indicator Dot */}
              <div className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-card">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-mint shadow-[0_0_8px_var(--mint-soft)] shrink-0" strokeWidth={2.25} />
                ) : isProcessing ? (
                  <span className="relative flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex h-4 w-4 rounded-full bg-indigo-500" />
                  </span>
                ) : (
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/35 group-hover:bg-muted-foreground/60 transition-colors" />
                )}
              </div>

              {/* Stage Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground tracking-tight truncate">
                    {stage.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted-foreground">{stage.duration}</span>
                    {stage.confidence > 0 && (
                      <span className="text-[9px] font-mono font-medium px-1 bg-secondary rounded text-muted-foreground/90">
                        {stage.confidence}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    {isCompleted ? (
                      <span className="text-emerald-500 font-medium">Verified consensus</span>
                    ) : isProcessing ? (
                      <span className="text-indigo-500 font-medium animate-pulse">Running semantic parsing...</span>
                    ) : (
                      "Waiting for stream"
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
