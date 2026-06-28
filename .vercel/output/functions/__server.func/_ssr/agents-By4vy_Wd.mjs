import { i as __toESM } from "../_runtime.mjs";
import { c as getDebugTranscript, l as getRuntimeSnapshot, n as ApiError, r as checkHealth, s as getDebugMetrics } from "./api-CyqFAnVh.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/@lottiefiles/dotlottie-react+[...].mjs";
import { n as getAgentLatency$1, r as getAgentStatusTone$1 } from "./agents-CRN906-Z.mjs";
import { $ as BrainCircuit, H as Cpu, V as Database, b as RefreshCw, et as Bot, h as ShieldAlert, lt as Sparkles, n as X, ot as Activity, r as Waypoints } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agents-By4vy_Wd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var agentConfigs = {
	interceptor: {
		bgClass: "bg-gradient-to-br from-cyan-400 to-blue-600 text-white",
		glowClass: "glow-cyan",
		icon: Cpu,
		anchors: {
			desktop: {
				left: "24%",
				top: "24%"
			},
			mobile: {
				left: "20%",
				top: "20%"
			}
		}
	},
	contextualizer: {
		bgClass: "bg-gradient-to-br from-indigo-400 to-purple-600 text-white",
		glowClass: "glow-indigo",
		icon: BrainCircuit,
		anchors: {
			desktop: {
				left: "76%",
				top: "24%"
			},
			mobile: {
				left: "80%",
				top: "20%"
			}
		}
	},
	scheduler: {
		bgClass: "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
		glowClass: "glow-amber",
		icon: Waypoints,
		anchors: {
			desktop: {
				left: "24%",
				top: "76%"
			},
			mobile: {
				left: "20%",
				top: "80%"
			}
		}
	},
	translator: {
		bgClass: "bg-gradient-to-br from-pink-400 to-rose-500 text-white",
		glowClass: "glow-rose",
		icon: Sparkles,
		anchors: {
			desktop: {
				left: "76%",
				top: "76%"
			},
			mobile: {
				left: "80%",
				top: "80%"
			}
		}
	}
};
var fallbackConfigs = [
	{
		bgClass: "bg-gradient-to-br from-cyan-400 to-blue-600 text-white",
		glowClass: "glow-cyan",
		icon: Cpu,
		anchors: {
			desktop: {
				left: "24%",
				top: "24%"
			},
			mobile: {
				left: "20%",
				top: "20%"
			}
		}
	},
	{
		bgClass: "bg-gradient-to-br from-indigo-400 to-purple-600 text-white",
		glowClass: "glow-indigo",
		icon: BrainCircuit,
		anchors: {
			desktop: {
				left: "76%",
				top: "24%"
			},
			mobile: {
				left: "80%",
				top: "20%"
			}
		}
	},
	{
		bgClass: "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
		glowClass: "glow-amber",
		icon: Waypoints,
		anchors: {
			desktop: {
				left: "24%",
				top: "76%"
			},
			mobile: {
				left: "20%",
				top: "80%"
			}
		}
	},
	{
		bgClass: "bg-gradient-to-br from-pink-400 to-rose-500 text-white",
		glowClass: "glow-rose",
		icon: Sparkles,
		anchors: {
			desktop: {
				left: "76%",
				top: "76%"
			},
			mobile: {
				left: "80%",
				top: "80%"
			}
		}
	}
];
function InteractiveSwarm({ agents, health, transcript }) {
	const [activeAgentId, setActiveAgentId] = (0, import_react.useState)(null);
	const [isMobile, setIsMobile] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);
	(0, import_react.useEffect)(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape") setActiveAgentId(null);
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);
	const handleBallClick = (agentId) => {
		if (activeAgentId === agentId) return;
		setActiveAgentId(agentId);
	};
	const handleClose = (e) => {
		e.stopPropagation();
		setActiveAgentId(null);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-[580px] w-full items-center justify-center overflow-hidden rounded-3xl border border-border bg-card/45 p-4 md:min-h-[640px]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				onClick: handleClose,
				className: ["absolute inset-0 bg-background/70 backdrop-blur-md transition-all duration-500 ease-in-out z-40", activeAgentId ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"].join(" ")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: ["relative flex flex-col items-center justify-center transition-all duration-500 ease-in-out z-10 select-none pointer-events-none", activeAgentId ? "opacity-0 scale-75 blur-sm" : "opacity-100 scale-100"].join(" "),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "animate-levitate",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
						src: "https://lottie.host/embed/9dd28675-4fa2-451b-9b06-1772a236d6aa/9nnbU7eg6R.lottie",
						style: {
							width: isMobile ? "200px" : "280px",
							height: isMobile ? "200px" : "280px",
							border: "none"
						},
						title: "AI Robot Lottie Animation"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-full bg-foreground/15 blur-[5px] animate-shadow-pulse dark:bg-foreground/5",
					style: {
						width: isMobile ? "75px" : "110px",
						height: isMobile ? "6px" : "8px",
						marginTop: isMobile ? "-10px" : "-15px"
					}
				})]
			}),
			agents.map((agent, index) => {
				const config = agentConfigs[agent.id] ?? fallbackConfigs[index % 4];
				const isExpanded = activeAgentId === agent.id;
				const isAnyExpanded = activeAgentId !== null;
				const tone = getAgentStatusTone$1(agent, health, transcript);
				const lastLatency = getAgentLatency$1(agent.id, transcript);
				const anchor = isMobile ? config.anchors.mobile : config.anchors.desktop;
				const IconComponent = config.icon;
				let style = {};
				if (isExpanded) style = {
					left: "50%",
					top: "50%",
					transform: "translate(-50%, -50%)",
					width: isMobile ? "94%" : "540px",
					height: isMobile ? "90%" : "auto",
					maxHeight: isMobile ? "90%" : "550px",
					borderRadius: "24px",
					zIndex: 50
				};
				else if (isAnyExpanded) style = {
					left: anchor.left,
					top: anchor.top,
					transform: "translate(-50%, -50%) scale(0.6)",
					width: isMobile ? "90px" : "130px",
					height: isMobile ? "90px" : "130px",
					borderRadius: "9999px",
					opacity: 0,
					pointerEvents: "none",
					zIndex: 0
				};
				else style = {
					left: anchor.left,
					top: anchor.top,
					transform: "translate(-50%, -50%)",
					width: isMobile ? "95px" : "135px",
					height: isMobile ? "95px" : "135px",
					borderRadius: "9999px",
					zIndex: 30,
					opacity: 1,
					cursor: "pointer"
				};
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					onClick: () => handleBallClick(agent.id),
					style,
					className: ["absolute flex flex-col items-center justify-center transition-all duration-500 ease-out overflow-hidden", isExpanded ? "bg-card border border-border shadow-2xl cursor-default" : `${config.bgClass} ${config.glowClass} hover:scale-108 hover:brightness-105 active:scale-95`].join(" "),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: ["absolute flex flex-col items-center justify-center p-3 text-center transition-opacity duration-300 w-full h-full select-none", isExpanded ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"].join(" "),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconComponent, { className: isMobile ? "h-6 w-6 mb-1.5" : "h-9 w-9 mb-2" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold text-[10px] uppercase tracking-wider line-clamp-1",
								children: agent.display_name.split(" ")[0]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[9px] opacity-80 mt-0.5 line-clamp-1",
								children: agent.role.split(" ")[0]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "absolute bottom-2.5 flex h-2 w-2 items-center justify-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: ["absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping", tone.dotClass].join(" ") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: ["relative inline-flex rounded-full h-1.5 w-1.5", tone.dotClass].join(" ") })]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: ["w-full h-full flex flex-col text-foreground transition-opacity duration-300 overflow-hidden", isExpanded ? "opacity-100 pointer-events-auto delay-150" : "opacity-0 pointer-events-none"].join(" "),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between border-b border-border bg-muted/20 px-6 py-4.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-lg font-bold tracking-tight text-foreground",
								children: agent.display_name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground",
								children: agent.role
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: ["inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", tone.badgeClass].join(" "),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: ["h-1.5 w-1.5 rounded-full", tone.dotClass].join(" ") }), tone.label]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: handleClose,
									className: "rounded-lg p-1.5 text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4.5 w-4.5" })
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 overflow-y-auto px-6 py-5 space-y-5 expanded-card-scroll",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 gap-3.5 sm:grid-cols-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpandedField, {
											label: "Primary runtime",
											value: agent.primary_runtime
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpandedField, {
											label: "LLM backend",
											value: agent.llm_backend
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpandedField, {
											label: "Dependency",
											value: agent.dependency
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpandedField, {
											label: "Last stage latency",
											value: lastLatency ? `${lastLatency}ms` : "No run yet"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl border border-border/70 bg-secondary/10 p-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground",
										children: "Fallback lane"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-2.5 flex flex-wrap gap-1.5",
										children: agent.fallback_chain.length ? agent.fallback_chain.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded-full border border-border/60 bg-card px-2.5 py-0.5 text-[11px] text-foreground font-medium",
											children: item
										}, item)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] text-muted-foreground",
											children: "No fallback chain configured."
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 gap-4 sm:grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground",
										children: "Expertise"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-2.5 flex flex-wrap gap-1.5",
										children: agent.expertise.slice(0, 3).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded-full bg-mint/10 border border-mint/20 px-2.5 py-0.5 text-[11px] text-foreground font-medium",
											children: item
										}, item))
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground",
											children: "Constraint"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-xs leading-relaxed text-muted-foreground",
											children: agent.limitations[0] ?? "No limitation declared."
										}),
										typeof agent.confidence_baseline === "number" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-2 text-[11px] font-mono text-foreground font-semibold",
											children: [
												"Baseline confidence ",
												Math.round(agent.confidence_baseline * 100),
												"%"
											]
										})
									] })]
								})
							]
						})]
					})]
				}, agent.id);
			})
		]
	});
}
function ExpandedField({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border/70 bg-secondary/10 p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1.5 text-xs font-semibold text-foreground",
			children: value
		})]
	});
}
var dependencyLabels = {
	memory_service: "Memory Service",
	calendar_mcp: "Calendar MCP",
	gemini: "Gemini",
	google_adk: "Google ADK",
	lyzr: "Lyzr"
};
function AgentSwarm() {
	const [runtime, setRuntime] = (0, import_react.useState)(null);
	const [health, setHealth] = (0, import_react.useState)(null);
	const [metrics, setMetrics] = (0, import_react.useState)(null);
	const [transcript, setTranscript] = (0, import_react.useState)(null);
	const [isRefreshing, setIsRefreshing] = (0, import_react.useState)(false);
	const [lastUpdated, setLastUpdated] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let disposed = false;
		const load = async (manual = false) => {
			if (manual) setIsRefreshing(true);
			const [runtimeResult, healthResult, metricsResult, transcriptResult] = await Promise.allSettled([
				getRuntimeSnapshot(),
				checkHealth(),
				getDebugMetrics(),
				getDebugTranscript()
			]);
			if (disposed) return;
			setError(runtimeResult.status === "rejected" ? getErrorMessage(runtimeResult.reason, "Runtime snapshot is unavailable.") : healthResult.status === "rejected" ? getErrorMessage(healthResult.reason, "Health status is unavailable.") : metricsResult.status === "rejected" ? getErrorMessage(metricsResult.reason, "Metrics are unavailable.") : null);
			if (runtimeResult.status === "fulfilled") setRuntime(runtimeResult.value);
			if (healthResult.status === "fulfilled") setHealth(healthResult.value);
			if (metricsResult.status === "fulfilled") setMetrics(metricsResult.value);
			if (transcriptResult.status === "fulfilled") setTranscript(transcriptResult.value);
			else if (transcriptResult.reason?.status === 404) setTranscript(null);
			setLastUpdated(/* @__PURE__ */ new Date());
			if (manual) setIsRefreshing(false);
		};
		load();
		const interval = window.setInterval(() => {
			load();
		}, 2e4);
		return () => {
			disposed = true;
			window.clearInterval(interval);
		};
	}, []);
	const dependencyEntries = Object.entries(health?.dependencies ?? {});
	const healthyDependencyCount = dependencyEntries.filter(([, status]) => [
		"ok",
		"configured",
		"available"
	].includes(status)).length;
	const stageEntries = Object.entries(transcript?.stage_latencies ?? {}).filter(([name]) => name !== "total");
	const maxStageLatency = Math.max(...stageEntries.map(([, value]) => value), 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1440px] px-6 pt-8 pb-28 animate-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-8 flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-3xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/8 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.28em] text-amber-600 dark:text-amber-300",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "h-3.5 w-3.5" }), "Internal Runtime Surface"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl",
							children: "Agent Network Core"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted-foreground",
							children: "This page is now wired to the real swarm runtime. It is best kept as an internal or developer-facing surface because it exposes orchestration details, fallback posture, and backend dependencies that most end users do not need day to day."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => void refreshSwarmState(setIsRefreshing, setError, setRuntime, setHealth, setMetrics, setTranscript, setLastUpdated),
						disabled: isRefreshing,
						className: "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary/40 disabled:cursor-not-allowed disabled:opacity-70",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: ["h-4 w-4 text-muted-foreground", isRefreshing ? "animate-spin text-mint" : ""].join(" ") }), "Refresh Runtime"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-muted-foreground",
						children: lastUpdated ? `Updated ${formatTime(lastUpdated)}` : "Waiting for first runtime poll"
					})]
				})]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-6 rounded-2xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-700 dark:text-amber-300",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCard, {
						icon: Cpu,
						label: "Runtime Mode",
						value: runtime?.backend_mode ?? "Unavailable",
						detail: runtime ? runtime.lyzr_per_agent ? "Distinct Lyzr-backed runtime per role" : runtime.lyzr_enabled ? "Shared Lyzr runtime with backend fallbacks" : "Direct Gemini backend path" : "Runtime snapshot pending"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCard, {
						icon: Waypoints,
						label: "Consensus Policy",
						value: runtime ? `${runtime.consensus_threshold}/${runtime.max_debate_rounds} rounds` : "Unavailable",
						detail: metrics ? `${metrics.average_debate_rounds.toFixed(2)} avg rounds per processed message` : "No debate metrics yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCard, {
						icon: Sparkles,
						label: "Last Consensus",
						value: transcript ? transcript.final_consensus ? `${Math.round(transcript.final_confidence * 100)}% aligned` : "Unresolved" : "No transcript yet",
						detail: transcript ? `${transcript.rounds_completed} rounds • ${transcript.total_processing_ms}ms total` : "Process one message to populate the debug transcript"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCard, {
						icon: Database,
						label: "Fallback Posture",
						value: metrics ? `${metrics.fallback_events} fallback events` : "Unavailable",
						detail: transcript?.fallback_events.length ? transcript.fallback_events.join(" • ") : "No fallback events recorded on the latest run"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mb-8 rounded-3xl border border-border bg-card/95 p-6 shadow-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-5 flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/70",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, {
							className: "h-5 w-5 text-foreground",
							strokeWidth: 1.6
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-bold tracking-tight text-foreground",
						children: "Swarm Runtime Paths"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Each card shows the active runtime path, the dependent service it leans on, and the fallback lane that keeps the pipeline alive during demo conditions."
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InteractiveSwarm, {
					agents: runtime?.agents ?? [],
					health,
					transcript
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 gap-8 xl:grid-cols-[1.25fr_0.95fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-3xl border border-border bg-card p-6 shadow-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-5 flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/70",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, {
								className: "h-5 w-5 text-foreground",
								strokeWidth: 1.6
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-bold tracking-tight text-foreground",
							children: "Last Debate Snapshot"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Real transcript data from the most recent `/api/v1/process` run."
						})] })]
					}), transcript ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-4 md:grid-cols-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InlineMetric, {
										label: "Request ID",
										value: shortId(transcript.request_id),
										detail: transcript.ended_at ? formatTimestamp(transcript.ended_at) : "In flight"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InlineMetric, {
										label: "Consensus",
										value: transcript.final_consensus ? "Reached" : "Not reached",
										detail: `${transcript.rounds_completed} rounds completed`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InlineMetric, {
										label: "Processing Time",
										value: `${transcript.total_processing_ms}ms`,
										detail: `${transcript.messages.length} transcript messages`
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-border/70 bg-secondary/20 p-5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-sm font-semibold text-foreground",
									children: "Stage timings"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-4 space-y-3",
									children: stageEntries.length ? stageEntries.map(([name, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-medium capitalize text-foreground",
												children: name.replace(/_/g, " ")
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-mono text-muted-foreground",
												children: [value, "ms"]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-2 rounded-full bg-border/60",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-2 rounded-full bg-gradient-to-r from-mint via-indigo-500 to-lavender",
												style: { width: `${Math.max(value / maxStageLatency * 100, 12)}%` }
											})
										})]
									}, name)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Stage timings will appear after the first fully processed message."
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-4 lg:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl border border-border/70 p-5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-sm font-semibold text-foreground",
										children: "Consensus rounds"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-4 space-y-3",
										children: transcript.consensus_history.length ? transcript.consensus_history.map((round) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-2xl border border-border/60 bg-secondary/15 p-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between text-xs",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "font-semibold text-foreground",
														children: ["Round ", round.round]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: ["rounded-full px-2 py-0.5 font-mono text-[10px]", round.reached ? "bg-mint-soft/30 text-mint" : "bg-amber-500/10 text-amber-600 dark:text-amber-300"].join(" "),
														children: round.reached ? "CONSENSUS" : "REVISED"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-2 text-xs text-muted-foreground",
													children: [
														round.approved_count,
														"/",
														round.threshold,
														" approvals"
													]
												}),
												round.dominant_objection && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-2 text-xs text-foreground",
													children: round.dominant_objection
												})
											]
										}, round.round)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted-foreground",
											children: "No debate rounds have been recorded yet."
										})
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl border border-border/70 p-5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-sm font-semibold text-foreground",
										children: "Latest agent notes"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-4 space-y-3",
										children: transcript.messages.length ? transcript.messages.slice(-5).reverse().map((message, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-2xl border border-border/60 bg-secondary/15 p-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-xs font-semibold capitalize text-foreground",
													children: message.sender
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] font-mono uppercase tracking-wide text-muted-foreground",
													children: message.type
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2 text-xs leading-relaxed text-muted-foreground",
												children: message.reasoning
											})]
										}, `${message.sender}-${message.timestamp}-${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted-foreground",
											children: "Agent messages are captured after the debate loop runs."
										})
									})]
								})]
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
						title: "No transcript captured yet",
						description: "Run a message through the real `/process` pipeline from the inbox or dashboard and this panel will show the last debate, timings, and fallback notes."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-3xl border border-border bg-card p-6 shadow-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-5 flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/70",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrainCircuit, {
								className: "h-5 w-5 text-foreground",
								strokeWidth: 1.6
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-bold tracking-tight text-foreground",
							children: "Dependency Fabric"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Downstream services that decide whether the swarm is running its primary path or a graceful fallback."
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-border/70 bg-secondary/20 p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-end justify-between gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground",
								children: "Healthy services"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-3xl font-black tracking-tight text-foreground",
								children: [healthyDependencyCount, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "ml-1 text-lg font-semibold text-muted-foreground",
									children: ["/ ", dependencyEntries.length || 0]
								})]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "max-w-[180px] text-right text-xs text-muted-foreground",
								children: metrics ? `${metrics.messages_processed} processed requests since startup` : "Metrics not available yet"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-5 space-y-3",
							children: dependencyEntries.length ? dependencyEntries.map(([key, value]) => {
								const tone = getDependencyTone(value);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between rounded-2xl border border-border/60 bg-card/70 px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-semibold text-foreground",
										children: dependencyLabels[key] ?? key
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: dependencyDescription(key, value)
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: tone,
										children: value.replace(/_/g, " ")
									})]
								}, key);
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "Dependency health will appear once the backend responds to `/api/v1/health`."
							})
						})]
					})]
				})]
			})
		]
	});
}
function SummaryCard({ icon: Icon, label, value, detail }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-3xl border border-border bg-card p-5 shadow-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "h-4.5 w-4.5 text-muted-foreground",
					strokeWidth: 1.6
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-xl font-bold tracking-tight text-foreground",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs leading-relaxed text-muted-foreground",
				children: detail
			})
		]
	});
}
function InlineMetric({ label, value, detail }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border/70 bg-secondary/20 p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm font-semibold text-foreground",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: detail
			})
		]
	});
}
function EmptyState({ title, description }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-3xl border border-dashed border-border bg-secondary/15 p-8 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-base font-semibold text-foreground",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground",
			children: description
		})]
	});
}
function getAgentStatusTone(agent, health, transcript) {
	const dependencyState = agent.id === "contextualizer" ? health?.dependencies.memory_service : agent.id === "scheduler" ? health?.dependencies.calendar_mcp : agent.primary_runtime.includes("ADK") ? health?.dependencies.google_adk : health?.dependencies.gemini;
	if (dependencyState && [
		"unavailable",
		"missing_api_key",
		"not_installed"
	].includes(dependencyState)) return {
		label: "Degraded",
		badgeClass: "bg-rose-500/10 text-rose-500",
		dotClass: "bg-rose-500"
	};
	if (getAgentLatency(agent.id, transcript) !== null) return {
		label: "Verified",
		badgeClass: "bg-mint-soft/30 text-mint",
		dotClass: "bg-mint"
	};
	return {
		label: "Standby",
		badgeClass: "bg-secondary text-muted-foreground",
		dotClass: "bg-muted-foreground/70"
	};
}
function getAgentLatency(agentId, transcript) {
	if (!transcript) return null;
	const values = ({
		interceptor: ["interceptor"],
		contextualizer: ["contextualizer"],
		scheduler: ["scheduler"],
		translator: ["initial_translation", "debate"]
	}[agentId] ?? []).map((key) => transcript.stage_latencies[key]).filter((value) => typeof value === "number");
	if (!values.length) return null;
	return values.reduce((total, value) => total + value, 0);
}
function getDependencyTone(value) {
	if ([
		"ok",
		"configured",
		"available"
	].includes(value)) return "rounded-full bg-mint-soft/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-mint";
	if (["degraded"].includes(value)) return "rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300";
	return "rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-500";
}
function dependencyDescription(key, value) {
	if (key === "memory_service") return value === "ok" ? "Qdrant-backed enrichment is available." : "Contextualizer will fall back to default memory context.";
	if (key === "calendar_mcp") return value === "ok" ? "Scheduler can inspect live calendar availability." : "Scheduler will use deterministic fallback slotting.";
	if (key === "lyzr") return value === "available" ? "Lyzr SDK is installed for shared or per-agent cloud runtimes." : "Lyzr path is unavailable on this runtime.";
	if (key === "google_adk") return value === "available" ? "Interceptor can run through Google ADK." : "Interceptor will fall back to its standard backend path.";
	if (key === "gemini") return value === "configured" ? "Gemini credentials are configured for direct backend use." : "Direct Gemini calls are currently not configured.";
	return value.replace(/_/g, " ");
}
function formatTime(date) {
	return new Intl.DateTimeFormat("en-IN", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	}).format(date);
}
function formatTimestamp(value) {
	const date = new Date(value);
	return new Intl.DateTimeFormat("en-IN", {
		dateStyle: "medium",
		timeStyle: "short"
	}).format(date);
}
function shortId(value) {
	return value.slice(0, 8);
}
function getErrorMessage(reason, fallback) {
	if (reason instanceof ApiError) return reason.message;
	if (reason instanceof Error) return reason.message;
	return fallback;
}
async function refreshSwarmState(setIsRefreshing, setError, setRuntime, setHealth, setMetrics, setTranscript, setLastUpdated) {
	setIsRefreshing(true);
	try {
		const [runtimeData, healthData, metricsData] = await Promise.all([
			getRuntimeSnapshot(),
			checkHealth(),
			getDebugMetrics()
		]);
		setRuntime(runtimeData);
		setHealth(healthData);
		setMetrics(metricsData);
		setError(null);
		try {
			setTranscript(await getDebugTranscript());
		} catch (reason) {
			if (reason?.status === 404) setTranscript(null);
			else throw reason;
		}
		setLastUpdated(/* @__PURE__ */ new Date());
	} catch (reason) {
		setError(getErrorMessage(reason, "Unable to refresh swarm state."));
	} finally {
		setIsRefreshing(false);
	}
}
//#endregion
export { AgentSwarm as component, getAgentLatency, getAgentStatusTone };
