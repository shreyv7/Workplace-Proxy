import React from "react";
import { Check } from "lucide-react";

interface OnboardingCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  variant?: "single" | "multi";
}

export const OnboardingCard: React.FC<OnboardingCardProps> = ({
  icon,
  title,
  description,
  selected,
  onClick,
  variant = "single",
}) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`group relative flex items-center gap-3.5 text-left w-full p-3.5 rounded-xl border transition-all duration-300 backdrop-blur-md cursor-pointer ${
        selected
          ? "bg-cyan-950/10 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.12)]"
          : "bg-white/[0.03] border-white/10 hover:bg-white/[0.05] hover:border-white/20 hover:scale-[1.005]"
      }`}
    >
      {/* Icon wrapper */}
      <div
        className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-300 ${
          selected ? "bg-cyan-500/10 text-cyan-400" : "bg-white/5 text-white/70 group-hover:text-white"
        }`}
      >
        {icon}
      </div>

      {/* Text area */}
      <div className="flex-1 min-w-0 pr-2">
        <h4
          className={`text-xs font-semibold tracking-tight transition-colors duration-200 truncate ${
            selected ? "text-cyan-400" : "text-white"
          }`}
        >
          {title}
        </h4>
        <p className="mt-0.5 text-[11px] text-white/45 leading-normal font-sans group-hover:text-white/55 transition-colors duration-200 line-clamp-1">
          {description}
        </p>
      </div>

      {/* Selection Indicator */}
      <div
        className={`flex-shrink-0 flex h-4.5 w-4.5 items-center justify-center border transition-all duration-200 ${
          variant === "single" ? "rounded-full" : "rounded"
        } ${
          selected
            ? "border-cyan-500 bg-cyan-500 text-black"
            : "border-white/20 bg-transparent"
        }`}
      >
        {selected && (
          variant === "single" ? (
            <div className="h-1.5 w-1.5 rounded-full bg-black" />
          ) : (
            <Check className="h-3 w-3 stroke-[3]" />
          )
        )}
      </div>

      {/* Subtle bottom gradient glow on hover */}
      <div
        className={`absolute inset-0 -z-10 rounded-xl bg-gradient-to-tr from-cyan-500/3 via-transparent to-transparent transition-opacity duration-300 ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      />
    </button>
  );
};

