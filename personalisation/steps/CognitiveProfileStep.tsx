import React from "react";
import { OnboardingCard } from "../components/OnboardingCard";
import { Brain, Cpu, Layers, ShieldCheck, Zap } from "lucide-react";

interface CognitiveProfileStepProps {
  value: string;
  onChange: (value: string) => void;
}

export const CognitiveProfileStep: React.FC<CognitiveProfileStepProps> = ({ value, onChange }) => {
  const options = [
    {
      id: "adhd",
      title: "ADHD",
      description: "Need structure. Task-switching drains me.",
      icon: <Brain className="h-5 w-5" />,
    },
    {
      id: "autism",
      title: "Autism Spectrum",
      description: "Need explicit, direct communication.",
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      id: "audhd",
      title: "AuDHD",
      description: "Need structure and directness.",
      icon: <Cpu className="h-5 w-5" />,
    },
    {
      id: "high_load",
      title: "High Cognitive Load",
      description: "Neurotypical, but overwhelmed by noise.",
      icon: <Zap className="h-5 w-5" />,
    },
    {
      id: "prefer_not_to_say",
      title: "Prefer not to say",
      description: "Just optimise for clarity.",
      icon: <Layers className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">How does your brain work?</h2>
        <p className="text-xs text-white/50 leading-relaxed">
          Select the profile that best describes your working style. This data determines how we structure your daily workspace interface.
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
