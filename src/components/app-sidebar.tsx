import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Inbox,
  SlidersHorizontal,
  Sparkles,
  Brain,
  Bot,
  Link2,
  Settings,
  TrendingUp,
  Sun,
  LogOut,
  ChevronRight,
  Cpu,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "../../personalisation/auth/useAuth";
import {
  checkHealth,
  getDebugMetrics,
  getRuntimeSnapshot,
  type DebugMetricsResponse,
  type DebugRuntimeResponse,
  type HealthResponse,
} from "../lib/api";

const navSections = [
  {
    id: "workspace",
    label: "End-User Workspace",
    hint: "Daily clarity, triage, and personal setup",
    items: [
      { to: "/dashboard", label: "Daily Clarity", icon: Sun },
      { to: "/inbox", label: "Communication Inbox", icon: Inbox },
    ],
  },
  {
    id: "internal",
    label: "Internal Tools",
    hint: "Swarm internals, memory, and platform controls",
    items: [
      { to: "/preferences", label: "Preferences", icon: SlidersHorizontal },
      { to: "/insights", label: "Insights Dashboard", icon: TrendingUp },
      { to: "/integrations", label: "Integrations", icon: Link2 },
      { to: "/memory", label: "Cognitive Memory", icon: Brain },
      { to: "/agents", label: "Agent Swarm", icon: Bot },
      { to: "/settings", label: "Platform Settings", icon: Settings },
    ],
  },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [runtime, setRuntime] = useState<DebugRuntimeResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [metrics, setMetrics] = useState<DebugMetricsResponse | null>(null);
  const [internalExpanded, setInternalExpanded] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return localStorage.getItem("show_internal_tools") === "true";
  });
  const internalRoutes =
    navSections.find((section) => section.id === "internal")?.items.map((item) => item.to) ?? [];
  const isOnInternalRoute = internalRoutes.includes(pathname as (typeof internalRoutes)[number]);

  useEffect(() => {
    let disposed = false;

    const loadSidebarStatus = async () => {
      const [runtimeResult, healthResult, metricsResult] = await Promise.allSettled([
        getRuntimeSnapshot(),
        checkHealth(),
        getDebugMetrics(),
      ]);

      if (disposed) {
        return;
      }

      if (runtimeResult.status === "fulfilled") {
        setRuntime(runtimeResult.value);
      }
      if (healthResult.status === "fulfilled") {
        setHealth(healthResult.value);
      }
      if (metricsResult.status === "fulfilled") {
        setMetrics(metricsResult.value);
      }
    };

    void loadSidebarStatus();
    const interval = window.setInterval(() => {
      void loadSidebarStatus();
    }, 30000);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isOnInternalRoute && !internalExpanded) {
      setInternalExpanded(true);
    }
  }, [internalExpanded, isOnInternalRoute]);

  const handleSignOut = async () => {
    if (user?.id) {
      const isMock = user.id.startsWith("mock-");
      if (isMock) {
        localStorage.removeItem(`profile_${user.id}`);
      }
    }

    // Clear auth state and cookies
    await logout();

    // Redirect to landing page
    navigate({ to: "/" });
  };

  const toggleInternalTools = () => {
    setInternalExpanded((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("show_internal_tools", String(next));
      }
      return next;
    });
  };

  const healthyDependencyCount = Object.values(health?.dependencies ?? {}).filter((value) =>
    ["ok", "configured", "available"].includes(value),
  ).length;
  const dependencyCount = Object.keys(health?.dependencies ?? {}).length;
  const swarmStatusLabel =
    health?.status === "ok"
      ? "Swarm Core Online"
      : health?.status === "degraded"
        ? "Swarm Degraded"
        : "Swarm Status Pending";
  const swarmStatusAccent =
    health?.status === "ok"
      ? "bg-mint"
      : health?.status === "degraded"
        ? "bg-amber-500"
        : "bg-muted-foreground";

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint-soft/10 text-mint border border-mint/20 shadow-sm transition-all duration-300 hover:scale-105">
          <Sparkles className="h-4 w-4 text-mint" strokeWidth={1.5} />
        </div>
        <div className="leading-tight">
          <div className="text-xs font-semibold tracking-tight text-sidebar-foreground">
            Workplace Proxy
          </div>
          <div className="text-[10px] text-sidebar-foreground/50 font-mono tracking-wider uppercase">
            Cognitive OS
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex flex-1 flex-col gap-1 px-3 overflow-y-auto scrollbar-calm">
        {navSections.map((section) => (
          <div key={section.id} className="space-y-1">
            {section.id === "internal" ? (
              <button
                type="button"
                onClick={toggleInternalTools}
                className="flex w-full items-center justify-between rounded-lg px-2.5 pt-1 pb-0.5 text-left transition-colors hover:bg-sidebar-accent/20"
              >
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-sidebar-foreground/45">
                    {section.label}
                  </div>
                  <div className="mt-0.5 text-[10px] text-sidebar-foreground/35">
                    {internalExpanded ? section.hint : "Collapsed"}
                  </div>
                </div>
                <ChevronRight
                  className={[
                    "h-3.5 w-3.5 text-sidebar-foreground/45 transition-transform",
                    internalExpanded ? "rotate-90" : "",
                  ].join(" ")}
                />
              </button>
            ) : (
              <div className="px-2.5 pt-1 pb-0.5">
                <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-sidebar-foreground/45">
                  {section.label}
                </div>
                <div className="mt-0.5 text-[10px] text-sidebar-foreground/35">{section.hint}</div>
              </div>
            )}

            {(section.id !== "internal" || internalExpanded) &&
              section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={[
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-200",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground",
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-105",
                        active ? "text-mint" : "opacity-80",
                      ].join(" ")}
                      strokeWidth={1.75}
                    />
                    <span className="font-normal tracking-wide">{item.label}</span>
                    {active && (
                      <span className="ml-auto h-1 w-1 rounded-full bg-mint shadow-[0_0_8px_var(--mint)] animate-pulse-soft" />
                    )}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>

      {/* User info */}
      {user && (
        <div className="px-3 pb-0.5">
          <div className="flex items-center gap-2 rounded-lg border border-sidebar-border/60 px-2 py-1.5 bg-sidebar-accent/10">
            {(user.user_metadata?.avatar_url as string | undefined) ? (
              <img
                src={user.user_metadata.avatar_url as string}
                alt=""
                referrerPolicy="no-referrer"
                className="h-6 w-6 rounded-full object-cover shrink-0 ring-1 ring-sidebar-border"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-mint-soft flex items-center justify-center shrink-0 ring-1 ring-sidebar-border">
                <span className="text-[9px] font-bold text-mint">
                  {(
                    (user.user_metadata?.full_name as string | undefined) ??
                    (user.email as string | undefined) ??
                    "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">
                {(user.user_metadata?.full_name as string | undefined) ??
                  (user.email as string | undefined)?.split("@")[0] ??
                  "User"}
              </p>
              <p className="text-[9px] text-muted-foreground truncate">
                {user.email as string | undefined}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Theme toggle & Sign out */}
      <div className="px-3 pb-1 flex flex-col gap-1">
        <ThemeToggle />
        <button
          onClick={handleSignOut}
          className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 cursor-pointer"
        >
          <LogOut
            className="h-3.5 w-3.5 opacity-85 group-hover:opacity-100 transition-opacity"
            strokeWidth={1.75}
          />
          <span className="font-normal tracking-wide text-xs">Sign Out</span>
        </button>
      </div>

      {/* Bottom Status Card */}
      <div className="mx-3 my-2 rounded-xl border border-sidebar-border/40 bg-sidebar-accent/20 p-3 shadow-xs backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-sidebar-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span
                className={[
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-65",
                  swarmStatusAccent,
                ].join(" ")}
              />
              <span
                className={[
                  "relative inline-flex h-1.5 w-1.5 rounded-full shadow-[0_0_4px_var(--mint)]",
                  swarmStatusAccent,
                ].join(" ")}
              />
            </span>
            <span>{swarmStatusLabel}</span>
          </div>
          <span className="text-[9px] font-mono text-sidebar-foreground/50">
            {health?.version ?? "v?.?.?"}
          </span>
        </div>

        <div className="mt-2 space-y-1.5 border-t border-sidebar-border/30 pt-2">
          <div className="flex justify-between text-[10px] text-sidebar-foreground/60">
            <span>Runtime Mode</span>
            <span className="font-medium text-sidebar-foreground">
              {runtime?.backend_mode ?? "Pending"}
            </span>
          </div>
          <div className="flex justify-between text-[10px] text-sidebar-foreground/60">
            <span>Aggregated Latency</span>
            <span className="font-medium text-sidebar-foreground">
              {metrics ? `${metrics.average_latency_ms}ms` : "Pending"}
            </span>
          </div>
          <div className="flex justify-between text-[10px] text-sidebar-foreground/60">
            <span>Healthy Services</span>
            <span className="font-medium text-mint font-semibold">
              {dependencyCount ? `${healthyDependencyCount}/${dependencyCount}` : "Pending"}
            </span>
          </div>
          <div className="flex justify-between text-[10px] text-sidebar-foreground/60">
            <span>Processed Requests</span>
            <span className="font-medium text-lavender font-semibold">
              {metrics?.messages_processed ?? 0}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
