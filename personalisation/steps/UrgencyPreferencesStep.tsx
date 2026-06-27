import React from "react";
import { OnboardingCard } from "../components/OnboardingCard";
import { Flame, BrainCircuit, MessageSquareCode, Coffee } from "lucide-react";

interface UrgencyPreferencesStepProps {
  value: string;
  onChange: (value: string) => void;
}

export const UrgencyPreferencesStep: React.FC<UrgencyPreferencesStepProps> = ({ value, onChange }) => {
  const options = [
    {
      id: "assume_urgent",
      title: "Assume Urgent",
      description: "Treat all tasks as due today.",
      icon: <Flame className="h-5 w-5 text-red-400" />,
    },
    {
      id: "use_context",
      title: "Use Context Clues (Recommended)",
      description: "Assess sender context and deadlines.",
      icon: <BrainCircuit className="h-5 w-5 text-amber-400" />,
    },
    {
      id: "ask_clarification",
      title: "Ask for Clarification",
      description: "Flag items and ask me to decide.",
      icon: <MessageSquareCode className="h-5 w-5 text-cyan-400" />,
    },
    {
      id: "default_low",
      title: "Default to Low Priority",
      description: "Unless marked urgent, deprioritize.",
      icon: <Coffee className="h-5 w-5 text-blue-400" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">How should we interpret vague urgency?</h2>
        <p className="text-xs text-white/50 leading-relaxed max-w-md mx-auto">
          When a colleague says <span className="text-cyan-400 italic">"no rush"</span> or <span className="text-cyan-400 italic">"whenever you get a chance"</span>, how should your proxy schedule it?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {options.map((opt) => (
          <OnboardingCard
            key={opt.id}
            icon={opt.icon}
            title={opt.title}
            description={opt.description}
            selected={value === opt.id}
            onClick={() => onChange(opt.id)}
            variant="single"
          />
        ))}
      </div>
    </div>
  );
};
