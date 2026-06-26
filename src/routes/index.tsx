import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ClarityInbox } from "../components/clarity-inbox";
import { CalendarTimeline } from "../components/calendar-timeline";
import { TraceLog } from "../components/trace-log";
import { KpiCards } from "../components/kpi-cards";
import { CognitiveLoadWidget } from "../components/cognitive-load-widget";
import { ProcessingPipeline } from "../components/processing-pipeline";
import { TranslatedTaskCard } from "../components/translated-task-card";
import { AgentDebateModal } from "../components/agent-debate-modal";
import { supabase } from "../lib/supabase";
import { sendRawMessageToSwarm } from "../lib/api-bridge";
import {
  initialMessages,
  initialCalendar,
  type ClarityMessage,
  type CalendarBlock,
} from "../lib/mock-data";
import { MessageSquare, Mail, Layers, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daily Clarity — Project Clarity" },
      {
        name: "description",
        content:
          "Today's translated workspace signals and a cognitive-load calendar of your scheduled focus and tasks.",
      },
    ],
  }),
  component: DailyClarity,
});

function DailyClarity() {
  const [messages, setMessages] = useState<ClarityMessage[]>([]);
  const [calendar, setCalendar] = useState<CalendarBlock[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string>("");
  const [selectedDebateId, setSelectedDebateId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // 1. Fetch & Seed Data from Supabase
  const fetchData = async () => {
    try {
      // Fetch messages
      let { data: dbMessages } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      // Fetch calendar blocks
      let { data: dbCalendar } = await supabase
        .from("calendar_blocks")
        .select("*")
        .order("created_at", { ascending: true });

      // Auto-seed if Supabase database is completely empty
      if ((!dbMessages || dbMessages.length === 0) && !isSeeding) {
        setIsSeeding(true);
        // Insert seed messages
        const formattedSeedMsgs = initialMessages.map(m => ({
          message_id: m.message_id,
          sender_name: m.sender_name,
          sender_role: m.sender_role,
          timestamp: m.timestamp,
          original_text: m.original_text,
          source: m.source,
          importance: m.importance,
          ambiguity: m.ambiguity,
          agent_assigned: m.agent_assigned,
          translation_status: m.translation_status,
          action: m.translated_bullet_points.action,
          complexity: m.translated_bullet_points.complexity,
          expected_duration: m.translated_bullet_points.expected_duration,
          steps: m.translated_bullet_points.steps,
          suggested_start_time: m.suggested_start_time,
          suggested_end_time: m.suggested_end_time,
          fidelity_rating: m.fidelity_rating,
          acknowledged: m.acknowledged,
          reasoning: m.reasoning,
          debate_id: m.debate_id
        }));

        await supabase.from("messages").insert(formattedSeedMsgs);

        // Insert seed calendar blocks
        const formattedSeedCal = initialCalendar.map(c => ({
          id: c.id,
          start: c.start,
          "end": c.end,
          title: c.title,
          type: c.type,
          source_message_id: c.source_message_id || null,
          acknowledged: c.acknowledged || false,
          agent_generated: c.agent_generated || false,
          confidence: c.confidence || null,
          reason: c.reason || null
        }));

        const messageTasks = initialMessages.map(m => ({
          id: `task_${m.message_id}`,
          start: m.suggested_start_time,
          "end": m.suggested_end_time,
          title: m.translated_bullet_points.action,
          type: "task",
          source_message_id: m.message_id,
          acknowledged: m.acknowledged,
          agent_generated: true,
          confidence: 94,
          reason: m.reasoning
        }));

        await supabase.from("calendar_blocks").insert([...formattedSeedCal, ...messageTasks]);

        // Refetch after inserting
        const { data: newMsgs } = await supabase.from("messages").select("*").order("created_at", { ascending: true });
        const { data: newCal } = await supabase.from("calendar_blocks").select("*").order("created_at", { ascending: true });
        
        if (newMsgs) dbMessages = newMsgs;
        if (newCal) dbCalendar = newCal;
        setIsSeeding(false);
      }

      if (dbMessages) {
        // Map database schema back to React Component schema
        const mappedMsgs: ClarityMessage[] = dbMessages.map((m: any) => ({
          message_id: m.message_id,
          sender_name: m.sender_name,
          sender_role: m.sender_role,
          timestamp: m.timestamp,
          original_text: m.original_text,
          source: m.source,
          importance: m.importance,
          ambiguity: m.ambiguity,
          agent_assigned: m.agent_assigned,
          translation_status: m.translation_status,
          translated_bullet_points: {
            action: m.action,
            complexity: m.complexity,
            expected_duration: m.expected_duration,
            steps: m.steps || [],
          },
          suggested_start_time: m.suggested_start_time,
          suggested_end_time: m.suggested_end_time,
          fidelity_rating: m.fidelity_rating,
          acknowledged: m.acknowledged,
          reasoning: m.reasoning,
          debate_id: m.debate_id
        }));

        setMessages(mappedMsgs);
        if (mappedMsgs.length > 0 && !selectedMessageId) {
          setSelectedMessageId(mappedMsgs[mappedMsgs.length - 1].message_id);
        }
      }

      if (dbCalendar) {
        setCalendar(dbCalendar.map((c: any) => ({
          id: c.id,
          start: c.start,
          end: c.end,
          title: c.title,
          type: c.type,
          source_message_id: c.source_message_id,
          acknowledged: c.acknowledged,
          agent_generated: c.agent_generated,
          confidence: c.confidence,
          reason: c.reason
        })));
      }
    } catch (e) {
      console.error("Database connection issue: ", e);
    }
  };

  // 2. Setup Realtime Sync Subscriptions
  useEffect(() => {
    fetchData();

    const messagesChannel = supabase
      .channel("messages_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        fetchData();
      })
      .subscribe();

    const calendarChannel = supabase
      .channel("calendar_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "calendar_blocks" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(calendarChannel);
    };
  }, [selectedMessageId]);

  const selectedMessage = useMemo(() => {
    return messages.find((m) => m.message_id === selectedMessageId);
  }, [messages, selectedMessageId]);

  // 3. Database operations
  const handleAcknowledge = async (messageId: string) => {
    // 1. Update Supabase messages table
    await supabase
      .from("messages")
      .update({ acknowledged: true })
      .eq("message_id", messageId);

    // 2. Update Supabase calendar table
    await supabase
      .from("calendar_blocks")
      .update({ acknowledged: true })
      .eq("source_message_id", messageId);
  };

  const handleCalendarAck = async (blockId: string) => {
    await supabase
      .from("calendar_blocks")
      .update({ acknowledged: true })
      .eq("id", blockId);

    // Check if block was created from a signal, and update that signal too
    const block = calendar.find((b) => b.id === blockId);
    if (block?.source_message_id) {
      await supabase
        .from("messages")
        .update({ acknowledged: true })
        .eq("message_id", block.source_message_id);
    }
  };

  // 4. Mock Inbound Trigger Simulations
  const triggerInboundSimulation = async (type: "slack" | "email" | "jira") => {
    if (type === "slack") {
      await sendRawMessageToSwarm({
        source: "slack",
        sender_name: "Boss Tom",
        sender_role: "Engineering Director",
        content: "Hey, can you double check the staging configurations whenever you have a minute? Also check the deployment checklist.",
      });
    } else if (type === "email") {
      await sendRawMessageToSwarm({
        source: "email",
        sender_name: "External Client",
        sender_role: "Account Lead",
        content: "Hi, following up on our roadmap alignment call. Are you available sometime tomorrow around 3 PM?",
      });
    } else {
      await sendRawMessageToSwarm({
        source: "jira",
        sender_name: "Sprint Triage",
        sender_role: "Product Manager",
        content: "Critical: Revisit the onboarding flow feedback from QA. Need to lower gradient saturation before staging push.",
      });
    }
  };

  return (
    <>
      <div className="mx-auto max-w-[1600px] px-6 pt-8 pb-28 animate-fade-in select-none">
        {/* Welcome Section */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              Workspace Overview
            </div>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Good morning, User
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your agent swarms are active. They triaged {messages.length} inbound signals and protected your deep focus windows today.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground shadow-2xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
            </span>
            <span>Swarm Load Optimal · June 25, 2026</span>
          </div>
        </header>

        {/* Top telemetry level KPI Cards */}
        <div className="mb-8">
          <KpiCards />
        </div>

        {/* 3-Column command layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUMN 1: Original Inbound Signals (3/12 cols) */}
          <section className="lg:col-span-4 xl:col-span-3 space-y-4" aria-label="Original Signals">
            <div className="flex items-center justify-between pb-1">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">Inputs</span>
                <h2 className="text-sm font-bold text-foreground">Inbound Stream</h2>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{messages.length} signals</span>
            </div>

            {/* Inbound Simulator triggers */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-secondary/50 rounded-xl border border-border/50">
              <button 
                onClick={() => triggerInboundSimulation("slack")}
                className="py-2 text-[10px] font-bold rounded-lg transition-all text-center bg-card text-foreground shadow-2xs flex items-center justify-center gap-1 hover:bg-card/80"
              >
                <MessageSquare className="h-3 w-3 text-emerald-500" /> +Slack
              </button>
              <button 
                onClick={() => triggerInboundSimulation("email")}
                className="py-2 text-[10px] font-bold rounded-lg transition-all text-center bg-card text-foreground shadow-2xs flex items-center justify-center gap-1 hover:bg-card/80"
              >
                <Mail className="h-3 w-3 text-indigo-500" /> +Email
              </button>
              <button 
                onClick={() => triggerInboundSimulation("jira")}
                className="py-2 text-[10px] font-bold rounded-lg transition-all text-center bg-card text-foreground shadow-2xs flex items-center justify-center gap-1 hover:bg-card/80"
              >
                <Layers className="h-3 w-3 text-blue-500" /> +Jira
              </button>
            </div>

            <ClarityInbox
              messages={messages}
              selectedMessageId={selectedMessageId}
              onSelectMessage={setSelectedMessageId}
            />
          </section>

          {/* COLUMN 2: Cognitive Synthesizer (5/12 cols) */}
          <section className="lg:col-span-5 xl:col-span-5 space-y-6" aria-label="Synthesis Engine">
            <div className="flex items-center justify-between pb-1">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">Synthesis</span>
                <h2 className="text-sm font-bold text-foreground">Cognitive OS Compiler</h2>
              </div>
              <span className="text-xs text-muted-foreground font-mono">Consensus resolved</span>
            </div>

            {selectedMessage ? (
              <div className="space-y-6">
                <TranslatedTaskCard
                  message={selectedMessage}
                  onAcknowledge={handleAcknowledge}
                  onOpenDebate={setSelectedDebateId}
                />
                <ProcessingPipeline />
              </div>
            ) : (
              <div className="rounded-2xl border border-border border-dashed bg-card/40 p-8 text-center text-muted-foreground">
                Select an inbound signal to view cognitive compilation stages.
              </div>
            )}
          </section>

          {/* COLUMN 3: Time Allocation & Load Forecast (4/12 cols) */}
          <section className="lg:col-span-3 xl:col-span-4 space-y-6" aria-label="Time Allocation">
            <div className="flex items-center justify-between pb-1">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">Timeline</span>
                <h2 className="text-sm font-bold text-foreground">Time Protection</h2>
              </div>
              <span className="text-xs text-muted-foreground font-mono">09:00 – 18:00</span>
            </div>

            <CognitiveLoadWidget />

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <CalendarTimeline blocks={calendar} onAcknowledge={handleCalendarAck} />
              
              <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-medium text-muted-foreground justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-2 py-0.5 border border-border">
                  <span className="h-2 w-2 rounded-sm bg-deep-focus" /> Deep Work
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-2 py-0.5 border border-border">
                  <span className="h-2 w-2 rounded-sm bg-amber-soft" /> Draft Task
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-2 py-0.5 border border-border">
                  <span className="h-2 w-2 rounded-sm bg-mint" /> Scheduled
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-2 py-0.5 border border-border">
                  <span className="h-2 w-2 rounded-sm bg-lavender" /> Sync
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <TraceLog />

      {selectedDebateId && (
        <AgentDebateModal
          debateId={selectedDebateId}
          onClose={() => setSelectedDebateId(null)}
        />
      )}
    </>
  );
}
