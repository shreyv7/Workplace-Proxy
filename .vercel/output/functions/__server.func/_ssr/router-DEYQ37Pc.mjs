import { i as __toESM } from "../_runtime.mjs";
import { l as getRuntimeSnapshot, r as checkHealth, s as getDebugMetrics } from "./api-CyqFAnVh.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/@lottiefiles/dotlottie-react+[...].mjs";
import { F as useRouter, P as useNavigate, _ as Link, c as HeadContent, f as createRouter, g as createRootRouteWithContext, h as createFileRoute, l as useLocation, m as lazyRouteComponent, p as Outlet, s as Scripts, u as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Route$10 } from "./agents-CRN906-Z.mjs";
import { C as Moon, F as Inbox, K as ChevronRight, Q as Brain, c as Sun, d as SlidersHorizontal, et as Bot, g as Settings, j as Link2, k as LogOut, lt as Sparkles, n as X, o as TrendingUp } from "../_libs/lucide-react.mjs";
import { n as useAuth, t as AuthProvider } from "./AuthProvider-DtpAWP_D.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-DEYQ37Pc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-vDMJ475s.css";
function reportError(error, context = {}) {
	if (typeof window === "undefined") return;
	console.error("Reported error:", error, context);
}
var ThemeContext = (0, import_react.createContext)({
	theme: "light",
	toggle: () => {}
});
function ThemeProvider({ children }) {
	const [theme, setTheme] = (0, import_react.useState)(() => {
		if (typeof document !== "undefined") return document.documentElement.classList.contains("dark") ? "dark" : "light";
		return "light";
	});
	(0, import_react.useEffect)(() => {
		const root = document.documentElement;
		if (theme === "dark") root.classList.add("dark");
		else root.classList.remove("dark");
		try {
			localStorage.setItem("theme", theme);
		} catch {}
	}, [theme]);
	const toggle = () => setTheme((prev) => prev === "dark" ? "light" : "dark");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeContext.Provider, {
		value: {
			theme,
			toggle
		},
		children
	});
}
function useTheme() {
	return (0, import_react.useContext)(ThemeContext);
}
function ThemeToggle() {
	const { theme, toggle } = useTheme();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick: toggle,
		"aria-label": theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
		className: "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 text-sidebar-foreground/75 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground",
		children: [theme === "dark" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, {
			className: "h-4 w-4 opacity-80 transition-transform duration-200 group-hover:scale-105",
			strokeWidth: 1.75
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, {
			className: "h-4 w-4 opacity-80 transition-transform duration-200 group-hover:scale-105",
			strokeWidth: 1.75
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-normal tracking-wide",
			children: theme === "dark" ? "Light mode" : "Dark mode"
		})]
	});
}
var navSections = [{
	id: "workspace",
	label: "End-User Workspace",
	hint: "Daily clarity, triage, and personal setup",
	items: [
		{
			to: "/dashboard",
			label: "Daily Clarity",
			icon: Sun
		},
		{
			to: "/inbox",
			label: "Communication Inbox",
			icon: Inbox
		},
		{
			to: "/preferences",
			label: "Preferences",
			icon: SlidersHorizontal
		},
		{
			to: "/insights",
			label: "Insights Dashboard",
			icon: TrendingUp
		}
	]
}, {
	id: "internal",
	label: "Internal Tools",
	hint: "Swarm internals, memory, and platform controls",
	items: [
		{
			to: "/integrations",
			label: "Integrations",
			icon: Link2
		},
		{
			to: "/memory",
			label: "Cognitive Memory",
			icon: Brain
		},
		{
			to: "/agents",
			label: "Agent Swarm",
			icon: Bot
		},
		{
			to: "/settings",
			label: "Platform Settings",
			icon: Settings
		}
	]
}];
function AppSidebar() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const { logout, user } = useAuth();
	const [runtime, setRuntime] = (0, import_react.useState)(null);
	const [health, setHealth] = (0, import_react.useState)(null);
	const [metrics, setMetrics] = (0, import_react.useState)(null);
	const [internalExpanded, setInternalExpanded] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return false;
		return localStorage.getItem("show_internal_tools") === "true";
	});
	const isOnInternalRoute = (navSections.find((section) => section.id === "internal")?.items.map((item) => item.to) ?? []).includes(pathname);
	(0, import_react.useEffect)(() => {
		let disposed = false;
		const loadSidebarStatus = async () => {
			const [runtimeResult, healthResult, metricsResult] = await Promise.allSettled([
				getRuntimeSnapshot(),
				checkHealth(),
				getDebugMetrics()
			]);
			if (disposed) return;
			if (runtimeResult.status === "fulfilled") setRuntime(runtimeResult.value);
			if (healthResult.status === "fulfilled") setHealth(healthResult.value);
			if (metricsResult.status === "fulfilled") setMetrics(metricsResult.value);
		};
		loadSidebarStatus();
		const interval = window.setInterval(() => {
			loadSidebarStatus();
		}, 3e4);
		return () => {
			disposed = true;
			window.clearInterval(interval);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (isOnInternalRoute && !internalExpanded) setInternalExpanded(true);
	}, [internalExpanded, isOnInternalRoute]);
	const handleSignOut = async () => {
		if (user?.id) {
			if (user.id.startsWith("mock-")) localStorage.removeItem(`profile_${user.id}`);
		}
		await logout();
		navigate({ to: "/" });
	};
	const toggleInternalTools = () => {
		setInternalExpanded((prev) => {
			const next = !prev;
			if (typeof window !== "undefined") localStorage.setItem("show_internal_tools", String(next));
			return next;
		});
	};
	const healthyDependencyCount = Object.values(health?.dependencies ?? {}).filter((value) => [
		"ok",
		"configured",
		"available"
	].includes(value)).length;
	const dependencyCount = Object.keys(health?.dependencies ?? {}).length;
	const swarmStatusLabel = health?.status === "ok" ? "Swarm Core Online" : health?.status === "degraded" ? "Swarm Degraded" : "Swarm Status Pending";
	const swarmStatusAccent = health?.status === "ok" ? "bg-mint" : health?.status === "degraded" ? "bg-amber-500" : "bg-muted-foreground";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex select-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 px-5 pt-4 pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-8 w-8 items-center justify-center rounded-xl bg-mint-soft/10 text-mint border border-mint/20 shadow-sm transition-all duration-300 hover:scale-105",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
						className: "h-4 w-4 text-mint",
						strokeWidth: 1.5
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "leading-tight",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs font-semibold tracking-tight text-sidebar-foreground",
						children: "Workplace Proxy"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] text-sidebar-foreground/50 font-mono tracking-wider uppercase",
						children: "Cognitive OS"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "flex flex-1 flex-col gap-1 px-3 overflow-y-auto scrollbar-calm",
				children: navSections.map((section) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1",
					children: [section.id === "internal" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: toggleInternalTools,
						className: "flex w-full items-center justify-between rounded-lg px-2.5 pt-1 pb-0.5 text-left transition-colors hover:bg-sidebar-accent/20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[9px] font-mono uppercase tracking-[0.22em] text-sidebar-foreground/45",
							children: section.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-0.5 text-[10px] text-sidebar-foreground/35",
							children: internalExpanded ? section.hint : "Collapsed"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: ["h-3.5 w-3.5 text-sidebar-foreground/45 transition-transform", internalExpanded ? "rotate-90" : ""].join(" ") })]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-2.5 pt-1 pb-0.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[9px] font-mono uppercase tracking-[0.22em] text-sidebar-foreground/45",
							children: section.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-0.5 text-[10px] text-sidebar-foreground/35",
							children: section.hint
						})]
					}), (section.id !== "internal" || internalExpanded) && section.items.map((item) => {
						const Icon = item.icon;
						const active = pathname === item.to;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							className: ["group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-200", active ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"].join(" "),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									className: ["h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-105", active ? "text-mint" : "opacity-80"].join(" "),
									strokeWidth: 1.75
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-normal tracking-wide",
									children: item.label
								}),
								active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ml-auto h-1 w-1 rounded-full bg-mint shadow-[0_0_8px_var(--mint)] animate-pulse-soft" })
							]
						}, item.to);
					})]
				}, section.id))
			}),
			user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-3 pb-0.5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 rounded-lg border border-sidebar-border/60 px-2 py-1.5 bg-sidebar-accent/10",
					children: [user.user_metadata?.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: user.user_metadata.avatar_url,
						alt: "",
						referrerPolicy: "no-referrer",
						className: "h-6 w-6 rounded-full object-cover shrink-0 ring-1 ring-sidebar-border"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-6 w-6 rounded-full bg-mint-soft flex items-center justify-center shrink-0 ring-1 ring-sidebar-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[9px] font-bold text-mint",
							children: (user.user_metadata?.full_name ?? user.email ?? "U").charAt(0).toUpperCase()
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold text-sidebar-foreground truncate",
							children: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[9px] text-muted-foreground truncate",
							children: user.email
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-3 pb-1 flex flex-col gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: handleSignOut,
					className: "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 cursor-pointer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, {
						className: "h-3.5 w-3.5 opacity-85 group-hover:opacity-100 transition-opacity",
						strokeWidth: 1.75
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-normal tracking-wide text-xs",
						children: "Sign Out"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-3 my-2 rounded-xl border border-sidebar-border/40 bg-sidebar-accent/20 p-3 shadow-xs backdrop-blur-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5 text-[11px] font-medium text-sidebar-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "relative flex h-1.5 w-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: ["absolute inline-flex h-full w-full animate-ping rounded-full opacity-65", swarmStatusAccent].join(" ") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: ["relative inline-flex h-1.5 w-1.5 rounded-full shadow-[0_0_4px_var(--mint)]", swarmStatusAccent].join(" ") })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: swarmStatusLabel })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[9px] font-mono text-sidebar-foreground/50",
						children: health?.version ?? "v?.?.?"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 space-y-1.5 border-t border-sidebar-border/30 pt-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-[10px] text-sidebar-foreground/60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Runtime Mode" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-sidebar-foreground",
								children: runtime?.backend_mode ?? "Pending"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-[10px] text-sidebar-foreground/60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Aggregated Latency" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-sidebar-foreground",
								children: metrics ? `${metrics.average_latency_ms}ms` : "Pending"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-[10px] text-sidebar-foreground/60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Healthy Services" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-mint font-semibold",
								children: dependencyCount ? `${healthyDependencyCount}/${dependencyCount}` : "Pending"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-[10px] text-sidebar-foreground/60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Processed Requests" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-lavender font-semibold",
								children: metrics?.messages_processed ?? 0
							})]
						})
					]
				})]
			})
		]
	});
}
var AuthModal = () => {
	const { showAuthModal, setShowAuthModal, loginWithGoogle, loginMock } = useAuth();
	const [isSigningIn, setIsSigningIn] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	if (!showAuthModal) return null;
	const handleGoogleSignIn = async () => {
		setError(null);
		setIsSigningIn(true);
		try {
			await loginWithGoogle();
		} catch (err) {
			setError(err?.message ?? "Google sign-in failed. Please try again.");
			setIsSigningIn(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300",
			onClick: () => setShowAuthModal(false)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c]/80 p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-300 animate-in fade-in zoom-in-95",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setShowAuthModal(false),
					className: "absolute right-4 top-4 rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition-colors",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center text-center mt-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] mb-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
								className: "h-6 w-6 text-black",
								strokeWidth: 2
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xl font-bold text-white tracking-tight",
							children: "Launch Workspace"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-white/50 max-w-xs leading-relaxed",
							children: "Connect your account to access your neuro-inclusive cognitive workspace proxy."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: handleGoogleSignIn,
							disabled: isSigningIn,
							className: "flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer",
							children: [isSigningIn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
								className: "h-4 w-4",
								viewBox: "0 0 24 24",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										fill: "currentColor",
										d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										fill: "currentColor",
										d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										fill: "currentColor",
										d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										fill: "currentColor",
										d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
									})
								]
							}), isSigningIn ? "Redirecting to Google…" : "Sign in with Google"]
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-xs text-red-400 px-2",
							children: error
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative flex py-2 items-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-grow border-t border-white/5" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex-shrink mx-4 text-[10px] text-white/30 tracking-widest font-mono",
									children: "OR"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-grow border-t border-white/5" })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: loginMock,
							className: "flex w-full items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-3 text-sm font-semibold tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-[0.98] cursor-pointer",
							children: "Launch Demo Workspace"
						})
					]
				})
			]
		})]
	});
};
function AuthGuard({ children }) {
	const { isAuthenticated, isLoading } = useAuth();
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		if (!isLoading && !isAuthenticated) navigate({
			to: "/",
			replace: true
		});
	}, [
		isLoading,
		isAuthenticated,
		navigate
	]);
	if (isLoading || !isAuthenticated) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthLoadingScreen, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function AuthLoadingScreen() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-dvh items-center justify-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-soft",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
					className: "h-6 w-6 text-mint animate-pulse",
					strokeWidth: 1.5
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold text-foreground",
					children: "Workplace Proxy"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground mt-1",
					children: "Authenticating..."
				})]
			})]
		})
	});
}
var THEME_SCRIPT = `
try {
  var t = localStorage.getItem('theme');
  if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  if (t === 'dark') document.documentElement.classList.add('dark');
  
  var nm = localStorage.getItem('neuroMode');
  if (nm !== 'false') document.documentElement.classList.add('high-contrast');
  
  var anim = localStorage.getItem('animations');
  if (anim === 'false') document.documentElement.classList.add('no-animations');
  
  var sd = localStorage.getItem('sensoryDensity');
  if (sd) {
    var density = parseInt(sd, 10);
    if (density <= 35) document.documentElement.classList.add('sensory-low');
    if (density >= 75) document.documentElement.classList.add('sensory-high');
  }
} catch(e) {}
`;
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$9 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Workplace Proxy — Cognitive Workspace" },
			{
				name: "description",
				content: "A neuro-inclusive multi-agent cognitive workspace that translates ambiguous messages into clear, scheduled actions."
			},
			{
				property: "og:title",
				content: "Workplace Proxy — Cognitive Workspace"
			},
			{
				property: "og:description",
				content: "A neuro-inclusive multi-agent cognitive workspace that translates ambiguous messages into clear, scheduled actions."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary"
			}
		],
		links: [
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: THEME_SCRIPT } })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$9.useRouteContext();
	const location = useLocation();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [location.pathname === "/" || location.pathname === "/onboarding" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "min-h-dvh bg-[#030303] text-white overflow-x-hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthGuard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-dvh bg-background",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppSidebar, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "md:pl-64",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
			})]
		}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthModal, {})]
	}) }) });
}
var $$splitComponentImporter$8 = () => import("./settings-DS6LhwLA.mjs");
var Route$8 = createFileRoute("/settings")({
	head: () => ({ meta: [{ title: "Platform Settings — Workplace Proxy" }, {
		name: "description",
		content: "Configure profile defaults, swarm thresholds, and secure vector API credentials."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./preferences-C5TxDl9z.mjs");
var Route$7 = createFileRoute("/preferences")({
	head: () => ({ meta: [{ title: "Preferences & Calibration — Workplace Proxy" }, {
		name: "description",
		content: "Tune sensory load, agent verbosity and translation fidelity to match your cognitive style."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./onboarding-CB73x2Rl.mjs");
var Route$6 = createFileRoute("/onboarding")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./memory-Cbxur902.mjs");
var Route$5 = createFileRoute("/memory")({
	head: () => ({ meta: [{ title: "Cognitive Memory — Workplace Proxy" }, {
		name: "description",
		content: "Explore the vector database storing your personal energy schedules and corporate context policies."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./integrations-c9ScpiEm.mjs");
var Route$4 = createFileRoute("/integrations")({
	validateSearch: (search) => search,
	head: () => ({ meta: [{ title: "Integrations — Workplace Proxy" }, {
		name: "description",
		content: "Connect your workplace services to the cognitive compiler."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./insights-BFPl9Gvr.mjs");
var Route$3 = createFileRoute("/insights")({
	head: () => ({ meta: [{ title: "Insights Dashboard — Workplace Proxy" }, {
		name: "description",
		content: "Track cognitive energy peaks, focus hours protected, and overall communication translation metrics."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./inbox-HiJg2Jxa.mjs");
var Route$2 = createFileRoute("/inbox")({
	head: () => ({ meta: [{ title: "Communication Inbox — Workplace Proxy" }, {
		name: "description",
		content: "All intercepted communication threads across your connected channels."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./dashboard-BZwr-9VR.mjs");
var Route$1 = createFileRoute("/dashboard")({
	head: () => ({ meta: [{ title: "Daily Clarity — Workplace Proxy" }, {
		name: "description",
		content: "Today's translated workspace signals and a cognitive-load calendar of your scheduled focus and tasks."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./routes-DyjnfYYA.mjs");
var Route = createFileRoute("/")({
	head: () => ({ meta: [{ title: "Workplace Proxy — The Cognitive Operating System" }, {
		name: "description",
		content: "An AI-native multi-agent cognitive workspace that translates ambiguous messages into structured, scheduled actions."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var SettingsRoute = Route$8.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => Route$9
});
var PreferencesRoute = Route$7.update({
	id: "/preferences",
	path: "/preferences",
	getParentRoute: () => Route$9
});
var OnboardingRoute = Route$6.update({
	id: "/onboarding",
	path: "/onboarding",
	getParentRoute: () => Route$9
});
var MemoryRoute = Route$5.update({
	id: "/memory",
	path: "/memory",
	getParentRoute: () => Route$9
});
var IntegrationsRoute = Route$4.update({
	id: "/integrations",
	path: "/integrations",
	getParentRoute: () => Route$9
});
var InsightsRoute = Route$3.update({
	id: "/insights",
	path: "/insights",
	getParentRoute: () => Route$9
});
var InboxRoute = Route$2.update({
	id: "/inbox",
	path: "/inbox",
	getParentRoute: () => Route$9
});
var DashboardRoute = Route$1.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => Route$9
});
var AgentsRoute = Route$10.update({
	id: "/agents",
	path: "/agents",
	getParentRoute: () => Route$9
});
var rootRouteChildren = {
	IndexRoute: Route.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$9
	}),
	AgentsRoute,
	DashboardRoute,
	InboxRoute,
	InsightsRoute,
	IntegrationsRoute,
	MemoryRoute,
	OnboardingRoute,
	PreferencesRoute,
	SettingsRoute
};
var routeTree = Route$9._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
