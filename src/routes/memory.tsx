import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { initialMemories, MemoryEntry } from "../lib/mock-data";
import { Brain, Search, Sparkles, User, Building, Database, Clock, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/memory")({
  head: () => ({
    meta: [
      { title: "Cognitive Memory — Project Clarity" },
      {
        name: "description",
        content: "Explore the vector database storing your personal energy schedules and corporate context policies.",
      },
    ],
  }),
  component: CognitiveMemory,
});

function CognitiveMemory() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "personal" | "corporate">("all");
  const [memories, setMemories] = useState<MemoryEntry[]>(initialMemories);

  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      const matchSearch =
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.content.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === "all" || m.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [memories, search, activeCategory]);

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-8 pb-28 animate-fade-in select-none">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Memory Vector Store</span>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Workspace Memory bindings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View the historical constraints, energy cycles, and guidelines the agent swarms reference during resolution debates.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground font-mono bg-card border border-border px-3.5 py-2 rounded-xl">
          <Database className="h-4 w-4 text-mint" />
          Qdrant DB: 6 Active Bindings
        </div>
      </header>

      {/* Control row */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search vector definitions (e.g. style, deployment)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Categories Tab Toggle */}
        <div className="flex items-center gap-1.5 rounded-xl bg-secondary/40 p-1 border border-border/50 shrink-0">
          {(["all", "personal", "corporate"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={[
                "px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-all duration-200",
                activeCategory === cat
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of memory blocks */}
      {filteredMemories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMemories.map((entry, idx) => {
            const isPersonal = entry.category === "personal";
            return (
              <div
                key={entry.id}
                className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-mint/30 hover:shadow-[0_0_12px_oklch(0.94_0.035_170_/_30%)] flex flex-col gap-4 animate-scale-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Top line category indicator */}
                <div className="flex items-center justify-between">
                  <span className={[
                    "px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border",
                    isPersonal 
                      ? "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30" 
                      : "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                  ].join(" ")}>
                    {isPersonal ? <User className="h-3 w-3" /> : <Building className="h-3 w-3" />}
                    {entry.category} Memory
                  </span>

                  <span className="font-mono text-[10px] text-indigo-500 bg-secondary px-1.5 py-0.5 rounded">
                    {entry.confidence}% Vector Weight
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">{entry.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {entry.content}
                  </p>
                </div>

                {/* Footer telemetry */}
                <div className="border-t border-border/50 pt-4 mt-auto flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Updated {entry.last_updated}
                  </span>
                  <span className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 text-mint/80" /> Referenced {entry.use_count}x
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-border border-dashed bg-card p-12 text-center text-muted-foreground max-w-md mx-auto mt-12">
          <Brain className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground mb-1">No vector entries matched search</h3>
          <p className="text-xs">Try searching for other terms like "style" or "figma".</p>
        </div>
      )}
    </div>
  );
}
