import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Communication Inbox — Project Clarity" },
      {
        name: "description",
        content: "All intercepted communication threads across your connected channels.",
      },
    ],
  }),
  component: InboxPage,
});

function InboxPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-soft">
        <Inbox className="h-6 w-6 text-foreground/70" strokeWidth={1.75} />
      </div>
      <h1 className="mt-5 text-2xl font-medium text-foreground">Communication Inbox</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Connect Slack, Email and Linear to let the agent swarm intercept and translate
        raw messages before they reach you.
      </p>
    </div>
  );
}
