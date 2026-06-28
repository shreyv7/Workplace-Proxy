import { i as __toESM } from "../_runtime.mjs";
import { t as API_BASE_URL } from "./api-CyqFAnVh.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/@lottiefiles/dotlottie-react+[...].mjs";
import { W as Clock, Y as Calendar, ht as ChartNoAxesColumn, m as ShieldCheck, ot as Activity, s as Target } from "../_libs/lucide-react.mjs";
import { t as supabase } from "./supabase-gMqJtobQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/insights-BFPl9Gvr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function InsightsPage() {
	const [activeTab, setActiveTab] = (0, import_react.useState)("weekly");
	const [timeline, setTimeline] = (0, import_react.useState)([]);
	const [kpis, setKpis] = (0, import_react.useState)({
		hoursSaved: 24.5,
		avgFriction: 18,
		clarityScore: 96
	});
	const [isLoading, setIsLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		let active = true;
		async function loadTelemetry() {
			setIsLoading(true);
			try {
				const response = await fetch(`${API_BASE_URL}/api/v1/telemetry?range=${activeTab}`);
				if (!response.ok) throw new Error("Backend response not ok");
				const json = await response.json();
				if (json.status === "success" && active) {
					const dbData = json.data;
					const mappedTimeline = dbData.map((item) => {
						const dateObj = new Date(item.date);
						const dayName = [
							"Sun",
							"Mon",
							"Tue",
							"Wed",
							"Thu",
							"Fri",
							"Sat"
						][dateObj.getDay()];
						return {
							day: activeTab === "weekly" ? dayName : `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
							saved: Math.round(parseFloat(item.hours_saved || 0) * 60),
							friction: item.cognitive_friction || 0,
							focus: parseFloat(item.focus_hours_protected || 0)
						};
					});
					const totalHours = dbData.reduce((acc, curr) => acc + (parseFloat(curr.hours_saved) || 0), 0);
					const avgFriction = dbData.length ? Math.round(dbData.reduce((acc, curr) => acc + (curr.cognitive_friction || 0), 0) / dbData.length) : 0;
					const avgClarity = dbData.length ? Math.round(dbData.reduce((acc, curr) => acc + (curr.clarity_score || 0), 0) / dbData.length) : 0;
					setTimeline(mappedTimeline);
					setKpis({
						hoursSaved: parseFloat(totalHours.toFixed(1)),
						avgFriction,
						clarityScore: avgClarity
					});
				}
			} catch (err) {
				console.warn("Falling back to Supabase client fetch directly:", err);
				if (!active) return;
				try {
					const limit = activeTab === "weekly" ? 7 : 30;
					const { data, error } = await supabase.from("telemetry_history").select("*").order("date", { ascending: false }).limit(limit);
					if (error) throw error;
					if (data && active) {
						const dbData = [...data].reverse();
						const mappedTimeline = dbData.map((item) => {
							const dateObj = new Date(item.date);
							const dayName = [
								"Sun",
								"Mon",
								"Tue",
								"Wed",
								"Thu",
								"Fri",
								"Sat"
							][dateObj.getDay()];
							return {
								day: activeTab === "weekly" ? dayName : `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
								saved: Math.round(parseFloat(item.hours_saved || 0) * 60),
								friction: item.cognitive_friction || 0,
								focus: parseFloat(item.focus_hours_protected || 0)
							};
						});
						const totalHours = dbData.reduce((acc, curr) => acc + (parseFloat(curr.hours_saved) || 0), 0);
						const avgFriction = dbData.length ? Math.round(dbData.reduce((acc, curr) => acc + (curr.cognitive_friction || 0), 0) / dbData.length) : 0;
						const avgClarity = dbData.length ? Math.round(dbData.reduce((acc, curr) => acc + (curr.clarity_score || 0), 0) / dbData.length) : 0;
						setTimeline(mappedTimeline);
						setKpis({
							hoursSaved: parseFloat(totalHours.toFixed(1)),
							avgFriction,
							clarityScore: avgClarity
						});
					}
				} catch (subErr) {
					console.error("Telemetry fetch failed, using placeholders:", subErr);
				}
			} finally {
				if (active) setIsLoading(false);
			}
		}
		loadTelemetry();
		return () => {
			active = false;
		};
	}, [activeTab]);
	const maxSaved = Math.max(...timeline.map((t) => t.saved), 60);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1400px] px-6 pt-8 pb-28 animate-fade-in select-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-8 flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-mono tracking-widest text-muted-foreground uppercase",
						children: "Cognitive Telemetry"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl",
						children: "Workspace Insights"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Analyze focus protection benchmarks, cognitive fatigue predictions, and time reclaimed by the AI swarms."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-1.5 rounded-xl bg-secondary/50 p-1 border border-border/60 shrink-0",
					children: ["weekly", "monthly"].map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setActiveTab(tab),
						className: ["px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-all", activeTab === tab ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"].join(" "),
						children: [tab, " analysis"]
					}, tab))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",
									children: "Est. Time Reclaimed"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-4.5 w-4.5 text-indigo-500" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-3xl font-extrabold tracking-tight text-foreground",
								children: [kpis.hoursSaved, " Hours"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full w-max",
								children: [
									"+",
									activeTab === "weekly" ? "3.5h" : "14.2h",
									" this ",
									activeTab === "weekly" ? "week" : "month"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground mt-1",
								children: "Based on email threads intercepted and calendar auto-locks."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",
									children: "Cognitive Friction"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "h-4.5 w-4.5 text-mint" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-3xl font-extrabold tracking-tight text-foreground",
								children: [
									"-",
									kpis.avgFriction,
									"%"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full w-max",
								children: "Optimal bounds"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground mt-1",
								children: "Calculated via task overload intervals and context switches blocked."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",
									children: "Workspace Clarity Score"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, { className: "h-4.5 w-4.5 text-amber-500" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-3xl font-extrabold tracking-tight text-foreground",
								children: [kpis.clarityScore, "/100"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-indigo-500 font-medium bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-full w-max",
								children: "96% Consensus Cert"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground mt-1",
								children: "Percentage of incoming signals resolved with zero user intervention."
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-6 overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between pb-4 border-b border-border/60",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartNoAxesColumn, { className: "h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-bold text-foreground",
								children: "Time Reclaimed Timeline (Mins)"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: "Reclaimed daily"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `flex items-end justify-between h-56 px-2 gap-${activeTab === "weekly" ? "4" : "1"} overflow-x-auto`,
						children: timeline.map((item, idx) => {
							const heightPercent = `${item.saved / maxSaved * 100}%`;
							const isToday = activeTab === "weekly" && idx === timeline.length - 1;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 flex flex-col items-center gap-2 h-full justify-end min-w-[20px]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-full bg-secondary/40 rounded-t-lg h-full flex items-end",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: ["w-full rounded-t-lg transition-all duration-700 bg-gradient-to-t from-indigo-500/80 to-indigo-500", isToday ? "ring-2 ring-foreground/20" : ""].join(" "),
											style: { height: heightPercent },
											title: `${item.day}: ${item.saved} mins saved`
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: ["text-[10px] font-semibold font-mono", isToday ? "text-foreground font-bold" : "text-muted-foreground"].join(" "),
										children: item.day
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[9px] font-mono text-muted-foreground hidden sm:inline",
										children: [item.saved, "m"]
									})
								]
							}, idx);
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 pb-4 border-b border-border/60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-bold text-foreground",
								children: "Focus Window protected"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-4 max-h-[300px] overflow-y-auto pr-1",
							children: timeline.slice(-7).map((item, idx) => {
								const isToday = activeTab === "weekly" && idx === 6;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: ["font-mono font-semibold", isToday ? "text-foreground font-bold" : "text-muted-foreground"].join(" "),
										children: isToday ? "Today" : item.day
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3 w-40",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex-1 h-2 bg-secondary rounded-full overflow-hidden",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-full bg-mint rounded-full",
												style: { width: `${item.focus / 8 * 100}%` }
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-mono font-semibold text-foreground w-8 text-right",
											children: [item.focus, "h"]
										})]
									})]
								}, idx);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl bg-secondary/20 p-3.5 border border-border/50 flex items-start gap-2.5 mt-auto text-[10.5px] leading-relaxed text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-4 w-4 text-mint shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								activeTab === "weekly" ? "Weekly" : "Monthly",
								" protected deep focus blocks average ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "4.6 hours per day" }),
								", exceeding the optimal benchmark."
							] })]
						})
					]
				})]
			})
		]
	});
}
//#endregion
export { InsightsPage as component };
