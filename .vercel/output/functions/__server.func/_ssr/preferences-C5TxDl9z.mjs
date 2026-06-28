import { i as __toESM } from "../_runtime.mjs";
import { t as API_BASE_URL } from "./api-CyqFAnVh.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/@lottiefiles/dotlottie-react+[...].mjs";
import { J as Check, P as Info, b as RefreshCw, lt as Sparkles, nt as Bell, z as Eye } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/preferences-C5TxDl9z.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PreferencesPage() {
	const [style, setStyle] = (0, import_react.useState)("checklist");
	const [deadline, setDeadline] = (0, import_react.useState)("suggest");
	const [verbosity, setVerbosity] = (0, import_react.useState)("balanced");
	const [calendarMode, setCalendarMode] = (0, import_react.useState)("ask");
	const [neuroMode, setNeuroMode] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("neuroMode");
			return saved !== null ? saved === "true" : true;
		}
		return true;
	});
	const [animations, setAnimations] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("animations");
			return saved !== null ? saved === "true" : true;
		}
		return true;
	});
	const [sensoryDensity, setSensoryDensity] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("sensoryDensity");
			return saved !== null ? parseInt(saved, 10) : 40;
		}
		return 40;
	});
	(0, import_react.useEffect)(() => {
		localStorage.setItem("neuroMode", String(neuroMode));
		if (neuroMode) document.documentElement.classList.add("high-contrast");
		else document.documentElement.classList.remove("high-contrast");
	}, [neuroMode]);
	(0, import_react.useEffect)(() => {
		localStorage.setItem("animations", String(animations));
		if (animations) document.documentElement.classList.remove("no-animations");
		else document.documentElement.classList.add("no-animations");
	}, [animations]);
	(0, import_react.useEffect)(() => {
		localStorage.setItem("sensoryDensity", String(sensoryDensity));
		if (sensoryDensity <= 35) {
			document.documentElement.classList.add("sensory-low");
			document.documentElement.classList.remove("sensory-high");
		} else if (sensoryDensity >= 75) {
			document.documentElement.classList.add("sensory-high");
			document.documentElement.classList.remove("sensory-low");
		} else document.documentElement.classList.remove("sensory-low", "sensory-high");
	}, [sensoryDensity]);
	const [savedMessage, setSavedMessage] = (0, import_react.useState)(false);
	const [rawMessage, setRawMessage] = (0, import_react.useState)("Hey, can we quickly align on the roadmap sync whenever you get a chance? Might need to pivot some priorities soon.");
	const [previewOutput, setPreviewOutput] = (0, import_react.useState)("");
	const [isPreviewLoading, setIsPreviewLoading] = (0, import_react.useState)(false);
	const [isSimulated, setIsSimulated] = (0, import_react.useState)(false);
	const handlePreviewSynthesis = async () => {
		setIsPreviewLoading(true);
		setPreviewOutput("");
		try {
			const response = await fetch(`${API_BASE_URL}/api/v1/synthesis/preview`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: rawMessage,
					format: style,
					verbosity
				})
			});
			if (!response.ok) throw new Error("Failed to connect to Swarm synthesis api.");
			const data = await response.json();
			setPreviewOutput(data.synthesized_text);
			setIsSimulated(!!data.simulated);
		} catch (err) {
			setPreviewOutput(`Error: ${err.message || "Something went wrong during Swarm synthesis."}`);
			setIsSimulated(true);
		} finally {
			setIsPreviewLoading(false);
		}
	};
	const saveSettings = () => {
		setSavedMessage(true);
		setTimeout(() => setSavedMessage(false), 2e3);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1000px] px-6 pt-8 pb-28 animate-fade-in select-none",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mb-8 flex flex-wrap items-end justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[10px] font-mono tracking-widest text-muted-foreground uppercase",
					children: "Calibration Panel"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl",
					children: "Cognitive Preferences"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Adapt how agents structure notifications, estimate task parameters, and schedule periods of deep focus."
				})
			] }), savedMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-xs font-semibold text-mint bg-mint-soft/30 px-3.5 py-2 rounded-xl flex items-center gap-1.5 animate-scale-in",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), " Calibration bindings locked!"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border bg-card p-5 flex items-start gap-4 shadow-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-10 w-10 items-center justify-center rounded-xl bg-mint-soft shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-5 w-5 text-mint" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xs font-bold text-foreground",
						children: "Active Neuro-inclusive Calibration"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground leading-relaxed",
						children: "Workspace parameters are currently calibrated to match active ADHD & Neurodivergent focus profiles. High sensory noise filtering and automated scheduling breaks are active by default."
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 pb-2 border-b border-border/60",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xs font-bold text-foreground uppercase tracking-wider",
							children: "Sensory presentation"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 md:grid-cols-2 gap-6 items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-xs font-bold text-foreground",
									children: "High Contrast / Focus Palette"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] text-muted-foreground",
									children: "Swap colors out to maximize reader ease"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: neuroMode,
									onChange: (e) => setNeuroMode(e.target.checked),
									className: "rounded border-border text-mint focus:ring-mint"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-xs font-bold text-foreground",
									children: "Smooth transitions & animations"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] text-muted-foreground",
									children: "Enable calming keyframe motion filters"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: animations,
									onChange: (e) => setAnimations(e.target.checked),
									className: "rounded border-border text-mint focus:ring-mint"
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-[11px] font-medium text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sensory Density Level" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-semibold text-foreground font-mono",
										children: [sensoryDensity, "%"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "range",
									min: "10",
									max: "100",
									value: sensoryDensity,
									onChange: (e) => setSensoryDensity(parseInt(e.target.value)),
									className: "w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-mint"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-[9px] text-muted-foreground font-mono",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Minimalist (Low Load)" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Standard" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Hyper-granular Details" })
									]
								})
							]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 md:grid-cols-2 gap-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 pb-2 border-b border-border/60",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-xs font-bold text-foreground uppercase tracking-wider",
									children: "Translation synthesis"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-semibold text-foreground/80 block",
									children: "Preferred Output Structure"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-2 gap-2",
									children: [
										{
											id: "checklist",
											label: "Checklist (Detailed)"
										},
										{
											id: "summary",
											label: "Executive Summary"
										},
										{
											id: "bullets",
											label: "Bullet points"
										},
										{
											id: "paragraph",
											label: "Paragraph format"
										}
									].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setStyle(item.id),
										className: ["p-3 rounded-xl border text-[11px] font-semibold text-left transition-all duration-200", style === item.id ? "border-mint bg-mint-soft/30 text-foreground" : "border-border hover:bg-secondary/40 text-muted-foreground"].join(" "),
										children: item.label
									}, item.id))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3 pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-semibold text-foreground/80 block",
									children: "Agent Verbosity Level"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex gap-2 p-1 bg-secondary/50 rounded-xl border border-border/50",
									children: [
										{
											id: "minimal",
											label: "Minimal"
										},
										{
											id: "balanced",
											label: "Balanced"
										},
										{
											id: "detailed",
											label: "Detailed"
										}
									].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setVerbosity(item.id),
										className: ["flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all text-center", verbosity === item.id ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"].join(" "),
										children: item.label
									}, item.id))
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 pb-2 border-b border-border/60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-xs font-bold text-foreground uppercase tracking-wider",
								children: "Calendar schedule patterns"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-semibold text-foreground/80 block",
								children: "Dynamic scheduling options"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-col gap-2.5",
								children: [
									{
										id: "auto",
										label: "Auto Schedule directly on Calendar",
										desc: "Let Scheduler Agent book confirmed items without confirmation."
									},
									{
										id: "ask",
										label: "Ask first (Confirmation draft block)",
										desc: "Draw draft boxes first, book only when user confirms."
									},
									{
										id: "never",
										label: "Never Schedule automatically",
										desc: "Disable calendar routing entirely."
									}
								].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									onClick: () => setCalendarMode(item.id),
									className: ["p-3 rounded-xl border cursor-pointer transition-all duration-200", calendarMode === item.id ? "border-mint bg-mint-soft/20 text-foreground" : "border-border hover:bg-secondary/40 text-muted-foreground"].join(" "),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] font-bold text-foreground",
										children: item.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] text-muted-foreground mt-0.5",
										children: item.desc
									})]
								}, item.id))
							})]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6 relative overflow-hidden group",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -inset-px bg-gradient-to-r from-mint/5 to-lavender/5 rounded-2xl opacity-60 pointer-events-none" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 pb-2 border-b border-border/60 relative z-10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4.5 w-4.5 text-mint animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-xs font-bold text-foreground uppercase tracking-wider",
								children: "Swarm Translation Sandbox"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "lg:col-span-5 flex flex-col gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-xs font-semibold text-foreground/80 block",
										children: "Vague Corporate Signal Input"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: rawMessage,
										onChange: (e) => setRawMessage(e.target.value),
										placeholder: "Type a vague Slack or email message here to test...",
										className: "w-full text-xs font-mono rounded-xl border border-border bg-secondary/30 text-foreground p-3.5 outline-hidden focus:border-mint focus:ring-1 focus:ring-mint/20 min-h-[140px] resize-y leading-relaxed transition-all duration-200"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: handlePreviewSynthesis,
										disabled: isPreviewLoading || !rawMessage.trim(),
										className: ["w-full py-3 rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-all duration-200 text-center flex items-center justify-center gap-2", isPreviewLoading ? "bg-secondary text-muted-foreground border border-border" : "bg-lavender/10 text-lavender border border-lavender/20 hover:bg-lavender/15"].join(" "),
										children: isPreviewLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3.5 w-3.5 animate-spin" }), " Synthesizing via Swarm..."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3.5 w-3.5" }), " Synthesize Preview Output"] })
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "lg:col-span-7 flex flex-col gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between items-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-xs font-semibold text-foreground/80 block",
										children: "Swarm Cognition Preview"
									}), isSimulated && previewOutput && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/15 animate-pulse",
										children: "⚠️ Simulated Fallback"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative rounded-xl border border-border bg-secondary/20 p-4 min-h-[185px] flex flex-col justify-between overflow-hidden",
									children: [
										isPreviewLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "absolute inset-0 bg-card/65 backdrop-blur-xs flex flex-col items-center justify-center gap-2 animate-in fade-in duration-200",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-7 w-7 rounded-full border-2 border-mint border-t-transparent animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] font-mono text-muted-foreground animate-pulse",
												children: "Debating consensus..."
											})]
										}),
										previewOutput ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap select-text selection:bg-mint/20",
											children: previewOutput
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col items-center justify-center text-center text-muted-foreground min-h-[150px]",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-7 w-7 text-muted-foreground/30 mb-2" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs font-semibold",
													children: "Your synthesized preview will appear here."
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] mt-1 text-muted-foreground/72 max-w-sm",
													children: "Select your preferred format (e.g., Checklist or Bullet points) and click \"Synthesize Preview\" to watch the swarm process it."
												})
											]
										}),
										isSimulated && previewOutput && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-4 pt-3 border-t border-border/50 text-[9px] text-amber-500 leading-normal flex items-start gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "⚠️" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
												"Google Gemini API Key is not configured. Real Swarm preview is unavailable. To connect your Gemini key, configure ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "GOOGLE_API_KEY" }),
												" in ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "backend/.env" }),
												"."
											] })]
										})
									]
								})]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-end pt-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: saveSettings,
						className: "px-6 py-3 rounded-xl bg-foreground text-background font-bold text-xs hover:opacity-90 transition-opacity shadow-md",
						children: "Save preferences"
					})
				})
			]
		})]
	});
}
//#endregion
export { PreferencesPage as component };
