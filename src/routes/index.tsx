import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ClarityInbox } from "@/components/clarity-inbox";
import { CalendarTimeline } from "@/components/calendar-timeline";
import { TraceLog } from "@/components/trace-log";
import {
  initialMessages,
  initialCalendar,
  type ClarityMessage,
  type CalendarBlock,
} from "@/lib/mock-data";

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
  const [calendar, setCalendar] = useState<CalendarBlock[]>(() => {
    // Seed task blocks from messages
    const tasks: CalendarBlock[] = initialMessages.map((m) => ({
      id: `task_${m.message_id}`,
      start: m.suggested_start_time,
      end: m.suggested_end_time,
      title: m.translated_bullet_points.action,
      type: "task",
      source_message_id: m.message_id,
      acknowledged: false,
    }));
    return [...initialCalendar, ...tasks];
  });

  const stats = useMemo(() => {
    const acked = calendar.filter((b) => b.type === "task" && b.acknowledged).length;
    const tasks = calendar.filter((b) => b.type === "task").length;
    return { acked, tasks, msgs: messages.length };
  }, [calendar, messages]);

  const handleRating = (id: string, value: number) =>
    setMessages((prev) =>
      prev.map((m) => (m.message_id === id ? { ...m, fidelity_rating: value } : m)),
    );

  const handleAck = (id: string) =>
    setCalendar((prev) =>
      prev.map((b) => (b.id === id ? { ...b, acknowledged: true } : b)),
    );

  return (
    <>
      <div className="mx-auto max-w-[1500px] px-6 pt-8 pb-24">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Daily Clarity
            </div>
            <h1 className="mt-1 text-2xl font-medium text-foreground sm:text-3xl">
              A calm read of your day
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Your agent swarm has triaged {stats.msgs} inbound signals and proposed
              {" "}
              {stats.tasks} time blocks. {stats.acked} are locked in.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            Low cognitive load · Thursday, Jun 25
          </div>
        </header>

        {/* Split viewport */}
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          {/* LEFT: Clarity Inbox */}
          <section aria-label="Clarity Inbox">
            <PanelHeading
              eyebrow="Left viewport"
              title="Clarity Inbox"
              hint="Translated from raw channels"
            />
            <ClarityInbox messages={messages} onRatingChange={handleRating} />
          </section>

          {/* RIGHT: Calendar */}
          <section aria-label="Cognitive-Load Calendar">
            <PanelHeading
              eyebrow="Right viewport"
              title="Cognitive-Load Timeline"
              hint="09:00 – 18:00"
            />
            <CalendarTimeline blocks={calendar} onAcknowledge={handleAck} />

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Legend swatch="bg-deep-focus" label="Deep Work" />
              <Legend swatch="bg-amber-tint border border-amber-soft/60" label="Pending task" />
              <Legend swatch="bg-mint-soft border border-mint/60" label="Locked task" />
              <Legend swatch="bg-lavender-soft border border-lavender/50" label="Meeting" />
            </div>
          </section>
        </div>
      </div>

      <TraceLog />
    </>
  );
}

function PanelHeading({
  eyebrow,
  title,
  hint,
}: {
  eyebrow: string;
  title: string;
  hint: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </div>
        <h2 className="text-base font-medium text-foreground">{title}</h2>
      </div>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-card/60 px-2.5 py-1 ring-1 ring-border">
      <span className={`h-2.5 w-2.5 rounded-sm ${swatch}`} />
      {label}
    </span>
  );
}
