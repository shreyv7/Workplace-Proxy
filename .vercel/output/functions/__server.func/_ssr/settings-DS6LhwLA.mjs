import { i as __toESM } from "../_runtime.mjs";
import { l as getRuntimeSnapshot, p as updateDebugSettings } from "./api-CyqFAnVh.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/@lottiefiles/dotlottie-react+[...].mjs";
import { J as Check, M as Key, a as User, p as Shield, ut as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as supabase } from "./supabase-gMqJtobQ.mjs";
import { n as useAuth } from "./AuthProvider-DtpAWP_D.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-DS6LhwLA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SystemSettingsPage() {
	const { user } = useAuth();
	const [userName, setUserName] = (0, import_react.useState)("Hackathon Developer");
	const [userEmail, setUserEmail] = (0, import_react.useState)("dev@workplaceproxy.ai");
	const [threshold, setThreshold] = (0, import_react.useState)(90);
	const [saved, setSaved] = (0, import_react.useState)(false);
	const [isSaving, setIsSaving] = (0, import_react.useState)(false);
	const [saveError, setSaveError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (user) {
			setUserName(user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Hackathon Developer");
			setUserEmail(user.email ?? "dev@workplaceproxy.ai");
		}
	}, [user]);
	(0, import_react.useEffect)(() => {
		const loadConsensusSettings = async () => {
			const localThreshold = localStorage.getItem("system_settings_threshold");
			if (localThreshold) {
				setThreshold(parseInt(localThreshold, 10));
				return;
			}
			try {
				const runtime = await getRuntimeSnapshot();
				if (runtime) {
					const consensus = runtime.consensus_threshold;
					const maxRounds = runtime.max_debate_rounds;
					if (consensus === 1) setThreshold(50);
					else if (consensus === 2 && maxRounds <= 3) setThreshold(75);
					else setThreshold(90);
				}
			} catch (e) {
				console.warn("Failed to load runtime snapshot for consensus parameters:", e);
			}
		};
		loadConsensusSettings();
	}, []);
	const triggerSave = async () => {
		setIsSaving(true);
		setSaveError(null);
		try {
			if (user) if (!user.id?.startsWith("mock-")) {
				const updates = {};
				if (userEmail !== user.email) updates.email = userEmail;
				if (userName !== user.user_metadata?.full_name) updates.data = { full_name: userName };
				if (Object.keys(updates).length > 0) {
					const { error } = await supabase.auth.updateUser(updates);
					if (error) throw error;
				}
			} else {
				const mockUser = {
					...user,
					email: userEmail,
					user_metadata: {
						...user.user_metadata,
						full_name: userName
					}
				};
				localStorage.setItem("mock_user", JSON.stringify(mockUser));
				setTimeout(() => {
					window.location.reload();
				}, 1e3);
			}
			let backendConsensus = 2;
			let backendRounds = 3;
			if (threshold < 70) {
				backendConsensus = 1;
				backendRounds = 2;
			} else if (threshold >= 70 && threshold <= 85) {
				backendConsensus = 2;
				backendRounds = 3;
			} else {
				backendConsensus = 2;
				backendRounds = 5;
			}
			localStorage.setItem("system_settings_threshold", String(threshold));
			await updateDebugSettings({
				debate_consensus_threshold: backendConsensus,
				max_debate_rounds: backendRounds
			});
			setSaved(true);
			setTimeout(() => setSaved(false), 3e3);
		} catch (err) {
			console.error("Failed to save settings changes:", err);
			setSaveError(err?.message ?? "An error occurred while saving system changes.");
		} finally {
			setIsSaving(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1000px] px-6 pt-8 pb-28 animate-fade-in select-none",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mb-8 flex flex-wrap items-end justify-between gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-mono tracking-widest text-muted-foreground uppercase",
						children: "Platform Config"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl",
						children: "System Settings"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Configure system variables, credentials, and consensus parameters for the underlying Swarm runtime."
					})
				] }),
				saved && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs font-semibold text-mint bg-mint-soft/30 px-3.5 py-2 rounded-xl flex items-center gap-1.5 animate-scale-in",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), " System changes saved successfully"]
				}),
				saveError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-semibold text-rose-500 bg-rose-500/10 px-3.5 py-2 rounded-xl flex items-center gap-1.5 animate-scale-in",
					children: saveError
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 pb-2 border-b border-border/60",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xs font-bold text-foreground uppercase tracking-wider",
							children: "User profile"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-semibold text-muted-foreground",
								children: "Display Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: userName,
								onChange: (e) => setUserName(e.target.value),
								className: "w-full px-3.5 py-2 text-xs border border-border rounded-xl bg-secondary/25 text-foreground focus:outline-none focus:border-primary transition-colors"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-semibold text-muted-foreground",
								children: "Email Address"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "email",
								value: userEmail,
								onChange: (e) => setUserEmail(e.target.value),
								className: "w-full px-3.5 py-2 text-xs border border-border rounded-xl bg-secondary/25 text-foreground focus:outline-none focus:border-primary transition-colors"
							})]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 pb-2 border-b border-border/60",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xs font-bold text-foreground uppercase tracking-wider",
							children: "Swarm Consensus parameters"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-xs font-semibold text-foreground/80",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Minimum Consensus Threshold" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono text-indigo-500",
										children: [threshold, "% confidence"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "range",
									min: "50",
									max: "98",
									value: threshold,
									onChange: (e) => setThreshold(parseInt(e.target.value)),
									className: "w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-indigo-500"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-[9px] text-muted-foreground font-mono",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Relaxed (50%)" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Balanced (75%)" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Strict Consensus (98%)" })
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10.5px] text-muted-foreground leading-normal",
							children: "Note: Higher thresholds trigger more background agent debate passes, increasing latency but ensuring maximum safety and formatting accuracy."
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 pb-2 border-b border-border/60",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Key, { className: "h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xs font-bold text-foreground uppercase tracking-wider",
							children: "Vector database credentials"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-semibold text-muted-foreground",
								children: "Qdrant Host URI"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: "http://localhost:6333",
								disabled: true,
								className: "w-full px-3.5 py-2 text-xs border border-border rounded-xl bg-secondary/40 text-muted-foreground select-all font-mono"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-semibold text-muted-foreground",
								children: "Vector Dimension Mapping"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: "768 dimensions (Google text-embedding-004)",
								disabled: true,
								className: "w-full px-3.5 py-2 text-xs border border-border rounded-xl bg-secondary/40 text-muted-foreground select-all font-mono"
							})]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-end pt-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: triggerSave,
						disabled: isSaving,
						className: "px-6 py-3 rounded-xl bg-foreground text-background font-bold text-xs hover:opacity-90 transition-opacity shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
						children: [isSaving && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }), "Save system changes"]
					})
				})
			]
		})]
	});
}
//#endregion
export { SystemSettingsPage as component };
