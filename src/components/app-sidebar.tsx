import { Link, useRouterState } from "@tanstack/react-router";
import { Sun, Inbox, SlidersHorizontal, Sparkles } from "lucide-react";

const nav = [
  { to: "/", label: "Daily Clarity", icon: Sun },
  { to: "/inbox", label: "Communication Inbox", icon: Inbox },
  { to: "/preferences", label: "Preferences & Calibration", icon: SlidersHorizontal },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex items-center gap-2 px-5 pt-6 pb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-soft text-foreground">
          <Sparkles className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-medium text-sidebar-foreground">Project Clarity</div>
          <div className="text-xs text-muted-foreground">Cognitive Workspace</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 opacity-80" strokeWidth={1.75} />
              <span className="font-normal">{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-mint" />}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl border border-sidebar-border bg-card/60 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
          </span>
          Agent swarm online
        </div>
        <div className="mt-2 text-xs text-muted-foreground">4 agents · low load</div>
      </div>
    </aside>
  );
}
