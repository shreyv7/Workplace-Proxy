import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ClarityInbox } from "../components/clarity-inbox";
import { CalendarTimeline } from "../components/calendar-timeline";
import { TraceLog } from "../components/trace-log";
import { KpiCards } from "../components/kpi-cards";
import { CognitiveLoadWidget } from "../components/cognitive-load-widget";
import { ProcessingPipeline } from "../components/processing-pipeline";
import { TranslatedTaskCard } from "../components/translated-task-card";
import { AgentDebateModal } from "../components/agent-debate-modal";
import {
  initialMessages,
  initialCalendar,
  type ClarityMessage,
  type CalendarBlock,
} from "../lib/mock-data";

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
  const [messages, setMessages] = useState<ClarityMessage[]>(initialMessages);
  const [selectedMessageId, setSelectedMessageId] = useState<string>(
    initialMessages[0]?.message_id || ""
  );
  const [selectedDebateId, setSelectedDebateId] = useState<string | null>(null);

  const [calendar, setCalendar] = useState<CalendarBlock[]>(() => {
    // Seed task blocks from messages
    const tasks: CalendarBlock[] = initialMessages.map((m) => ({
      id: `task_${m.message_id}`,
      start: m.suggested_start_time,
      end: m.suggested_end_time,
      title: m.translated_bullet_points.action,
      type: "task",
      source_message_id: m.message_id,
      acknowledged: m.acknowledged,
      agent_generated: true,
      confidence: 94,
      reason: m.reasoning,
    }));
    return [...initialCalendar, ...tasks];
  });

  const selectedMessage = useMemo(() => {
    return messages.find((m) => m.message_id === selectedMessageId);
  }, [messages, selectedMessageId]);

  // Handle acknowledging from task card or calendar
  const handleAcknowledge = (messageId: string) => {
    // Mark message as acknowledged
    setMessages((prev) =>
      prev.map((m) => (m.message_id === messageId ? { ...m, acknowledged: true } : m))
    );
    // Mark corresponding calendar block as acknowledged
    setCalendar((prev) =>
      prev.map((b) =>
        b.source_message_id === messageId || b.id === `task_${messageId}`
          ? { ...b, acknowledged: true }
          : b
      )
    );
  };

  const handleCalendarAck = (blockId: string) => {
    setCalendar((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, acknowledged: true } : b))
    );
    // Find if it was generated from a message and acknowledge that too
    const block = calendar.find((b) => b.id === blockId);
    if (block?.source_message_id) {
      setMessages((prev) =>
        prev.map((m) =>
          m.message_id === block.source_message_id ? { ...m, acknowledged: true } : m
        )
      );
    }
  };

  return (
    <>
      <div className="mx-auto max-w-[1600px] px-6 pt-8 pb-28 animate-fade-in">
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

          {/* COLUMN 3: Allocation & Load Forecast (4/12 cols) */}
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
