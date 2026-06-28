import { i as __toESM } from "../_runtime.mjs";
import { d as rescheduleBlock, f as saveDailyNotes, o as getDailyClarity } from "./api-CyqFAnVh.mjs";
import { n as require_jsx_runtime, r as require_react, t as c } from "../_libs/@lottiefiles/dotlottie-react+[...].mjs";
import { R as FileText, S as Notebook, W as Clock, X as CalendarDays, Y as Calendar, lt as Sparkles, mt as CircleAlert, pt as CircleCheck, st as TriangleAlert, ut as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as supabase } from "./supabase-gMqJtobQ.mjs";
import { n as useAuth } from "./AuthProvider-DtpAWP_D.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-BZwr-9VR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var getBlockStyles = (blockType) => {
	switch (blockType) {
		case "meeting": return {
			stripe: "bg-indigo-500",
			tag: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold"
		};
		case "deep_work": return {
			stripe: "bg-sky-500",
			tag: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/25 px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold"
		};
		case "shallow_work": return {
			stripe: "bg-amber-500",
			tag: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold"
		};
		case "free": return {
			stripe: "bg-emerald-500",
			tag: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold"
		};
		default: return {
			stripe: "bg-muted",
			tag: "bg-muted/10 text-muted-foreground border border-muted/20 px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold"
		};
	}
};
function DailyClarity() {
	const { user } = useAuth();
	const userId = user?.id || "mock_user";
	const [date, setDate] = (0, import_react.useState)(() => (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
	const [isLoading, setIsLoading] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined") return sessionStorage.getItem("calibrationLoaded") !== "true";
		return true;
	});
	const [loadingStep, setLoadingStep] = (0, import_react.useState)(0);
	const [data, setData] = (0, import_react.useState)(null);
	const [loadError, setLoadError] = (0, import_react.useState)(null);
	const [notes, setNotes] = (0, import_react.useState)("");
	const [saveStatus, setSaveStatus] = (0, import_react.useState)("idle");
	const [selectedEvent, setSelectedEvent] = (0, import_react.useState)(null);
	const loadingSteps = [
		"Initializing cognitive focus shell...",
		"Aligning multi-agent debate consensus...",
		"Verifying Google Calendar MCP bindings...",
		"Pre-calculating deep work focus windows..."
	];
	const loadClarityData = (0, import_react.useCallback)(async () => {
		setLoadError(null);
		try {
			const { data: { session } } = await supabase.auth.getSession();
			const res = await getDailyClarity(date, userId, session?.provider_token ?? (typeof window !== "undefined" ? sessionStorage.getItem("google_provider_token") : null) ?? void 0);
			setData(res);
			setNotes(res.notes || "");
			setSelectedEvent((current) => {
				if (current) {
					const matching = res.schedule_blocks.find((block) => block.id === current.id);
					if (matching) return matching;
				}
				return res.schedule_blocks.find((block) => block.block_type === "meeting") || res.schedule_blocks[0] || null;
			});
		} catch (err) {
			console.error("Failed to load daily clarity:", err);
			setLoadError("Daily Clarity could not load right now.");
		}
	}, [date, userId]);
	(0, import_react.useEffect)(() => {
		loadClarityData();
	}, [loadClarityData]);
	(0, import_react.useEffect)(() => {
		if (!isLoading) return;
		const stepInterval = setInterval(() => {
			setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
		}, 2500);
		const loadTimer = setTimeout(() => {
			setIsLoading(false);
			if (typeof window !== "undefined") sessionStorage.setItem("calibrationLoaded", "true");
		}, 1e4);
		return () => {
			clearInterval(stepInterval);
			clearTimeout(loadTimer);
		};
	}, [isLoading]);
	const handleSaveNotes = async () => {
		setSaveStatus("saving");
		try {
			await saveDailyNotes(userId, date, notes);
			setSaveStatus("saved");
			setTimeout(() => setSaveStatus("idle"), 2e3);
		} catch (err) {
			console.error("Failed to save notes:", err);
			setSaveStatus("error");
		}
	};
	const handleReschedule = async (blockId) => {
		try {
			const block = data?.schedule_blocks.find((b) => b.id === blockId);
			if (block) {
				const originalStart = new Date(block.start);
				const originalEnd = new Date(block.end);
				await rescheduleBlock(userId, blockId, new Date(originalStart.getTime() + 1800 * 1e3).toISOString(), new Date(originalEnd.getTime() + 1800 * 1e3).toISOString());
				loadClarityData();
			}
		} catch (err) {
			console.error("Reschedule failed:", err);
		}
	};
	const formatTime = (isoString) => {
		try {
			return new Date(isoString).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false
			});
		} catch {
			return isoString;
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col px-6 py-8 relative",
		children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 flex items-center justify-center p-6 border border-border/80 bg-card/65 backdrop-blur-md rounded-[2rem] shadow-xl relative overflow-hidden min-h-[500px] animate-scale-in select-none",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -left-1/4 -top-1/4 w-96 h-96 rounded-full bg-mint/10 blur-[120px] animate-pulse" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute -right-1/4 -bottom-1/4 w-96 h-96 rounded-full bg-lavender/10 blur-[120px] animate-pulse",
					style: { animationDelay: "1.5s" }
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative z-10 flex w-full max-w-5xl flex-col items-center text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative flex w-full min-h-[420px] items-center justify-center rounded-[2rem] border border-border/50 bg-gradient-to-br from-background/75 via-card/75 to-secondary/20 px-6 py-8 shadow-[0_0_40px_rgba(var(--color-border),0.16)] overflow-hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-10 inset-y-8 rounded-[1.75rem] border border-border/40 bg-[radial-gradient(circle_at_top,rgba(28,244,194,0.06),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "relative z-10 h-[min(76vw,560px)] w-[min(76vw,560px)]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(c, {
									src: "https://lottie.host/af715c09-b2c4-4c13-a08d-782831435e21/AdNwcE8RRC.lottie",
									autoplay: true,
									loop: true
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/5 px-3.5 py-1 text-[10px] font-mono uppercase tracking-wider text-mint shadow-[0_0_10px_oklch(0.82_0.16_168_/_15%)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3 w-3 animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Calibrating daily context" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-4 text-xs font-bold font-mono text-muted-foreground min-h-[1.5rem] tracking-wide animate-pulse",
							children: [
								"[ ",
								loadingSteps[loadingStep],
								" ]"
							]
						})
					]
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-6 animate-fade-in",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6 relative overflow-hidden group p-6 bg-card/45 backdrop-blur-md rounded-3xl border border-border/50",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -inset-px bg-gradient-to-r from-mint/5 to-lavender/5 rounded-3xl opacity-50 blur-xs" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-10",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-mint/10 text-mint border border-mint/20",
									children: "Daily Clarity Reset"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-mono text-muted-foreground",
									children: date
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
								className: "text-2xl font-extrabold text-foreground tracking-tight mt-2",
								children: [
									"Good morning, ",
									user?.email?.split("@")[0] || "Planner",
									"!"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground font-mono mt-1 max-w-2xl leading-relaxed",
								children: loadError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-rose-400",
									children: loadError
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["🎯 ", data?.summary] })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-10 flex flex-wrap gap-2 md:self-end",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "px-3 py-1.5 rounded-xl bg-secondary/60 border border-border/60 text-[10px] font-bold font-mono text-foreground flex items-center gap-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-3.5 w-3.5 text-lavender" }),
									" ",
									data?.stats.meetings,
									" Meetings"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "px-3 py-1.5 rounded-xl bg-secondary/60 border border-border/60 text-[10px] font-bold font-mono text-foreground flex items-center gap-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3.5 w-3.5 text-mint" }),
									" ",
									data?.stats.focusBlocks,
									" Focus Blocks"
								]
							}),
							data?.stats.conflicts && data.stats.conflicts > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold font-mono text-rose-500 flex items-center gap-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-3.5 w-3.5" }),
									" ",
									data.stats.conflicts,
									" Conflict"
								]
							}) : null
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 lg:grid-cols-10 gap-8 items-start",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "lg:col-span-6 flex flex-col gap-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-card/70 border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between border-b border-border/60 pb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "text-sm font-bold text-foreground flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "h-4.5 w-4.5 text-mint" }), " Today's Focus Schedule"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] font-mono text-muted-foreground uppercase",
								children: "09:00 - 18:00"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-col gap-3.5",
							children: data?.schedule_blocks?.map((block) => {
								block.block_type;
								const isSelected = selectedEvent?.id === block.id;
								const hasConflict = block.conflict_level === "medium" || block.conflict_level === "high";
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									onClick: () => setSelectedEvent(block),
									className: ["p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 relative", isSelected ? "bg-secondary/70 border-lavender shadow-[0_0_15px_oklch(0.78_0.18_290_/_10%)]" : "bg-background/40 border-border/50 hover:bg-secondary/35"].join(" "),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: ["w-1 h-full absolute left-0 top-0 rounded-l-2xl", getBlockStyles(block.block_type).stripe].join(" ") }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-[65px] font-mono text-xs font-semibold text-muted-foreground flex flex-col gap-0.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatTime(block.start) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[9px] opacity-75",
												children: formatTime(block.end)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1 min-w-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 flex-wrap",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
														className: "text-xs font-bold text-foreground truncate",
														children: block.title
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: getBlockStyles(block.block_type).tag,
														children: block.block_type.replace("_", " ")
													})]
												}),
												block.prep_required && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-2 text-[10px] text-amber-500 font-semibold flex items-center gap-1 sensory-detail",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3 w-3 animate-pulse" }), " Required prep checklist available"]
												}),
												hasConflict && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-2 text-[10px] text-rose-500 font-bold flex items-center gap-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-3 w-3" }), " Overload Warning: overlap detected"]
												})
											]
										}),
										block.can_reschedule && hasConflict && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: (e) => {
												e.stopPropagation();
												handleReschedule(block.id);
											},
											className: "px-2.5 py-1 rounded-lg border border-mint/20 hover:border-mint/50 bg-mint/5 hover:bg-mint/10 text-[9px] font-bold text-mint transition-all",
											children: "Reschedule"
										})
									]
								}, block.id);
							})
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "lg:col-span-4 flex flex-col gap-6",
					children: [
						selectedEvent && selectedEvent.block_type === "meeting" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-card/70 border border-border/50 rounded-3xl p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden group",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -inset-px bg-gradient-to-r from-lavender/5 to-transparent rounded-3xl pointer-events-none" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center justify-between border-b border-border/60 pb-2.5 relative z-10",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
										className: "text-xs font-bold text-foreground flex items-center gap-1.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4 text-lavender" }),
											" Meeting Insight: ",
											selectedEvent.title
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative z-10 flex flex-col gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[11px] leading-relaxed text-muted-foreground font-mono",
										children: [
											"\"",
											data?.meeting_insights[selectedEvent.id] || "No detailed insights found for this event.",
											"\""
										]
									}), selectedEvent.prep_required && selectedEvent.prep_notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px] font-bold text-amber-500 uppercase tracking-wider font-mono block",
											children: "Required Prep Checklist"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-[10px] text-foreground font-semibold mt-1",
											children: ["📝 ", selectedEvent.prep_notes]
										})]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-card/70 border border-border/50 rounded-3xl p-5 shadow-sm flex flex-col gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between border-b border-border/60 pb-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-xs font-bold text-foreground flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 text-mint" }), " Top Priorities"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px] font-mono text-muted-foreground",
									children: "TOP 3 TASKS"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-col gap-3",
								children: data?.top_priorities?.map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3 rounded-xl bg-background/35 border border-border/40 hover:border-border/80 transition-all flex flex-col gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between gap-2 flex-wrap",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10.5px] font-bold text-foreground line-clamp-1",
												children: task.title
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: ["px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase", task.importance === "high" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"].join(" "),
												children: task.importance
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[9.5px] text-muted-foreground font-mono line-clamp-2 leading-relaxed sensory-detail",
											children: task.why_important
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between mt-1 text-[9px] text-muted-foreground font-mono sensory-detail",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3 w-3" }),
													" ",
													task.expected_duration
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "px-2 py-0.5 rounded-full bg-secondary/80 text-foreground font-bold",
												children: task.status
											})]
										})
									]
								}, task.id))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-card/70 border border-border/50 rounded-3xl p-5 shadow-sm flex flex-col gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between border-b border-border/60 pb-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
										className: "text-xs font-bold text-foreground flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Notebook, { className: "h-4 w-4 text-lavender" }), " Notes & Parking Lot"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] font-mono text-muted-foreground",
										children: "MENTAL OFFLOAD"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									value: notes,
									onChange: (e) => setNotes(e.target.value),
									placeholder: "Capture quick thoughts, items to reschedule, questions to ask, or tasks that can wait...",
									className: "w-full min-h-[120px] p-3 text-xs bg-background/35 text-foreground rounded-xl border border-border/50 focus:border-lavender focus:ring-1 focus:ring-lavender/30 outline-hidden transition-all duration-200 resize-none font-mono placeholder:opacity-65"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mt-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[9px] text-muted-foreground font-mono",
										children: [
											saveStatus === "saving" && "Saving notes...",
											saveStatus === "saved" && "✅ Notes saved",
											saveStatus === "error" && "❌ Save failed"
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: handleSaveNotes,
										disabled: saveStatus === "saving",
										className: "px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-mint to-lavender hover:opacity-90 text-[10px] font-bold text-white shadow-xs hover:shadow-[0_0_12px_rgba(20,220,180,0.25)] transition-all cursor-pointer flex items-center gap-1",
										children: "Save Notes"
									})]
								})
							]
						})
					]
				})]
			})]
		})
	});
}
//#endregion
export { DailyClarity as component };
