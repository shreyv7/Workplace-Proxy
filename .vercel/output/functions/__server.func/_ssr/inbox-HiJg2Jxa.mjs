import { i as __toESM } from "../_runtime.mjs";
import { c as getDebugTranscript, i as generateReplyDrafts, n as ApiError, t as API_BASE_URL } from "./api-CyqFAnVh.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/@lottiefiles/dotlottie-react+[...].mjs";
import { D as Mail, F as Inbox, G as ChevronUp, H as Cpu, J as Check, Y as Calendar, _ as Send, a as User, b as RefreshCw, dt as Layers, et as Bot, h as ShieldAlert, i as Users, j as Link2, lt as Sparkles, m as ShieldCheck, mt as CircleAlert, n as X, pt as CircleCheck, q as ChevronDown, rt as ArrowUpRight, ut as LoaderCircle, v as Search, w as MessageSquare, y as Scale } from "../_libs/lucide-react.mjs";
import { t as supabase } from "./supabase-gMqJtobQ.mjs";
import { r as initialMessages, t as initialDebates } from "./mock-data-BYci73lJ.mjs";
import { t as SLACK_MCP_URL } from "./integrations-DsHHEf-F.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inbox-HiJg2Jxa.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ReplyComposer({ messageId, originalContent, senderName, source, channelId, onReplySent }) {
	const [tone, setTone] = (0, import_react.useState)("professional");
	const [additionalContext, setAdditionalContext] = (0, import_react.useState)("");
	const [drafts, setDrafts] = (0, import_react.useState)([]);
	const [selectedDraftText, setSelectedDraftText] = (0, import_react.useState)("");
	const [isGenerating, setIsGenerating] = (0, import_react.useState)(false);
	const [isSending, setIsSending] = (0, import_react.useState)(false);
	const [feedbackMsg, setFeedbackMsg] = (0, import_react.useState)(null);
	const generateDrafts = async () => {
		setIsGenerating(true);
		setFeedbackMsg(null);
		try {
			const data = await generateReplyDrafts({
				message_id: messageId,
				original_content: originalContent,
				sender_name: senderName,
				tone,
				additional_context: additionalContext || void 0
			});
			if (data.success && data.drafts) {
				setDrafts(data.drafts);
				const matching = data.drafts.find((d) => d.tone === tone);
				setSelectedDraftText(matching ? matching.text : data.drafts[0].text);
			}
		} catch (err) {
			console.error(err);
			setFeedbackMsg({
				type: "error",
				text: "Swarm engine offline. Using fallback drafts."
			});
			const fallback = [
				{
					text: `Hey ${senderName}, got your message about '${originalContent.slice(0, 30)}...'. Let me check my calendar and get back to you shortly!`,
					tone: "casual",
					word_count: 21
				},
				{
					text: `Dear ${senderName},\n\nThank you for reaching out. I have received your message regarding '${originalContent.slice(0, 30)}...' and am currently reviewing it. I will provide a detailed update shortly.\n\nBest regards,`,
					tone: "professional",
					word_count: 32
				},
				{
					text: `Got it. Let me look into this and reply soon.`,
					tone: "concise",
					word_count: 10
				}
			];
			setDrafts(fallback);
			const matching = fallback.find((d) => d.tone === tone);
			setSelectedDraftText(matching ? matching.text : fallback[0].text);
		} finally {
			setIsGenerating(false);
		}
	};
	const sendReply = async () => {
		if (!selectedDraftText.trim()) return;
		setIsSending(true);
		setFeedbackMsg(null);
		if (source !== "slack") {
			setTimeout(() => {
				setIsSending(false);
				setFeedbackMsg({
					type: "success",
					text: `Draft simulated as sent to ${senderName} via ${source}`
				});
				if (onReplySent) onReplySent();
			}, 1e3);
			return;
		}
		try {
			const targetChannel = channelId || "C0BDDSACL3D";
			const response = await fetch(`${SLACK_MCP_URL}/reply`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					channelId: targetChannel,
					text: selectedDraftText
				})
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to send message via Slack MCP");
			}
			setFeedbackMsg({
				type: "success",
				text: "Reply posted successfully to Slack!"
			});
			setSelectedDraftText("");
			setDrafts([]);
			setAdditionalContext("");
			if (onReplySent) onReplySent();
		} catch (err) {
			console.error(err);
			setFeedbackMsg({
				type: "error",
				text: `Slack Error: ${err instanceof Error ? err.message : "Unknown Slack send failure"}`
			});
		} finally {
			setIsSending(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-white/10 dark:border-white/5 bg-gradient-to-b from-card to-card/50 p-6 shadow-sm flex flex-col gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between border-b border-border/60 pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-4.5 w-4.5 text-mint" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						className: "text-sm font-bold text-foreground",
						children: "AI Reply Swarm Composer"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-[10px] font-mono text-muted-foreground uppercase bg-secondary px-2.5 py-1 rounded-md",
					children: [source, " outbound"]
				})]
			}),
			drafts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 sm:grid-cols-3 gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5",
						children: "Draft Tone"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: tone,
						onChange: (e) => setTone(e.target.value),
						className: "w-full text-xs font-semibold rounded-xl border border-border bg-card hover:bg-secondary/40 text-foreground px-3.5 py-2.5 transition-all outline-hidden cursor-pointer",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "professional",
								children: "👔 Professional"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "casual",
								children: "☕ Casual"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "concise",
								children: "⚡ Concise"
							})
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sm:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5",
							children: "Additional Prompt Context (Optional)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							value: additionalContext,
							onChange: (e) => setAdditionalContext(e.target.value),
							placeholder: "e.g., 'Say I am busy until tomorrow at 10 AM'",
							className: "w-full text-xs font-medium rounded-xl border border-border bg-card text-foreground px-3.5 py-2.5 outline-hidden focus:border-mint transition-colors"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: generateDrafts,
					disabled: isGenerating,
					className: "w-full flex items-center justify-center gap-2 bg-gradient-to-r from-mint to-teal-500 hover:from-mint/90 hover:to-teal-500/90 text-white rounded-xl text-xs font-bold py-3 shadow-[0_4px_20px_rgba(16,185,129,0.15)] disabled:opacity-50 transition-all cursor-pointer",
					children: isGenerating ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Consulting Swarm..." })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Generate Reply Drafts" })] })
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4 animate-fade-in",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2",
						children: drafts.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setSelectedDraftText(d.text),
							className: ["px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer capitalize", selectedDraftText === d.text ? "bg-mint/15 text-mint border-mint/20" : "bg-secondary text-muted-foreground border-transparent hover:bg-secondary/80"].join(" "),
							children: [
								d.tone,
								" (",
								d.word_count,
								" words)"
							]
						}, d.tone))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							rows: 4,
							value: selectedDraftText,
							onChange: (e) => setSelectedDraftText(e.target.value),
							className: "w-full text-xs leading-relaxed font-sans rounded-xl border border-border bg-card/60 text-foreground p-4 outline-hidden focus:border-mint transition-colors"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								setDrafts([]);
								setSelectedDraftText("");
							},
							className: "flex-1 text-xs font-bold bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-xl py-3 cursor-pointer text-center",
							children: "Reset Draft"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: sendReply,
							disabled: isSending || !selectedDraftText.trim(),
							className: "flex-2 flex items-center justify-center gap-2 bg-foreground text-background dark:bg-white dark:text-black hover:opacity-90 rounded-xl text-xs font-bold py-3 disabled:opacity-50 transition-all cursor-pointer",
							children: isSending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Dispatching..." })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Send Reply" })] })
						})]
					})
				]
			}),
			feedbackMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: ["flex items-start gap-2.5 rounded-xl border p-3.5 text-xs font-medium animate-slide-up", feedbackMsg.type === "success" ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20"].join(" "),
				children: [feedbackMsg.type === "success" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4 text-emerald-500 shrink-0 mt-0.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-4 w-4 text-rose-500 shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: feedbackMsg.text })]
			})
		]
	});
}
function MessageDetailPanel({ message, onAcknowledge, onOpenDebate, onEscalate, onDismiss }) {
	const [showDebateTrail, setShowDebateTrail] = (0, import_react.useState)(false);
	const [debateTranscript, setDebateTranscript] = (0, import_react.useState)([]);
	const [loadingDebate, setLoadingDebate] = (0, import_react.useState)(false);
	const [isParsing, setIsParsing] = (0, import_react.useState)(false);
	const [parseError, setParseError] = (0, import_react.useState)(null);
	const handleReprocessMessage = async () => {
		setIsParsing(true);
		setParseError(null);
		try {
			const { data: { session } } = await supabase.auth.getSession();
			const userId = session?.user?.id ?? "usr_clarity_101";
			const googleAccessToken = session?.provider_token ?? (typeof window !== "undefined" ? sessionStorage.getItem("google_provider_token") : null) ?? void 0;
			const requestBody = {
				message_id: message.message_id,
				source: message.source,
				sender_name: message.sender_name,
				sender_role: message.sender_role || "External Contact",
				content: message.original_text,
				timestamp: (/* @__PURE__ */ new Date()).toISOString(),
				thread_context: [],
				user_id: userId,
				...googleAccessToken ? { google_access_token: googleAccessToken } : {}
			};
			await supabase.from("messages").update({
				translation_status: "processing",
				action: "Analyzing inbound signals...",
				expected_duration: "Evaluating...",
				steps: ["Parsing Gmail message"],
				reasoning: "Debating consensus bounds with agent swarm..."
			}).eq("message_id", message.message_id);
			const response = await fetch(`${API_BASE_URL}/api/v1/process`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody)
			});
			if (!response.ok) throw new Error(`Orchestrator returned ${response.status}`);
			const result = await response.json();
			const task = result.translated_task;
			const slot = result.calendar_slot;
			let importance = "medium";
			if (task.urgency === "high" || task.urgency === "critical") importance = "high";
			if (task.urgency === "low") importance = "low";
			let startTime = "14:00";
			let endTime = "14:30";
			if (slot?.suggested_start) startTime = new Date(slot.suggested_start).toLocaleTimeString("en-GB", {
				hour: "2-digit",
				minute: "2-digit"
			});
			if (slot?.suggested_end) endTime = new Date(slot.suggested_end).toLocaleTimeString("en-GB", {
				hour: "2-digit",
				minute: "2-digit"
			});
			const reasoning = result.warnings?.some((w) => w.startsWith("Pipeline error:")) ? "An error occurred during automated translation. The action above is a best-effort estimate — please review the original message." : task.decoded_subtext || slot?.rationale || "Consensus aligned successfully.";
			const updatedMsg = {
				translation_status: "completed",
				importance,
				action: task.title,
				complexity: task.urgency.charAt(0).toUpperCase() + task.urgency.slice(1),
				expected_duration: slot ? `${slot.duration_minutes} mins` : "30 mins",
				steps: task.action_items.map((item) => item.description),
				suggested_start_time: startTime,
				suggested_end_time: endTime,
				reasoning,
				debate_id: result.request_id || `deb_${message.message_id}`
			};
			await supabase.from("messages").update(updatedMsg).eq("message_id", message.message_id);
			if (slot) {
				await supabase.from("calendar_blocks").delete().eq("id", `task_${message.message_id}`);
				await supabase.from("calendar_blocks").insert([{
					id: `task_${message.message_id}`,
					start: startTime,
					end: endTime,
					title: task.title,
					type: "task",
					source_message_id: message.message_id,
					acknowledged: false,
					agent_generated: true,
					confidence: Math.round(result.confidence_score * 100),
					reason: slot.rationale
				}]);
			}
		} catch (err) {
			console.error("Swarm reprocess failed:", err);
			setParseError(err.message || "Failed to contact swarm.");
			await supabase.from("messages").update({
				translation_status: "completed",
				action: `Action Required: Review Email from ${message.sender_name}`,
				reasoning: `Swarm processing offline: ${err.message || "fetch failed"}`,
				expected_duration: "Evaluating...",
				steps: ["Parsing Gmail message"]
			}).eq("message_id", message.message_id);
		} finally {
			setIsParsing(false);
		}
	};
	const { action, complexity, expected_duration, steps } = message.translated_bullet_points;
	const displayReasoning = message.reasoning === "Translation pipeline failed — manual review required." ? "An error occurred during automated processing. The action above is a best-effort estimate — please review the original message manually." : message.reasoning;
	(0, import_react.useEffect)(() => {
		if (!showDebateTrail) return;
		const fetchDebate = async () => {
			setLoadingDebate(true);
			const seedDebate = initialDebates.find((d) => d.id === message.debate_id);
			if (seedDebate) {
				setDebateTranscript(seedDebate.transcript);
				setLoadingDebate(false);
				return;
			}
			try {
				const data = await getDebugTranscript();
				const targetRequestId = message.message_id || message.debate_id?.replace(/^deb_/, "");
				if (data && data.request_id === targetRequestId && data.messages) setDebateTranscript(data.messages.map((m) => ({
					agent: m.sender || "Agent",
					opinion: m.type === "consensus" ? "Secured consensus alignment." : m.reasoning,
					status: m.type === "consensus" ? "agreed" : "proposed",
					reason: m.reasoning
				})));
			} catch (err) {
				console.error("Failed to load live debate transcript:", err);
			} finally {
				setLoadingDebate(false);
			}
		};
		fetchDebate();
	}, [
		showDebateTrail,
		message.debate_id,
		message.message_id
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6 animate-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-b border-border pb-4 flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: ["px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", {
								low: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
								medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-[0_0_8px_oklch(0.78_0.09_70_/_10%)]",
								high: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-[0_0_8px_oklch(0.6_0.18_20_/_15%)]"
							}[message.importance]].join(" "),
							children: [message.importance, " urgency"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground font-mono",
							children: message.timestamp
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [onEscalate && message.importance !== "high" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onEscalate(message.message_id),
							className: "text-[10px] font-bold text-rose-500 hover:bg-rose-500/5 px-2.5 py-1.5 rounded-lg border border-rose-500/10 transition-colors cursor-pointer",
							children: "Escalate"
						}), onDismiss && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onDismiss(message.message_id),
							className: "text-[10px] font-bold text-muted-foreground hover:bg-secondary px-2.5 py-1.5 rounded-lg border border-border transition-colors cursor-pointer",
							children: "Archive"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-5 w-5 text-muted-foreground" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-base font-extrabold text-foreground tracking-tight leading-snug",
						children: message.sender_name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground font-mono mt-0.5",
						children: message.sender_role || "External Contact"
					})] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-secondary/40 border border-border/80 rounded-2xl p-5 relative overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute top-3 right-4 text-[9px] font-mono font-bold tracking-widest text-muted-foreground uppercase",
					children: "Original Signal"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-foreground/80 leading-relaxed font-mono whitespace-pre-wrap mt-3 italic",
					children: [
						"\"",
						message.original_text,
						"\""
					]
				})]
			}),
			message.translation_status === "processing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center bg-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-8 rounded-full border-2 border-mint border-t-transparent animate-spin" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-bold text-foreground",
						children: "Consensus Swarm actively debating subtext..."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] text-muted-foreground max-w-xs font-mono",
						children: "Running Interceptor, Contextualizer, Scheduler, and Translator agents."
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col gap-5 relative overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[9px] font-mono text-muted-foreground uppercase tracking-widest bg-secondary px-2.5 py-0.5 rounded-full",
							children: "AI Decoded Action Briefing"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-bold text-foreground tracking-tight mt-2 leading-snug",
							children: action || `Review Message from ${message.sender_name}`
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: `px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${{
								Low: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_oklch(0.85_0.22_145_/_10%)]",
								Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-[0_0_8px_oklch(0.78_0.09_70_/_10%)]",
								High: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-[0_0_8px_oklch(0.6_0.18_20_/_10%)]"
							}[complexity] || "bg-secondary text-foreground"}`,
							children: [complexity, " Complexity"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2 text-[10px] font-mono",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5 bg-secondary/55 text-foreground/80 px-2.5 py-1.5 rounded-xl font-medium",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-3.5 w-3.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								"Suggested Slot: ",
								message.suggested_start_time,
								" - ",
								message.suggested_end_time
							] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5 bg-secondary/55 text-foreground/80 px-2.5 py-1.5 rounded-xl font-medium",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-3.5 w-3.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Est. Duration: ", expected_duration] })]
						})]
					}),
					steps && steps.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-bold text-muted-foreground uppercase tracking-wider block",
							children: "Explicit Action Steps"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2",
							children: steps.map((step, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-col gap-2.5 text-xs text-foreground/95 bg-secondary/35 p-3 rounded-xl border border-border/40 w-full",
								children: step.toLowerCase().includes("parsing") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "w-full space-y-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start gap-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-4.5 w-4.5 rounded-md border border-border bg-card flex items-center justify-center shrink-0 mt-0.5",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[9px] font-bold text-muted-foreground",
													children: idx + 1
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "leading-relaxed font-sans text-muted-foreground italic",
												children: "Ingestion completed, but swarm consensus processing is pending."
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: handleReprocessMessage,
											disabled: isParsing,
											className: "w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white font-bold text-xs py-2.5 px-4 transition-all shadow-md cursor-pointer disabled:opacity-50",
											children: isParsing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), "Running Agent Swarm Consensus..."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "h-4 w-4" }), "Parse Gmail message"] })
										}),
										parseError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-[10px] text-rose-500 font-semibold text-center mt-1",
											children: ["⚠️ ", parseError]
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-2.5 w-full",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-4.5 w-4.5 rounded-md border border-border bg-card flex items-center justify-center shrink-0 mt-0.5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px] font-bold text-muted-foreground",
											children: idx + 1
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "leading-relaxed font-sans",
										children: step
									})]
								})
							}, idx))
						})]
					}),
					displayReasoning && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-secondary/25 p-4 rounded-xl border border-border/40 space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-bold text-muted-foreground uppercase tracking-wider block",
							children: "Decoded Context & Rationale"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground leading-relaxed font-sans",
							children: displayReasoning
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-4 border-t border-border/60 pt-4 mt-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => onOpenDebate(message.debate_id || `deb_${message.message_id}`),
							className: "inline-flex items-center gap-1 text-[10.5px] font-bold text-lavender hover:text-mint hover:shadow-[0_0_8px_oklch(0.82_0.16_168_/_15%)] transition-all duration-200",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "h-4 w-4" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Inspect Swarm Debate Trail" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "h-3.5 w-3.5" })
							]
						}), message.acknowledged ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1.5 text-[11px] text-mint font-bold bg-mint/10 border border-mint/20 px-3 py-2 rounded-xl",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5" }), " Task Scheduled"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => onAcknowledge(message.message_id),
							className: "inline-flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-mint via-indigo-500 to-lavender hover:opacity-95 text-white px-4.5 py-3 rounded-xl shadow-[0_0_15px_oklch(0.78_0.18_290_/_20%)] hover:shadow-[0_0_22px_oklch(0.82_0.16_168_/_40%)] transition-all duration-300 hover:scale-[1.02] cursor-pointer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Confirm & Block Calendar" })]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-border/60 rounded-2xl overflow-hidden bg-card/40",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setShowDebateTrail(!showDebateTrail),
					className: "w-full flex items-center justify-between p-4 text-xs font-bold text-foreground hover:bg-secondary/60 transition-colors border-b border-border/20 outline-hidden cursor-pointer bg-gradient-to-r from-secondary/20 to-transparent",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scale, { className: "h-4 w-4 text-lavender" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text",
							children: "Show Debate Consensus Trail"
						})]
					}), showDebateTrail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "h-4 w-4 text-lavender" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 text-muted-foreground" })]
				}), showDebateTrail && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "p-4 border-t border-border/60 bg-card space-y-3.5 divide-y divide-border/60",
					children: loadingDebate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-center items-center py-6 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin text-indigo-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold text-muted-foreground",
							children: "Retrieving consensus transcript..."
						})]
					}) : debateTranscript.length > 0 ? debateTranscript.map((step, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: ["pt-3.5 first:pt-0 flex flex-col gap-1.5 text-xs", idx > 0 ? "border-t border-border/40" : ""].join(" "),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold text-foreground capitalize font-mono text-[11px]",
								children: step.agent
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: ["text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md", step.status === "agreed" ? "bg-emerald-500/10 text-emerald-500" : "bg-indigo-500/10 text-indigo-500"].join(" "),
								children: step.status === "agreed" ? "CONSENSUS ALIGNED" : "DEBATING"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground leading-relaxed font-sans",
							children: step.opinion
						})]
					}, idx)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-center py-4 text-xs text-muted-foreground font-mono",
						children: "No active debate records found for this message."
					})
				})]
			}),
			message.translation_status !== "processing" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReplyComposer, {
				messageId: message.message_id,
				originalContent: message.original_text,
				senderName: message.sender_name,
				source: message.source,
				onReplySent: () => {}
			})
		]
	});
}
function SourceHealthCards({ pendingCount }) {
	const [slackStatus, setSlackStatus] = (0, import_react.useState)("offline");
	const [emailStatus, setEmailStatus] = (0, import_react.useState)("offline");
	const [calendarStatus, setCalendarStatus] = (0, import_react.useState)("offline");
	const [swarmStatus, setSwarmStatus] = (0, import_react.useState)("offline");
	const checkHealth = async () => {
		try {
			setSlackStatus((await fetch(`http://localhost:3000/health`, { signal: AbortSignal.timeout(1500) })).ok ? "online" : "offline");
		} catch {
			setSlackStatus("offline");
		}
		try {
			setEmailStatus((await fetch(`http://localhost:3001/health`, { signal: AbortSignal.timeout(1500) })).ok ? "online" : "offline");
		} catch {
			setEmailStatus("offline");
		}
		try {
			setCalendarStatus((await fetch(`http://localhost:3002/health`, { signal: AbortSignal.timeout(1500) })).ok ? "online" : "offline");
		} catch {
			setCalendarStatus("offline");
		}
		try {
			setSwarmStatus((await fetch(`http://localhost:8000/api/v1/health`, { signal: AbortSignal.timeout(1500) })).ok ? "online" : "offline");
		} catch {
			setSwarmStatus("offline");
		}
	};
	(0, import_react.useEffect)(() => {
		checkHealth();
		const interval = setInterval(checkHealth, 3e4);
		return () => clearInterval(interval);
	}, []);
	const getOnlineSourcesText = () => {
		const list = [];
		if (slackStatus === "online") list.push("Slack");
		if (emailStatus === "online") list.push("Email");
		if (calendarStatus === "online") list.push("Calendar");
		if (list.length === 0) return "All channels offline";
		if (list.length === 3) return "Slack, Email, Calendar online";
		return `${list.join(" and ")} online`;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 select-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-white/10 dark:border-white/5 bg-gradient-to-b from-card to-card/50 p-5 shadow-xs flex flex-col justify-between min-h-[110px] hover:shadow-md transition-all duration-300",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between items-center mb-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-bold text-muted-foreground uppercase tracking-widest",
						children: "Triage Queue"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-2xl font-extrabold tracking-tight text-foreground",
					children: [pendingCount, " Pending"]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] text-muted-foreground font-mono mt-2",
					children: "Awaiting calendar block confirmation"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-white/10 dark:border-white/5 bg-gradient-to-b from-card to-card/50 p-5 shadow-xs flex flex-col justify-between min-h-[110px] hover:shadow-md transition-all duration-300",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between items-center mb-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-bold text-muted-foreground uppercase tracking-widest",
						children: "Channels Sync State"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "h-3.5 w-3.5 text-mint" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: ["text-2xl font-extrabold tracking-tight", slackStatus === "online" || emailStatus === "online" || calendarStatus === "online" ? "text-mint" : "text-rose-500"].join(" "),
					children: slackStatus === "online" || emailStatus === "online" || calendarStatus === "online" ? "Active Connection" : "Offline"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] text-muted-foreground font-mono mt-2",
					children: getOnlineSourcesText()
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-white/10 dark:border-white/5 bg-gradient-to-b from-card to-card/50 p-5 shadow-xs flex flex-col justify-between min-h-[110px] hover:shadow-md transition-all duration-300",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between items-center mb-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-bold text-muted-foreground uppercase tracking-widest",
						children: "AI Swarm Engine"
					}), swarmStatus === "online" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, { className: "h-3.5 w-3.5 text-indigo-500" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "h-3.5 w-3.5 text-rose-500" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: ["text-2xl font-extrabold tracking-tight", swarmStatus === "online" ? "text-indigo-500" : "text-rose-500"].join(" "),
					children: swarmStatus === "online" ? "Active" : "Swarm Offline"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] text-muted-foreground font-mono mt-2",
					children: swarmStatus === "online" ? "Swarm resolving threshold at 90% cert" : "Swarm offline, using simulation fallbacks"
				})]
			})
		]
	});
}
function AgentDebateModal({ debateId, message, onClose }) {
	const [transcript, setTranscript] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [sourceMode, setSourceMode] = (0, import_react.useState)("seed");
	(0, import_react.useEffect)(() => {
		const seedDebate = initialDebates.find((d) => d.id === debateId);
		if (seedDebate) {
			setTranscript(seedDebate.transcript);
			setSourceMode("seed");
			return;
		}
		const fetchLiveTranscript = async () => {
			setLoading(true);
			try {
				const data = await getDebugTranscript();
				const targetRequestId = message?.message_id || debateId.replace(/^deb_/, "");
				if (data && data.request_id === targetRequestId && data.messages) {
					setTranscript(data.messages.map((m) => {
						const agentInfo = mapSenderToAgent(m.sender);
						return {
							agent: agentInfo.name,
							avatar: agentInfo.avatar,
							opinion: m.type === "consensus" ? "Secured consensus alignment." : m.reasoning,
							status: mapTypeToStatus(m.type),
							reason: m.recommendations && m.recommendations.length > 0 ? m.recommendations.join("; ") : m.reasoning
						};
					}));
					setSourceMode("live");
					setLoading(false);
					return;
				}
			} catch (e) {
				if (!(e instanceof ApiError && e.status === 404)) console.warn("Could not retrieve live debate transcript from backend, running fallback generator...", e);
			}
			if (message) {
				setTranscript(generateDynamicTranscript(message));
				setSourceMode("dynamic");
			} else {
				setTranscript([{
					agent: "Swarm Engine",
					avatar: "SE",
					opinion: "Debate details initialized.",
					status: "agreed",
					reason: "Orchestrated 4-agent consensus debate. Consolidated timeline successfully."
				}]);
				setSourceMode("dynamic");
			}
			setLoading(false);
		};
		fetchLiveTranscript();
	}, [debateId, message]);
	const mapSenderToAgent = (sender) => {
		switch (sender) {
			case "interceptor": return {
				name: "Interceptor Agent",
				avatar: "IA"
			};
			case "contextualizer": return {
				name: "Context Agent",
				avatar: "CA"
			};
			case "scheduler": return {
				name: "Scheduler Agent",
				avatar: "SA"
			};
			case "translator": return {
				name: "Translator Agent",
				avatar: "TA"
			};
			default: return {
				name: sender.charAt(0).toUpperCase() + sender.slice(1) + " Agent",
				avatar: sender.substring(0, 2).toUpperCase()
			};
		}
	};
	const mapTypeToStatus = (type) => {
		switch (type) {
			case "consensus": return "agreed";
			case "dissent":
			case "revision": return "countered";
			default: return "proposed";
		}
	};
	const generateDynamicTranscript = (msg) => {
		const steps = [];
		steps.push({
			agent: "Interceptor Agent",
			avatar: "IA",
			opinion: `Ingested raw signal from ${msg.sender_name} via ${msg.source.toUpperCase()}.`,
			status: "proposed",
			reason: `Analyzed message intent and initial parameters. Estimated raw urgency as ${msg.importance.toUpperCase()} with ${msg.ambiguity} ambiguity level.`
		});
		let resolvedText = "";
		if (msg.translated_bullet_points.steps.length > 0) resolvedText = ` Resolved terms to target: ${msg.translated_bullet_points.steps.join(", ")}.`;
		steps.push({
			agent: "Context Agent",
			avatar: "CA",
			opinion: `Queried memory service database.`,
			status: msg.importance === "high" ? "countered" : "proposed",
			reason: `Located historical context and preferences for user. Decoded intent: ${msg.reasoning}.${resolvedText}`
		});
		steps.push({
			agent: "Scheduler Agent",
			avatar: "SA",
			opinion: `Analyzed timeline blocks and availability constraints.`,
			status: "proposed",
			reason: `Proposed time slot ${msg.suggested_start_time} - ${msg.suggested_end_time} (${msg.translated_bullet_points.expected_duration}) protecting deep focus windows.`
		});
		steps.push({
			agent: "Translator Agent",
			avatar: "TA",
			opinion: `Formulated actionable task translation: "${msg.translated_bullet_points.action}".`,
			status: "agreed",
			reason: `Aligned briefing format with user formatting preferences. Swarm consensus secured.`
		});
		return steps;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-fade-in",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-scale-in",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-b border-border/70 px-6 py-4.5 bg-secondary/20",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-9 w-9 items-center justify-center rounded-xl bg-mint-soft text-mint",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scale, { className: "h-4.5 w-4.5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-bold text-foreground tracking-tight",
							children: "Swarm Consensus Timeline"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[10px] text-muted-foreground font-mono",
							children: [
								"Source:",
								" ",
								sourceMode === "live" ? "Live Swarm" : sourceMode === "seed" ? "Mock Session" : "Dynamic Reconstruction",
								" ",
								"· ID: ",
								debateId
							]
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "rounded-xl border border-border bg-card p-2 text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all duration-200",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-h-[60vh] overflow-y-auto p-6 space-y-6 scrollbar-calm",
					children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-mint" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-medium",
							children: "Fetching swarm timeline..."
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-secondary/30 p-4 border border-border/50 text-xs leading-relaxed text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-foreground",
							children: "Consensus Objective:"
						}), " Swarm debating timing and structure optimization to prevent client friction and cognitive overload."]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative pl-6 space-y-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-[31px] top-2 bottom-2 w-0.5 bg-border/60" }), transcript.map((step, idx) => {
							step.status;
							const isCountered = step.status === "countered";
							const isAgreed = step.status === "agreed";
							let badgeColor = "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400";
							let badgeText = "Proposed";
							if (isCountered) {
								badgeColor = "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400";
								badgeText = "Refined / Countered";
							} else if (isAgreed) {
								badgeColor = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400";
								badgeText = "Aligned";
							}
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative flex items-start gap-4 animate-slide-up",
								style: { animationDelay: `${idx * 100}ms` },
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "relative z-10 flex h-8 w-8 items-center justify-center rounded-xl bg-secondary border border-border/80 text-[10px] font-bold text-foreground shrink-0 shadow-xs",
									children: step.avatar
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 rounded-2xl border border-border bg-card/70 p-4 shadow-2xs",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between gap-2 flex-wrap",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-xs font-semibold text-foreground",
													children: step.agent
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] text-muted-foreground font-mono",
													children: "Agent"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: ["px-2 py-0.5 rounded-full text-[9px] font-mono font-medium", badgeColor].join(" "),
												children: badgeText
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-xs font-medium text-foreground/90",
											children: step.opinion
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1.5 text-xs text-muted-foreground leading-relaxed",
											children: step.reason
										})
									]
								})]
							}, idx);
						})]
					})] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-t border-border/70 px-6 py-4 bg-secondary/10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-xs text-emerald-500 font-semibold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-4.5 w-4.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Swarm core consensus secured (94% confidence)" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "text-xs font-semibold px-4 py-2 bg-foreground text-background rounded-xl hover:opacity-90 transition-opacity",
						children: "Acknowledge Decision"
					})]
				})
			]
		})
	});
}
function InboxPage() {
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [selectedMessageId, setSelectedMessageId] = (0, import_react.useState)("");
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const [sourceFilter, setSourceFilter] = (0, import_react.useState)("all");
	const [isSyncing, setIsSyncing] = (0, import_react.useState)(false);
	const [selectedDebateId, setSelectedDebateId] = (0, import_react.useState)(null);
	const fetchMessages = async () => {
		try {
			const { data } = await supabase.from("messages").select("*").order("timestamp", { ascending: false });
			const mappedMsgs = (data ?? []).map((m) => ({
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
					steps: m.steps || []
				},
				suggested_start_time: m.suggested_start_time,
				suggested_end_time: m.suggested_end_time,
				fidelity_rating: m.fidelity_rating || 3,
				acknowledged: m.acknowledged,
				reasoning: m.reasoning,
				debate_id: m.debate_id
			}));
			const display = mappedMsgs.length > 0 ? mappedMsgs : initialMessages;
			setMessages(display);
			if (!selectedMessageId) setSelectedMessageId(display[0]?.message_id ?? "");
		} catch (error) {
			console.error("Error fetching inbox from Supabase: ", error);
		}
	};
	(0, import_react.useEffect)(() => {
		fetchMessages();
		const channel = supabase.channel("inbox_realtime_sync").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "messages"
		}, () => {
			fetchMessages();
		}).subscribe();
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
	const handleAcknowledge = async (id) => {
		try {
			await supabase.from("messages").update({ acknowledged: true }).eq("message_id", id);
			setMessages((prev) => prev.map((m) => m.message_id === id ? {
				...m,
				acknowledged: true
			} : m));
		} catch (error) {
			console.error("Failed to acknowledge message:", error);
		}
	};
	const handleEscalate = async (id) => {
		try {
			await supabase.from("messages").update({ importance: "high" }).eq("message_id", id);
			setMessages((prev) => prev.map((m) => m.message_id === id ? {
				...m,
				importance: "high"
			} : m));
		} catch (error) {
			console.error("Failed to escalate message:", error);
		}
	};
	const handleDismiss = async (id) => {
		try {
			await supabase.from("messages").update({ acknowledged: true }).eq("message_id", id);
			setMessages((prev) => prev.filter((m) => m.message_id !== id));
			if (selectedMessageId === id) setSelectedMessageId("");
		} catch (error) {
			console.error("Failed to dismiss message:", error);
		}
	};
	const getSourceIcon = (source) => {
		switch (source) {
			case "slack": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-4 w-4 text-emerald-500" });
			case "email": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-4 w-4 text-indigo-500" });
			case "jira": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "h-4 w-4 text-blue-500" });
			case "teams": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-4 w-4 text-sky-500" });
			default: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-4 w-4" });
		}
	};
	const filteredMessages = messages.filter((m) => {
		const matchesSearch = m.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) || m.original_text.toLowerCase().includes(searchQuery.toLowerCase()) || m.translated_bullet_points.action.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesSource = sourceFilter === "all" || m.source === sourceFilter;
		return matchesSearch && matchesSource;
	});
	const selectedMessage = messages.find((m) => m.message_id === selectedMessageId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1400px] px-6 pt-8 pb-28 animate-fade-in select-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-8 flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-mono tracking-widest text-muted-foreground uppercase",
						children: "Triage Stream"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl",
						children: "Communication Inbox"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "View the raw background messages currently intercepted and aligned by the AI consensus layer."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: triggerGlobalSync,
					disabled: isSyncing,
					className: "inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-secondary/40 text-xs font-semibold px-4 py-2.5 transition-all text-foreground cursor-pointer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: ["h-4.5 w-4.5 text-muted-foreground", isSyncing ? "animate-spin text-mint" : ""].join(" ") }), "Sync All Channels"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SourceHealthCards, { pendingCount: messages.filter((m) => !m.acknowledged).length }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 lg:grid-cols-10 gap-8 items-start",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-4 flex flex-col gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden group",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -inset-px bg-gradient-to-r from-mint/10 to-lavender/10 rounded-2xl opacity-70 blur-xs transition-opacity group-hover:opacity-100 pointer-events-none" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative z-10",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "Search sender, message, actions...",
									value: searchQuery,
									onChange: (e) => setSearchQuery(e.target.value),
									className: "w-full text-xs rounded-xl border border-border bg-secondary/35 text-foreground pl-9 pr-4 py-3 outline-hidden focus:border-mint focus:ring-1 focus:ring-mint/30 focus:shadow-[0_0_12px_oklch(0.82_0.16_168_/_20%)] transition-all duration-200"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-1.5 overflow-x-auto py-1 relative z-10",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setSourceFilter("all"),
										className: ["px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer", sourceFilter === "all" ? "bg-foreground text-background dark:bg-white dark:text-black border-transparent shadow-[0_0_10px_rgba(255,255,255,0.15)]" : "bg-transparent border-border text-muted-foreground hover:bg-secondary/50"].join(" "),
										children: "All"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setSourceFilter("slack"),
										className: ["px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1", sourceFilter === "slack" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/35 shadow-[0_0_10px_oklch(0.78_0.18_145_/_15%)]" : "bg-transparent border-border text-muted-foreground hover:bg-secondary/50"].join(" "),
										children: "Slack"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setSourceFilter("email"),
										className: ["px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1", sourceFilter === "email" ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/35 shadow-[0_0_10px_oklch(0.72_0.22_290_/_15%)]" : "bg-transparent border-border text-muted-foreground hover:bg-secondary/50"].join(" "),
										children: "Email"
									})
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "border border-border rounded-2xl overflow-hidden divide-y divide-border/60 bg-card max-h-[600px] overflow-y-auto",
						children: filteredMessages.length > 0 ? filteredMessages.map((m) => {
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								onClick: () => setSelectedMessageId(m.message_id),
								className: ["p-4 flex flex-col gap-2.5 cursor-pointer relative select-none neon-card-hover border-b border-border/40", m.message_id === selectedMessageId ? "bg-secondary/60 border-l-4 border-lavender shadow-[0_0_15px_oklch(0.72_0.22_290_/_15%)]" : "hover:bg-secondary/25"].join(" "),
								children: [
									!m.acknowledged && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-4 right-4 h-2 w-2 rounded-full bg-indigo-500 shrink-0" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex h-7 w-7 items-center justify-center rounded-lg bg-secondary shrink-0",
												children: getSourceIcon(m.source)
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-xs font-bold text-foreground block truncate",
													children: m.sender_name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[9px] text-muted-foreground font-mono truncate block",
													children: m.sender_role || "External Contact"
												})]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px] text-muted-foreground font-mono shrink-0",
											children: m.timestamp
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground font-mono line-clamp-2 leading-relaxed",
										children: [
											"\"",
											m.original_text,
											"\""
										]
									}),
									m.translation_status === "processing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] font-bold text-indigo-500 font-mono flex items-center gap-1 animate-pulse",
										children: "🔄 Swarm debating consensus..."
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[10px] font-bold text-foreground leading-snug line-clamp-1",
										children: ["🎯 ", m.translated_bullet_points.action]
									})
								]
							}, m.message_id);
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-8 text-center text-muted-foreground text-xs font-semibold",
							children: "No matching messages found in triage stream."
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "lg:col-span-6 bg-card border border-border rounded-2xl p-6 shadow-xs min-h-[500px]",
					children: selectedMessage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageDetailPanel, {
						message: selectedMessage,
						onAcknowledge: handleAcknowledge,
						onOpenDebate: (debateId) => setSelectedDebateId(debateId),
						onEscalate: handleEscalate,
						onDismiss: handleDismiss
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center justify-center text-center gap-4 py-24 select-none",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inbox, { className: "h-6 w-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-bold text-foreground",
							children: "No Message Selected"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground mt-1 max-w-xs",
							children: "Select an incoming signal from the triage stream to view decoded briefs, inspect swarm debates, and draft replies."
						})] })]
					})
				})]
			}),
			selectedDebateId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgentDebateModal, {
				debateId: selectedDebateId,
				message: messages.find((m) => m.debate_id === selectedDebateId || `deb_${m.message_id}` === selectedDebateId),
				onClose: () => setSelectedDebateId(null)
			})
		]
	});
}
//#endregion
export { InboxPage as component };
