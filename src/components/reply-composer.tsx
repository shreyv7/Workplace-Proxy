import { useState, type ChangeEvent } from "react";
import { Sparkles, MessageSquare, Send, Check, AlertCircle, Loader2 } from "lucide-react";
import { API_BASE_URL, generateReplyDrafts, type ReplyDraft } from "../lib/api";
import { SLACK_MCP_URL } from "../lib/integrations";

interface ReplyComposerProps {
  messageId: string;
  originalContent: string;
  senderName: string;
  source: "slack" | "email" | "jira" | "teams";
  channelId?: string; // Optional, falls back to config if not present
  onReplySent?: () => void;
}

export function ReplyComposer({
  messageId,
  originalContent,
  senderName,
  source,
  channelId,
  onReplySent,
}: ReplyComposerProps) {
  const [tone, setTone] = useState<"casual" | "professional" | "concise">("professional");
  const [additionalContext, setAdditionalContext] = useState("");
  const [drafts, setDrafts] = useState<ReplyDraft[]>([]);
  const [selectedDraftText, setSelectedDraftText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const generateDrafts = async () => {
    setIsGenerating(true);
    setFeedbackMsg(null);
    try {
      const data = await generateReplyDrafts({
        message_id: messageId,
        original_content: originalContent,
        sender_name: senderName,
        tone: tone,
        additional_context: additionalContext || undefined,
      });
      if (data.success && data.drafts) {
        setDrafts(data.drafts);
        // Default select the one matching preferred tone
        const matching = data.drafts.find((d: ReplyDraft) => d.tone === tone);
        setSelectedDraftText(matching ? matching.text : data.drafts[0].text);
      }
    } catch (err: unknown) {
      console.error(err);
      setFeedbackMsg({ type: "error", text: "Swarm engine offline. Using fallback drafts." });

      // Local fallback drafts
      const fallback: ReplyDraft[] = [
        {
          text: `Hey ${senderName}, got your message about '${originalContent.slice(0, 30)}...'. Let me check my calendar and get back to you shortly!`,
          tone: "casual",
          word_count: 21,
        },
        {
          text: `Dear ${senderName},\n\nThank you for reaching out. I have received your message regarding '${originalContent.slice(0, 30)}...' and am currently reviewing it. I will provide a detailed update shortly.\n\nBest regards,`,
          tone: "professional",
          word_count: 32,
        },
        {
          text: `Got it. Let me look into this and reply soon.`,
          tone: "concise",
          word_count: 10,
        },
      ];
      setDrafts(fallback);
      const matching = fallback.find((d: ReplyDraft) => d.tone === tone);
      setSelectedDraftText(matching ? matching.text : fallback[0].text);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendReply = async () => {
    if (!selectedDraftText.trim()) return;
    setIsSending(true);
    setFeedbackMsg(null);

    // Only Slack currently supports real outbound message routing
    if (source !== "slack") {
      // Simulate successful dispatch for other mock channels
      setTimeout(() => {
        setIsSending(false);
        setFeedbackMsg({
          type: "success",
          text: `Draft simulated as sent to ${senderName} via ${source}`,
        });
        if (onReplySent) onReplySent();
      }, 1000);
      return;
    }

    try {
      // Fetch channelId if not explicitly provided (e.g. from config or a default channel)
      const targetChannel = channelId || "C0BDDSACL3D";

      const response = await fetch(`${SLACK_MCP_URL}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: targetChannel,
          text: selectedDraftText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message via Slack MCP");
      }

      setFeedbackMsg({ type: "success", text: "Reply posted successfully to Slack!" });
      setSelectedDraftText("");
      setDrafts([]);
      setAdditionalContext("");
      if (onReplySent) onReplySent();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unknown Slack send failure";
      setFeedbackMsg({ type: "error", text: `Slack Error: ${errorMessage}` });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-gradient-to-b from-card to-card/50 p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4.5 w-4.5 text-mint" />
          <h4 className="text-sm font-bold text-foreground">AI Reply Swarm Composer</h4>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase bg-secondary px-2.5 py-1 rounded-md">
          {source} outbound
        </span>
      </div>

      {drafts.length === 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Draft Tone
              </label>
              <select
                value={tone}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setTone(e.target.value as "casual" | "professional" | "concise")
                }
                className="w-full text-xs font-semibold rounded-xl border border-border bg-card hover:bg-secondary/40 text-foreground px-3.5 py-2.5 transition-all outline-hidden cursor-pointer"
              >
                <option value="professional">👔 Professional</option>
                <option value="casual">☕ Casual</option>
                <option value="concise">⚡ Concise</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Additional Prompt Context (Optional)
              </label>
              <input
                type="text"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="e.g., 'Say I am busy until tomorrow at 10 AM'"
                className="w-full text-xs font-medium rounded-xl border border-border bg-card text-foreground px-3.5 py-2.5 outline-hidden focus:border-mint transition-colors"
              />
            </div>
          </div>

          <button
            onClick={generateDrafts}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-mint to-teal-500 hover:from-mint/90 hover:to-teal-500/90 text-white rounded-xl text-xs font-bold py-3 shadow-[0_4px_20px_rgba(16,185,129,0.15)] disabled:opacity-50 transition-all cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Consulting Swarm...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Reply Drafts</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {/* Draft Selection Pills */}
          <div className="flex gap-2">
            {drafts.map((d) => (
              <button
                key={d.tone}
                onClick={() => setSelectedDraftText(d.text)}
                className={[
                  "px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer capitalize",
                  selectedDraftText === d.text
                    ? "bg-mint/15 text-mint border-mint/20"
                    : "bg-secondary text-muted-foreground border-transparent hover:bg-secondary/80",
                ].join(" ")}
              >
                {d.tone} ({d.word_count} words)
              </button>
            ))}
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              rows={4}
              value={selectedDraftText}
              onChange={(e) => setSelectedDraftText(e.target.value)}
              className="w-full text-xs leading-relaxed font-sans rounded-xl border border-border bg-card/60 text-foreground p-4 outline-hidden focus:border-mint transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setDrafts([]);
                setSelectedDraftText("");
              }}
              className="flex-1 text-xs font-bold bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-xl py-3 cursor-pointer text-center"
            >
              Reset Draft
            </button>
            <button
              onClick={sendReply}
              disabled={isSending || !selectedDraftText.trim()}
              className="flex-2 flex items-center justify-center gap-2 bg-foreground text-background dark:bg-white dark:text-black hover:opacity-90 rounded-xl text-xs font-bold py-3 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Reply</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success/Error Alerts */}
      {feedbackMsg && (
        <div
          className={[
            "flex items-start gap-2.5 rounded-xl border p-3.5 text-xs font-medium animate-slide-up",
            feedbackMsg.type === "success"
              ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20",
          ].join(" ")}
        >
          {feedbackMsg.type === "success" ? (
            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}
    </div>
  );
}
