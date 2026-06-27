import { kpiStats } from "../lib/mock-data";
import { Zap, MessageSquare, Timer, ShieldAlert, Sparkles, TrendingDown } from "lucide-react";

interface KpiCardsProps {
  metrics?: {
    clarity_score: number;
    hours_saved: number;
    messages_simplified: number;
    context_switches_prevented: number;
  };
}

export function KpiCards({ metrics }: KpiCardsProps) {
  const activeMetrics = metrics || kpiStats;
  const stats = [
    {
      title: "Clarity Score",
      value: `${activeMetrics.clarity_score}%`,
      subtext: "Cognitive overhead optimized",
      icon: Sparkles,
      color: "text-mint bg-mint-soft/40",
      accent: "bg-mint",
      sparkline: [40, 55, 68, 72, 85, activeMetrics.clarity_score]
    },
    {
      title: "Time Protected",
      value: `${activeMetrics.hours_saved}h`,
      subtext: "Saved by automated briefings",
      icon: Timer,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20",
      accent: "bg-indigo-500",
      sparkline: [12, 14.5, 18, 20.2, 22.5, activeMetrics.hours_saved]
    },
    {
      title: "Signals Synthesized",
      value: activeMetrics.messages_simplified,
      subtext: "Cluttered posts streamlined",
      icon: MessageSquare,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
      accent: "bg-blue-500",
      sparkline: [60, 85, 102, 115, 130, activeMetrics.messages_simplified]
    },
    {
      title: "Context Switches Blocked",
      value: activeMetrics.context_switches_prevented,
      subtext: "Defensive schedule saves",
      icon: ShieldAlert,
      color: "text-amber-500 bg-amber-soft/40",
      accent: "bg-amber-soft",
      sparkline: [10, 18, 24, 28, 33, activeMetrics.context_switches_prevented]
    }
  ];


  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div 
            key={stat.title} 
            className="group relative rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-scale-in"
            style={{ animationDelay: `${idx * 75}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{stat.title}</span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${stat.color} transition-transform duration-300 group-hover:scale-105`}>
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-foreground">{stat.value}</span>
              <span className="text-[10px] font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-full font-mono">
                +12%
              </span>
            </div>

            <p className="text-xs text-muted-foreground mt-1 truncate">{stat.subtext}</p>

            {/* Sparkline Visualisation */}
            <div className="mt-4 flex items-end justify-between h-5 gap-0.5 opacity-60 group-hover:opacity-90 transition-opacity">
              {stat.sparkline.map((val, i) => {
                const max = Math.max(...stat.sparkline);
                const heightPercent = `${(val / max) * 100}%`;
                const isLast = i === stat.sparkline.length - 1;
                return (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-sm ${isLast ? stat.accent : "bg-muted-foreground/20"}`}
                    style={{ height: heightPercent }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
