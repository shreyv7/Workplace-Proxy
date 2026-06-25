import { createFileRoute } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/preferences")({
  head: () => ({
    meta: [
      { title: "Preferences & Calibration — Project Clarity" },
      {
        name: "description",
        content:
          "Tune sensory load, agent verbosity and translation fidelity to match your cognitive style.",
      },
    ],
  }),
  component: PreferencesPage,
});

function PreferencesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender-soft">
        <SlidersHorizontal className="h-6 w-6 text-foreground/70" strokeWidth={1.75} />
      </div>
      <h1 className="mt-5 text-2xl font-medium text-foreground">Preferences & Calibration</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Calibrate sensory density, agent verbosity and translation fidelity so the swarm
        adapts to how you think.
      </p>
    </div>
  );
}
