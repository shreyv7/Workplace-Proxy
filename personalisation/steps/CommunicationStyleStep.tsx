import React from "react";
import { OnboardingCard } from "../components/OnboardingCard";
import { CheckSquare, List, FileText, Kanban } from "lucide-react";

interface CommunicationStyleStepProps {
  value: string;
  onChange: (value: string) => void;
}

export const CommunicationStyleStep: React.FC<CommunicationStyleStepProps> = ({ value, onChange }) => {
  const options = [
    {
      id: "checklists",
      title: "Checklists",
      description: "Numbered action items to check off.",
      icon: <CheckSquare className="h-5 w-5" />,
    },
    {
      id: "bullet_points",
      title: "Bullet Points",
      description: "Clean, scannable bullet summaries.",
      icon: <List className="h-5 w-5" />,
    },
    {
      id: "short_paragraphs",
      title: "Short Paragraphs",
      description: "Paragraphs with key details bolded.",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: "visual_kanban",
      title: "Visual / Kanban",
      description: "Visual columns instead of raw text.",
      icon: <Kanban className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">How should we talk to you?</h2>
        <p className="text-xs text-white/50 leading-relaxed">
          Choose the content layout style that helps your brain digest information best. We will translate all agent communications into this layout.
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
