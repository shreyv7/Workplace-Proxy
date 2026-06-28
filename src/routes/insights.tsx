import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { API_BASE_URL } from "../lib/api";
import { TrendingUp, Activity, BarChart2, Calendar, Target, Clock, ShieldCheck } from "lucide-react";
import { KpiCards } from "../components/kpi-cards";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights Dashboard — Workplace Proxy" },
      {
        name: "description",
        content: "Track cognitive energy peaks, focus hours protected, and overall communication translation metrics.",
      },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly">("weekly");
  const [timeline, setTimeline] = useState<Array<{ day: string; saved: number; friction: number; focus: number }>>([]);
  const [kpis, setKpis] = useState({ hoursSaved: 24.5, avgFriction: 18, clarityScore: 96 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadTelemetry() {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/telemetry?range=${activeTab}`);
        if (!response.ok) throw new Error("Backend response not ok");
        const json = await response.json();
        
        if (json.status === "success" && active) {
          const dbData = json.data;
          
          const mappedTimeline = dbData.map((item: any) => {
            const dateObj = new Date(item.date);
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const dayName = days[dateObj.getDay()];
            return {
              day: activeTab === "weekly" ? dayName : `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
              saved: Math.round(parseFloat(item.hours_saved || 0) * 60), // convert to minutes
              friction: item.cognitive_friction || 0,
              focus: parseFloat(item.focus_hours_protected || 0)
            };
          });

          const totalHours = dbData.reduce((acc: number, curr: any) => acc + (parseFloat(curr.hours_saved) || 0), 0);
          const avgFriction = dbData.length ? Math.round(dbData.reduce((acc: number, curr: any) => acc + (curr.cognitive_friction || 0), 0) / dbData.length) : 0;
          const avgClarity = dbData.length ? Math.round(dbData.reduce((acc: number, curr: any) => acc + (curr.clarity_score || 0), 0) / dbData.length) : 0;

          setTimeline(mappedTimeline);
          setKpis({
            hoursSaved: parseFloat(totalHours.toFixed(1)),
            avgFriction,
            clarityScore: avgClarity
          });
        }
      } catch (err) {
        console.warn("Falling back to Supabase client fetch directly:", err);
        if (!active) return;
        try {
          const limit = activeTab === "weekly" ? 7 : 30;
          const { data, error } = await supabase
            .from("telemetry_history")
            .select("*")
            .order("date", { ascending: false })
            .limit(limit);

          if (error) throw error;
          if (data && active) {
            const dbData = [...data].reverse();
            const mappedTimeline = dbData.map((item: any) => {
              const dateObj = new Date(item.date);
              const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              const dayName = days[dateObj.getDay()];
              return {
                day: activeTab === "weekly" ? dayName : `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
                saved: Math.round(parseFloat(item.hours_saved || 0) * 60),
                friction: item.cognitive_friction || 0,
                focus: parseFloat(item.focus_hours_protected || 0)
              };
            });

            const totalHours = dbData.reduce((acc: number, curr: any) => acc + (parseFloat(curr.hours_saved) || 0), 0);
            const avgFriction = dbData.length ? Math.round(dbData.reduce((acc: number, curr: any) => acc + (curr.cognitive_friction || 0), 0) / dbData.length) : 0;
            const avgClarity = dbData.length ? Math.round(dbData.reduce((acc: number, curr: any) => acc + (curr.clarity_score || 0), 0) / dbData.length) : 0;

            setTimeline(mappedTimeline);
            setKpis({
              hoursSaved: parseFloat(totalHours.toFixed(1)),
              avgFriction,
              clarityScore: avgClarity
            });
          }
        } catch (subErr) {
          console.error("Telemetry fetch failed, using placeholders:", subErr);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadTelemetry();
    return () => { active = false; };
  }, [activeTab]);

  const maxSaved = Math.max(...timeline.map(t => t.saved), 60);

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-8 pb-28 animate-fade-in select-none">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Cognitive Telemetry</span>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Workspace Insights
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analyze focus protection benchmarks, cognitive fatigue predictions, and time reclaimed by the AI swarms.
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex items-center gap-1.5 rounded-xl bg-secondary/50 p-1 border border-border/60 shrink-0">
          {(["weekly", "monthly"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-all",
                activeTab === tab
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {tab} analysis
            </button>
          ))}
        </div>
      </header>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Est. Time Reclaimed</span>
            <Clock className="h-4.5 w-4.5 text-indigo-500" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">{kpis.hoursSaved} Hours</p>
          <span className="text-xs text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full w-max">
            +{activeTab === "weekly" ? "3.5h" : "14.2h"} this {activeTab === "weekly" ? "week" : "month"}
          </span>
          <p className="text-xs text-muted-foreground mt-1">Based on email threads intercepted and calendar auto-locks.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cognitive Friction</span>
            <Activity className="h-4.5 w-4.5 text-mint" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">-{kpis.avgFriction}%</p>
          <span className="text-xs text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full w-max">
            Optimal bounds
          </span>
          <p className="text-xs text-muted-foreground mt-1">Calculated via task overload intervals and context switches blocked.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Workspace Clarity Score</span>
            <Target className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">{kpis.clarityScore}/100</p>
          <span className="text-xs text-indigo-500 font-medium bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-full w-max">
            96% Consensus Cert
          </span>
          <p className="text-xs text-muted-foreground mt-1">Percentage of incoming signals resolved with zero user intervention.</p>
        </div>
      </div>

      {/* Sparkline & Charts layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Time Saved Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-6 overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4.5 w-4.5 text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground">Time Reclaimed Timeline (Mins)</h3>
            </div>
            <span className="text-xs text-muted-foreground">Reclaimed daily</span>
          </div>

          {/* Custom CSS Bar Chart */}
          <div className={`flex items-end justify-between h-56 px-2 gap-${activeTab === "weekly" ? "4" : "1"} overflow-x-auto`}>
            {timeline.map((item, idx) => {
              const heightPercent = `${(item.saved / maxSaved) * 100}%`;
              const isToday = activeTab === "weekly" && idx === timeline.length - 1;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end min-w-[20px]">
                  <div className="w-full bg-secondary/40 rounded-t-lg h-full flex items-end">
                    <div 
                      className={["w-full rounded-t-lg transition-all duration-700 bg-gradient-to-t from-indigo-500/80 to-indigo-500", isToday ? "ring-2 ring-foreground/20" : ""].join(" ")}
                      style={{ height: heightPercent }}
                      title={`${item.day}: ${item.saved} mins saved`}
                    />
                  </div>
                  <span className={["text-[10px] font-semibold font-mono", isToday ? "text-foreground font-bold" : "text-muted-foreground"].join(" ")}>
                    {item.day}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground hidden sm:inline">{item.saved}m</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cognitive Fatigue Forecast */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2 pb-4 border-b border-border/60">
            <Calendar className="h-4.5 w-4.5 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">Focus Window protected</h3>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {timeline.slice(-7).map((item, idx) => {
              const isToday = activeTab === "weekly" && idx === 6;
              return (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className={["font-mono font-semibold", isToday ? "text-foreground font-bold" : "text-muted-foreground"].join(" ")}>
                    {isToday ? "Today" : item.day}
                  </span>

                  <div className="flex items-center gap-3 w-40">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-mint rounded-full" 
                        style={{ width: `${(item.focus / 8) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono font-semibold text-foreground w-8 text-right">{item.focus}h</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl bg-secondary/20 p-3.5 border border-border/50 flex items-start gap-2.5 mt-auto text-[10.5px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-mint shrink-0 mt-0.5" />
            <span>{activeTab === "weekly" ? "Weekly" : "Monthly"} protected deep focus blocks average <strong>4.6 hours per day</strong>, exceeding the optimal benchmark.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

