import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { type ClarityMessage } from "../lib/mock-data";
import { 
  Mail, 
  MessageSquare, 
  Layers, 
  Users, 
  RefreshCw, 
  Search, 
  SlidersHorizontal,
  Inbox,
  Filter
} from "lucide-react";
import { MessageDetailPanel } from "../components/message-detail-panel";
import { SourceHealthCards } from "../components/source-health-cards";
import { AgentDebateModal } from "../components/agent-debate-modal";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Communication Inbox — Workplace Proxy" },
      {
        name: "description",
        content: "All intercepted communication threads across your connected channels.",
      },
    ],
  }),
  component: InboxPage,
});

function InboxPage() {
  const [messages, setMessages] = useState<ClarityMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedDebateId, setSelectedDebateId] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("timestamp", { ascending: false });

      if (data) {
        const mappedMsgs: ClarityMessage[] = data.map((m: any) => ({
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
            complexity: m.complexity || "Medium",
            expected_duration: m.expected_duration || "30 mins",
            steps: m.steps || [],
          },
          suggested_start_time: m.suggested_start_time,
          suggested_end_time: m.suggested_end_time,
          fidelity_rating: m.fidelity_rating || 3,
          acknowledged: m.acknowledged,
          reasoning: m.reasoning,
          debate_id: m.debate_id
        }));
        setMessages(mappedMsgs);
        
        // Auto select first message if nothing is selected
        if (mappedMsgs.length > 0 && !selectedMessageId) {
          setSelectedMessageId(mappedMsgs[0].message_id);
        }
      }
    } catch (error) {
      console.error("Error fetching inbox from Supabase: ", error);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Set up realtime WebSocket channel
    const channel = supabase
      .channel("inbox_realtime_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const triggerGlobalSync = async () => {
    setIsSyncing(true);
    await fetchMessages();
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await supabase.from("messages").update({ acknowledged: true }).eq("message_id", id);
      setMessages(prev => prev.map(m => m.message_id === id ? { ...m, acknowledged: true } : m));
    } catch (error) {
      console.error("Failed to acknowledge message:", error);
    }
  };

  const handleEscalate = async (id: string) => {
    try {
      await supabase.from("messages").update({ importance: "high" }).eq("message_id", id);
      setMessages(prev => prev.map(m => m.message_id === id ? { ...m, importance: "high" } : m));
    } catch (error) {
      console.error("Failed to escalate message:", error);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await supabase.from("messages").update({ acknowledged: true }).eq("message_id", id);
      setMessages(prev => prev.filter(m => m.message_id !== id));
      if (selectedMessageId === id) {
        setSelectedMessageId("");
      }
    } catch (error) {
      console.error("Failed to dismiss message:", error);
    }
  };

  const getSourceIcon = (source: ClarityMessage["source"]) => {
    switch (source) {
      case "slack":
        return <MessageSquare className="h-4 w-4 text-emerald-500" />;
      case "email":
        return <Mail className="h-4 w-4 text-indigo-500" />;
      case "jira":
        return <Layers className="h-4 w-4 text-blue-500" />;
      case "teams":
        return <Users className="h-4 w-4 text-sky-500" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Filter and search logic
  const filteredMessages = messages.filter((m) => {
    const matchesSearch = 
      m.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.original_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.translated_bullet_points.action.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSource = sourceFilter === "all" || m.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const selectedMessage = messages.find(m => m.message_id === selectedMessageId);

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-8 pb-28 animate-fade-in select-none">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Triage Stream</span>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Communication Inbox
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View the raw background messages currently intercepted and aligned by the AI consensus layer.
          </p>
        </div>

        <button 
          onClick={triggerGlobalSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-secondary/40 text-xs font-semibold px-4 py-2.5 transition-all text-foreground cursor-pointer"
        >
          <RefreshCw className={["h-4.5 w-4.5 text-muted-foreground", isSyncing ? "animate-spin text-mint" : ""].join(" ")} />
          Sync All Channels
        </button>
      </header>

      {/* Sync Telemetry Header */}
      <SourceHealthCards pendingCount={messages.filter(m => !m.acknowledged).length} />

      {/* Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
        {/* Left column (Master list) - 40% (4cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3 bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden group">
            {/* Ambient subtle glow overlay on the search container */}
            <div className="absolute -inset-px bg-gradient-to-r from-mint/10 to-lavender/10 rounded-2xl opacity-70 blur-xs transition-opacity group-hover:opacity-100 pointer-events-none" />
            
            {/* Search Input */}
            <div className="relative z-10">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search sender, message, actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-xl border border-border bg-secondary/35 text-foreground pl-9 pr-4 py-3 outline-hidden focus:border-mint focus:ring-1 focus:ring-mint/30 focus:shadow-[0_0_12px_oklch(0.82_0.16_168_/_20%)] transition-all duration-200"
              />
            </div>

            {/* Filter pills */}
            <div className="flex gap-1.5 overflow-x-auto py-1 relative z-10">
              <button
                onClick={() => setSourceFilter("all")}
                className={[
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer",
                  sourceFilter === "all" ? "bg-foreground text-background dark:bg-white dark:text-black border-transparent shadow-[0_0_10px_rgba(255,255,255,0.15)]" : "bg-transparent border-border text-muted-foreground hover:bg-secondary/50"
                ].join(" ")}
              >
                All
              </button>
              <button
                onClick={() => setSourceFilter("slack")}
                className={[
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1",
                  sourceFilter === "slack" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/35 shadow-[0_0_10px_oklch(0.78_0.18_145_/_15%)]" : "bg-transparent border-border text-muted-foreground hover:bg-secondary/50"
                ].join(" ")}
              >
                Slack
              </button>
              <button
                onClick={() => setSourceFilter("email")}
                className={[
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1",
                  sourceFilter === "email" ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/35 shadow-[0_0_10px_oklch(0.72_0.22_290_/_15%)]" : "bg-transparent border-border text-muted-foreground hover:bg-secondary/50"
                ].join(" ")}
              >
                Email
              </button>
            </div>
          </div>

          {/* Master List */}
          <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border/60 bg-card max-h-[600px] overflow-y-auto">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((m) => {
                const isSelected = m.message_id === selectedMessageId;
                return (
                  <div
                    key={m.message_id}
                    onClick={() => setSelectedMessageId(m.message_id)}
                    className={[
                      "p-4 flex flex-col gap-2.5 cursor-pointer relative select-none neon-card-hover border-b border-border/40",
                      isSelected 
                        ? "bg-secondary/60 border-l-4 border-lavender shadow-[0_0_15px_oklch(0.72_0.22_290_/_15%)]" 
                        : "hover:bg-secondary/25"
                    ].join(" ")}
                  >
                    {!m.acknowledged && (
                      <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                    )}

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary shrink-0">
                          {getSourceIcon(m.source)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-foreground block truncate">{m.sender_name}</span>
                          <span className="text-[9px] text-muted-foreground font-mono truncate block">{m.sender_role || "External Contact"}</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-muted-foreground font-mono shrink-0">{m.timestamp}</span>
                    </div>

                    <p className="text-xs text-muted-foreground font-mono line-clamp-2 leading-relaxed">
                      "{m.original_text}"
                    </p>

                    {m.translation_status === "processing" ? (
                      <span className="text-[9px] font-bold text-indigo-500 font-mono flex items-center gap-1 animate-pulse">
                        🔄 Swarm debating consensus...
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-foreground leading-snug line-clamp-1">
                        🎯 {m.translated_bullet_points.action}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-muted-foreground text-xs font-semibold">
                No matching messages found in triage stream.
              </div>
            )}
          </div>
        </div>

        {/* Right column (Detail view) - 60% (6cols) */}
        <div className="lg:col-span-6 bg-card border border-border rounded-2xl p-6 shadow-xs min-h-[500px]">
          {selectedMessage ? (
            <MessageDetailPanel
              message={selectedMessage}
              onAcknowledge={handleAcknowledge}
              onOpenDebate={(debateId) => setSelectedDebateId(debateId)}
              onEscalate={handleEscalate}
              onDismiss={handleDismiss}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-24 select-none">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                <Inbox className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">No Message Selected</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">Select an incoming signal from the triage stream to view decoded briefs, inspect swarm debates, and draft replies.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent Debate Modal */}
      {selectedDebateId && (
        <AgentDebateModal
          debateId={selectedDebateId}
          message={messages.find((m) => m.debate_id === selectedDebateId || `deb_${m.message_id}` === selectedDebateId)}
          onClose={() => setSelectedDebateId(null)}
        />
      )}
    </div>
  );
}
