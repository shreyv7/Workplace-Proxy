import { useEffect, useState } from "react";
import { Link2, ShieldAlert, Cpu } from "lucide-react";
import { API_BASE_URL } from "../lib/api";
import { SLACK_MCP_URL, GMAIL_MCP_URL, CALENDAR_MCP_URL } from "../lib/integrations";

interface SourceHealthCardsProps {
  pendingCount: number;
}

export function SourceHealthCards({ pendingCount }: SourceHealthCardsProps) {
  const [slackStatus, setSlackStatus] = useState<"online" | "offline">("offline");
  const [emailStatus, setEmailStatus] = useState<"online" | "offline">("offline");
  const [calendarStatus, setCalendarStatus] = useState<"online" | "offline">("offline");
  const [swarmStatus, setSwarmStatus] = useState<"online" | "offline">("offline");

  const checkHealth = async () => {
    // 1. Slack Health Check
    try {
      const res = await fetch(`${SLACK_MCP_URL}/health`, {
        signal: AbortSignal.timeout(1500),
      });
      setSlackStatus(res.ok ? "online" : "offline");
    } catch {
      setSlackStatus("offline");
    }

    // 2. Email Health Check
    try {
      const res = await fetch(`${GMAIL_MCP_URL}/health`, {
        signal: AbortSignal.timeout(1500),
      });
      setEmailStatus(res.ok ? "online" : "offline");
    } catch {
      setEmailStatus("offline");
    }

    // 3. Calendar Health Check
    try {
      const res = await fetch(`${CALENDAR_MCP_URL}/health`, {
        signal: AbortSignal.timeout(1500),
      });
      setCalendarStatus(res.ok ? "online" : "offline");
    } catch {
      setCalendarStatus("offline");
    }

    // 4. Swarm Health Check
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/health`, {
        signal: AbortSignal.timeout(1500),
      });
      setSwarmStatus(res.ok ? "online" : "offline");
    } catch {
      setSwarmStatus("offline");
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getOnlineSourcesText = () => {
    const list = [];
    if (slackStatus === "online") list.push("Slack");
    if (emailStatus === "online") list.push("Email");
    if (calendarStatus === "online") list.push("Calendar");

    if (list.length === 0) return "All channels offline";
    if (list.length === 3) return "Slack, Email, Calendar online";
    return `${list.join(" and ")} online`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 select-none">
      {/* Card 1: Triage Queue */}
      <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-gradient-to-b from-card to-card/50 p-5 shadow-xs flex flex-col justify-between min-h-[110px] hover:shadow-md transition-all duration-300">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Triage Queue
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
          </div>
          <p className="text-2xl font-extrabold tracking-tight text-foreground">
            {pendingCount} Pending
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono mt-2">
          Awaiting calendar block confirmation
        </p>
      </div>

      {/* Card 2: Channels Sync state */}
      <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-gradient-to-b from-card to-card/50 p-5 shadow-xs flex flex-col justify-between min-h-[110px] hover:shadow-md transition-all duration-300">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Channels Sync State
            </span>
            <Link2 className="h-3.5 w-3.5 text-mint" />
          </div>
          <p
            className={[
              "text-2xl font-extrabold tracking-tight",
              slackStatus === "online" || emailStatus === "online" || calendarStatus === "online"
                ? "text-mint"
                : "text-rose-500",
            ].join(" ")}
          >
            {slackStatus === "online" || emailStatus === "online" || calendarStatus === "online"
              ? "Active Connection"
              : "Offline"}
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono mt-2">{getOnlineSourcesText()}</p>
      </div>

      {/* Card 3: Swarm status */}
      <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-gradient-to-b from-card to-card/50 p-5 shadow-xs flex flex-col justify-between min-h-[110px] hover:shadow-md transition-all duration-300">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              AI Swarm Engine
            </span>
            {swarmStatus === "online" ? (
              <Cpu className="h-3.5 w-3.5 text-indigo-500" />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
            )}
          </div>
          <p
            className={[
              "text-2xl font-extrabold tracking-tight",
              swarmStatus === "online" ? "text-indigo-500" : "text-rose-500",
            ].join(" ")}
          >
            {swarmStatus === "online" ? "Active" : "Swarm Offline"}
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono mt-2">
          {swarmStatus === "online"
            ? "Swarm resolving threshold at 90% cert"
            : "Swarm offline, using simulation fallbacks"}
        </p>
      </div>
    </div>
  );
}
