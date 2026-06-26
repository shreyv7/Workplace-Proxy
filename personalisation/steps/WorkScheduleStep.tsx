import React from "react";
import { OnboardingCard } from "../components/OnboardingCard";
import { Sun, Sunrise, Sunset, Shuffle } from "lucide-react";

interface WorkScheduleStepProps {
  peakFocusTime: string;
  onPeakFocusTimeChange: (value: string) => void;
}

export const WorkScheduleStep: React.FC<WorkScheduleStepProps> = ({
  peakFocusTime,
  onPeakFocusTimeChange,
}) => {
  const options = [
    {
      id: "morning",
      title: "Morning",
      description: "Peak focus 9 AM – 12 PM.",
      icon: <Sunrise className="h-5 w-5" />,
    },
    {
      id: "afternoon",
      title: "Afternoon",
      description: "Peak focus 1 PM – 4 PM.",
      icon: <Sun className="h-5 w-5" />,
    },
    {
      id: "evening",
      title: "Evening",
      description: "Peak focus 5 PM – 8 PM.",
      icon: <Sunset className="h-5 w-5" />,
    },
    {
      id: "variable",
      title: "Variable",
      description: "It changes day to day.",
      icon: <Shuffle className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">When are you sharpest?</h2>
        <p className="text-xs text-white/50 leading-relaxed">
          Tell us when your brain executes task work best so we can safeguard deep work blocks and hold low-cognitive items for other times.
        </p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {options.map((opt) => (
            <OnboardingCard
              key={opt.id}
              icon={opt.icon}
              title={opt.title}
              description={opt.description}
              selected={peakFocusTime === opt.id}
              onClick={() => onPeakFocusTimeChange(opt.id)}
              variant="single"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

