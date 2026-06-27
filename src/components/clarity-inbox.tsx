import { ClarityMessage } from "../lib/mock-data";
import { Mail, MessageSquare, Layers, Users, AlertCircle, CheckCircle2 } from "lucide-react";

type Props = {
  messages: ClarityMessage[];
  selectedMessageId: string;
  onSelectMessage: (id: string) => void;
};

export function ClarityInbox({ messages, selectedMessageId, onSelectMessage }: Props) {
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

  const getImportanceStyles = (importance: ClarityMessage["importance"]) => {
    switch (importance) {
      case "high":
        return "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30";
      case "medium":
        return "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30";
      default:
        return "bg-secondary text-muted-foreground border-transparent";
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {messages.map((m) => {
        const isSelected = m.message_id === selectedMessageId;
        const icon = getSourceIcon(m.source);
        const importanceStyle = getImportanceStyles(m.importance);

        return (
          <article
            key={m.message_id}
            onClick={() => onSelectMessage(m.message_id)}
            className={[
              "group relative overflow-hidden rounded-2xl border p-4.5 text-left transition-all duration-200 cursor-pointer select-none",
              isSelected
                ? "border-primary bg-card shadow-sm"
                : "border-border bg-card/60 hover:bg-card hover:border-border/80 hover:shadow-xs",
            ].join(" ")}
          >
            {/* Top Row: Source, Sender and Time */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/80">
                  {icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{m.sender_name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{m.sender_role}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">{m.timestamp}</span>
            </div>

            {/* Middle Row: Message snippet */}
            <p className="mt-3 text-xs leading-relaxed text-foreground/80 line-clamp-2">
              {m.original_text}
            </p>

            {/* Bottom Row: Status indicators */}
            <div className="mt-3.5 flex items-center justify-between gap-2 pt-3 border-t border-border/40">
              <span className={["px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider border", importanceStyle].join(" ")}>
                {m.importance} priority
              </span>
              
              <div className="flex items-center gap-1.5">
                {m.acknowledged ? (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-mint bg-mint-soft/10 dark:bg-mint-soft/25 px-2.5 py-0.5 rounded-full border border-mint/20 tracking-wide uppercase">
                    <CheckCircle2 className="h-3 w-3 text-mint" /> Scheduled
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 tracking-wide uppercase">
                    <AlertCircle className="h-3 w-3 text-amber-500" /> Pending action
                  </span>
                )}
              </div>
            </div>
            
            {/* Active sidebar highlight line */}
            {isSelected && (
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-mint rounded-r" />
            )}
          </article>
        );
      })}
    </div>
  );
}
