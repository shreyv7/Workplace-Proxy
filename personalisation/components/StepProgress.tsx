import React from "react";
import { Check } from "lucide-react";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const StepProgress: React.FC<StepProgressProps> = ({ currentStep, totalSteps }) => {
  const steps = [
    { id: 1, label: "Cognitive Profile" },
    { id: 2, label: "Communication Style" },
    { id: 3, label: "Focus Time" },
    { id: 4, label: "Working Hours" },
    { id: 5, label: "Stress Triggers" },
    { id: 6, label: "Urgency" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mb-5">
      {/* Progress Bar Container */}
      <div className="relative flex items-center justify-between">
        {/* Background line connecting dots */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/5 z-0" />

        {/* Active progress line fill */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 z-0"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              {/* Dot */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-500 ${
                  isCompleted
                    ? "bg-cyan-500 border-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    : isActive
                    ? "bg-black border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-4 ring-cyan-500/10"
                    : "bg-[#0c0c0c] border-white/10 text-white/40"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : (
                  <span className="text-xs font-semibold font-mono">{step.id}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={`absolute top-10 whitespace-nowrap text-[9px] tracking-widest font-semibold uppercase hidden sm:block transition-all duration-300 ${
                  isActive ? "text-cyan-400" : isCompleted ? "text-white/60" : "text-white/30"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
