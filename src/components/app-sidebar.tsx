import { Link, useRouterState } from "@tanstack/react-router";
import { Inbox, SlidersHorizontal, Sparkles, Brain, Bot, Link2, Settings, TrendingUp, Sun } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const nav = [
  { to: "/dashboard", label: "Daily Clarity", icon: Sun },
  { to: "/inbox", label: "Communication Inbox", icon: Inbox },
  { to: "/memory", label: "Cognitive Memory", icon: Brain },
  { to: "/agents", label: "Agent Swarm", icon: Bot },
  { to: "/integrations", label: "Integrations", icon: Link2 },
  { to: "/preferences", label: "Preferences", icon: SlidersHorizontal },
  { to: "/settings", label: "Platform Settings", icon: Settings },
  { to: "/insights", label: "Insights Dashboard", icon: TrendingUp },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-6 pt-7 pb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mint-soft text-foreground shadow-sm transition-all duration-300 hover:scale-105">
          <Sparkles className="h-5 w-5 text-mint" strokeWidth={1.5} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight text-sidebar-foreground">Workplace Proxy</div>
          <div className="text-[11px] text-muted-foreground font-mono tracking-wider uppercase">Cognitive OS</div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex flex-1 flex-col gap-1.5 px-4 overflow-y-auto scrollbar-calm">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground",
              ].join(" ")}
            >
              <Icon className={["h-4 w-4 transition-transform duration-200 group-hover:scale-105", active ? "text-mint" : "opacity-80"].join(" ")} strokeWidth={1.75} />
              <span className="font-normal tracking-wide">{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_8px_var(--mint)] animate-pulse-soft" />}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className="px-4 pb-2">
        <ThemeToggle />
      </div>

      {/* Bottom Status Card */}
      <div className="m-4 rounded-2xl border border-sidebar-border bg-card/40 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-65" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint shadow-[0_0_4px_var(--mint)]" />
            </span>
            <span>Swarm Core Online</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">v1.2.4</span>
        </div>

        <div className="mt-3.5 space-y-2 border-t border-sidebar-border/60 pt-3">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Active Swarm</span>
            <span className="font-medium text-foreground">4 Agent Swarms</span>
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Aggregated Latency</span>
            <span className="font-medium text-foreground">58ms</span>
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Cognitive Load</span>
            <span className="font-medium text-mint font-semibold">42% (Optimal)</span>
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Consensus Confidence</span>
            <span className="font-medium text-lavender font-semibold">94%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
