import { useState } from "react";
import { ClarityMessage } from "../lib/mock-data";
import { Check, Edit, X, Calendar, AlertCircle, ChevronDown, ChevronUp, Bot, Sparkles } from "lucide-react";

type TranslatedTaskCardProps = {
  message: ClarityMessage;
  onAcknowledge: (id: string) => void;
  onOpenDebate: (debateId: string) => void;
};

export function TranslatedTaskCard({ message, onAcknowledge, onOpenDebate }: TranslatedTaskCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [fidelity, setFidelity] = useState(message.fidelity_rating);

  const { action, complexity, expected_duration, steps } = message.translated_bullet_points;

  // Render steps based on fidelity rating
  const renderedSteps = steps.slice(0, Math.max(1, Math.floor((fidelity / 5) * steps.length)));

  const complexityColors = {
    Low: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
    Medium: "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
    High: "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border-red-100 dark:border-red-900/30"
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm animate-scale-in flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-secondary px-2 py-0.5 rounded-full">
            Recommended Action Briefing
          </span>
          <h3 className="text-base font-bold text-foreground tracking-tight mt-1.5 leading-snug">
            {action}
          </h3>
        </div>
        
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${complexityColors[complexity]}`}>
          {complexity}
        </span>
      </div>

      {/* Time and Duration badges */}
      <div className="flex flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5 bg-secondary/55 text-foreground/80 px-3 py-1.5 rounded-xl font-medium">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Slot: {message.suggested_start_time} - {message.suggested_end_time}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-secondary/55 text-foreground/80 px-3 py-1.5 rounded-xl font-medium">
          <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Duration: {expected_duration}</span>
        </div>
      </div>

      {/* Fidelity Rating Slider */}
      <div className="space-y-1.5 py-1 border-t border-b border-border/60">
        <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
          <span>Briefing Detail Level</span>
          <span className="font-semibold text-foreground font-mono">Fidelity: {fidelity}/5</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="5" 
          value={fidelity}
          onChange={(e) => setFidelity(parseInt(e.target.value))}
          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-mint"
        />
        <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
          <span>Executive (1)</span>
          <span>Balanced (3)</span>
          <span>Granular Checklist (5)</span>
        </div>
      </div>

      {/* Steps checklist */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Synthesized Steps</p>
        <ul className="space-y-2.5">
          {renderedSteps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-mint-soft text-mint">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              <span className="leading-relaxed mt-0.5">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Explainable AI block */}
      <div className="border border-border/80 rounded-xl overflow-hidden bg-secondary/20">
        <button 
          onClick={() => setShowReasoning(!showReasoning)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-muted-foreground hover:bg-secondary/40 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-indigo-500" /> Explainable AI Rationale
          </span>
          {showReasoning ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showReasoning && (
          <div className="px-4 pb-4 text-xs leading-relaxed text-muted-foreground animate-fade-in">
            {message.reasoning}
            {message.debate_id && (
              <button 
                onClick={() => onOpenDebate(message.debate_id!)}
                className="mt-3 flex items-center gap-1.5 text-mint font-semibold hover:underline"
              >
                <Sparkles className="h-3 w-3" /> View Agent Consensus Debate
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-2 pt-2 border-t border-border/55">
        <button 
          onClick={() => onAcknowledge(message.message_id)}
          disabled={message.acknowledged}
          className={[
            "flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all duration-200",
            message.acknowledged 
              ? "bg-secondary text-muted-foreground cursor-not-allowed" 
              : "bg-mint text-white hover:opacity-90 shadow-sm shadow-mint-soft"
          ].join(" ")}
        >
          <Check className="h-4 w-4" strokeWidth={2} />
          {message.acknowledged ? "Scheduled" : "Commit to Calendar"}
        </button>
        
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors shrink-0">
          <Edit className="h-4 w-4" />
        </button>
        
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
