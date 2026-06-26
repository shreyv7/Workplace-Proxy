import React from "react";
import { OnboardingCard } from "../components/OnboardingCard";
import {
  Clock,
  MessageSquareOff,
  HelpCircle,
  GitPullRequest,
  CalendarDays,
  MailWarning,
  BellRing,
  PhoneCall,
} from "lucide-react";

interface StressTriggersStepProps {
  selectedTriggers: string[];
  onChange: (value: string[]) => void;
}

export const StressTriggersStep: React.FC<StressTriggersStepProps> = ({
  selectedTriggers,
  onChange,
}) => {
  const options = [
    {
      id: "ambiguous_deadlines",
      title: "Ambiguous Deadlines",
      description: "No clear date or priority level given.",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      id: "passive_aggressive",
      title: "Passive-Aggressive Tone",
      description: "Vague feedback or tense phrasing in chats.",
      icon: <MessageSquareOff className="h-5 w-5" />,
    },
    {
      id: "vague_requests",
      title: "Vague Requests",
      description: "Tasks shared with zero context or reference links.",
      icon: <HelpCircle className="h-5 w-5" />,
    },
    {
      id: "context_switches",
      title: "Frequent Context Switches",
      description: "Bouncing constantly between coding and Slack.",
      icon: <GitPullRequest className="h-5 w-5" />,
    },
    {
      id: "surprise_meetings",
      title: "Surprise Meetings",
      description: "Calendar invites dropped without an agenda.",
      icon: <CalendarDays className="h-5 w-5" />,
    },
    {
      id: "info_overload",
      title: "Information Overload",
      description: "Giant walls of text without brief summaries.",
      icon: <MailWarning className="h-5 w-5" />,
    },
    {
      id: "constant_notifs",
      title: "Constant Notifications",
      description: "System updates and pings interrupting deep focus.",
      icon: <BellRing className="h-5 w-5" />,
    },
    {
      id: "no_agenda_call",
      title: "Quick Calls / No Agenda",
      description: "Sudden requests for voice syncs with no notice.",
      icon: <PhoneCall className="h-5 w-5" />,
    },
  ];

  const handleToggle = (id: string) => {
    if (selectedTriggers.includes(id)) {
      onChange(selectedTriggers.filter((item) => item !== id));
    } else {
      onChange([...selectedTriggers, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">What drains your battery?</h2>
        <p className="text-xs text-white/50 leading-relaxed">
          Select all communication patterns or events that increase your stress. Our translation engine wraps, buffers, or intercepts these.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {options.map((opt) => (
          <OnboardingCard
            key={opt.id}
            icon={opt.icon}
            title={opt.title}
            description={opt.description}
            selected={selectedTriggers.includes(opt.id)}
            onClick={() => handleToggle(opt.id)}
            variant="multi"
          />
        ))}
      </div>
    </div>
  );
};
