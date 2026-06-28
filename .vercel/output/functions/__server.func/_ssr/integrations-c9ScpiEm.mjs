import { i as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/@lottiefiles/dotlottie-react+[...].mjs";
import { B as ExternalLink, R as FileText, b as RefreshCw, mt as CircleAlert, n as X, pt as CircleCheck, ut as LoaderCircle } from "../_libs/lucide-react.mjs";
import { n as useAuth } from "./AuthProvider-DtpAWP_D.mjs";
import { a as checkWhatsAppMCPConnected, c as disconnectIntegration, d as upsertIntegrationStatus, i as checkSlackMCPConnected, l as handleGoogleOAuthReturn, n as checkCalendarMCPReachable, o as connectGmail, r as checkGmailMCPReachable, s as connectGoogleCalendar, u as loadIntegrationStatuses } from "./integrations-DsHHEf-F.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/integrations-c9ScpiEm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var INTEGRATION_DEFS = [
	{
		id: "google_calendar",
		name: "Google Calendar",
		icon: "📅",
		description: "Checks your real calendar availability to slot translated tasks into optimal deep-work blocks.",
		permissions: ["Read Events", "Free/Busy Lookup"],
		latency: "25ms",
		managed: true
	},
	{
		id: "gmail",
		name: "Gmail",
		icon: "✉️",
		description: "Reads email threads so the Contextualizer agent can enrich analysis with actual message history.",
		permissions: ["Read Threads", "Read Messages"],
		latency: "120ms",
		managed: true
	},
	{
		id: "slack",
		name: "Slack",
		icon: "💬",
		description: "Ingests messages from channels and DMs so the Interceptor agent processes your real Slack workload.",
		permissions: [
			"Read Channels",
			"Read Messages",
			"Resolve User Names"
		],
		latency: "14ms",
		managed: true
	},
	{
		id: "whatsapp",
		name: "WhatsApp Business",
		icon: "📱",
		description: "Ingests customer messages and triggers contextual agent responses via WhatsApp Webhooks.",
		permissions: ["Read Messages", "Send Template Messages"],
		latency: "18ms",
		managed: true
	},
	{
		id: "jira",
		name: "Jira Cloud",
		icon: "🎫",
		description: "Monitors active sprints, assignments, and ticket priority tags.",
		permissions: ["Read Tickets", "Update Status"],
		latency: "95ms",
		managed: false
	},
	{
		id: "linear",
		name: "Linear",
		icon: "⚡",
		description: "Tracks engineering issues and product backlogs.",
		permissions: ["Read Issues", "Assign Tasks"],
		latency: "45ms",
		managed: false
	},
	{
		id: "github",
		name: "GitHub",
		icon: "🐙",
		description: "Parses pull request reviews, comments, and issue updates.",
		permissions: ["Read Repository", "Read Notifications"],
		latency: "30ms",
		managed: false
	}
];
var WHITEPAPER_SECTIONS = [
	{
		title: "What this setup actually does",
		body: "This page connects your real work systems to Workplace Proxy's MCP layer. In the current build, Google Calendar and Gmail connect through Google OAuth, Slack can be configured against your own Slack app and bot token flow, and WhatsApp Business connects through Meta Cloud API credentials plus a webhook listener on your machine."
	},
	{
		title: "Shared prerequisites",
		body: "Keep this app running locally, because the integration servers expect localhost endpoints. In this workspace the MCP ports are 3000 for Slack, 3001 for Gmail, 3002 for Google Calendar, and 3003 for WhatsApp Business. You should also have access to the relevant Google account, Slack workspace, and Meta developer assets before starting."
	},
	{
		title: "Google Calendar",
		body: "In Google Cloud Console, create or reuse one project, enable Google Calendar API, and configure an OAuth consent screen. The official Google OAuth docs require a web application client with approved redirect URIs. For this workspace, Calendar uses the frontend reconnect flow and the local Calendar MCP server lives on localhost:3002. The app requests calendar read access only, using the calendar.readonly scope, so the user can grant least-privilege access.",
		bullets: [
			"Google Cloud Console → create a project or select an existing one.",
			"Enable Google Calendar API.",
			"Configure OAuth consent screen and add yourself as a test user if the app is still unverified.",
			"Create a Web application OAuth client.",
			"Make sure your auth stack allows the reconnect flow used by this app, and keep the local Calendar MCP available on `http://localhost:3002`.",
			"From this page, click `Connect` on Google Calendar and complete Google consent."
		]
	},
	{
		title: "Gmail",
		body: "Gmail follows the same Google Cloud project pattern, but with Gmail API enabled and Gmail read-only scope. Google's current Gmail auth guidance still expects OAuth 2.0 credentials and explicit scope approval. In this codebase, Gmail is treated as a separate reconnect action and the local Gmail MCP service is expected at localhost:3001.",
		bullets: [
			"Enable Gmail API in the same Google Cloud project.",
			"Use the same OAuth consent screen and keep the user added as a test user if needed.",
			"Grant only the Gmail read access needed for thread ingestion.",
			"Keep the Gmail MCP server available on `http://localhost:3001`.",
			"Click `Connect` on Gmail in this UI and finish the Google consent step."
		]
	},
	{
		title: "Slack",
		body: "Slack requires a Slack app tied to your workspace. The local code expects bot-style access, not a personal user token. Official Slack OAuth v2 docs require a configured redirect URL and granted bot scopes before installation. This workspace supports local server-side OAuth on `http://localhost:3000/oauth/callback`, and the UI can also be configured with the bot token and channel IDs you want monitored.",
		bullets: [
			"Create a Slack app in your workspace at Slack's developer console.",
			"Add bot scopes: `channels:history`, `channels:read`, `users:read`. The local MCP also includes `chat:write` in its OAuth request for future actions.",
			"Add redirect URL `http://localhost:3000/oauth/callback` in Slack OAuth settings.",
			"Install the app to your workspace and obtain the bot token if you are using manual configuration.",
			"Invite the bot to each channel you want monitored.",
			"Copy the Slack channel IDs and use `Configure` in this page to save the token and channels."
		]
	},
	{
		title: "WhatsApp Business",
		body: "WhatsApp Business in this project uses Meta's WhatsApp Cloud API model. Official Meta docs require a Meta app, a WhatsApp product, a callback URL, and a verify token for webhook validation. The local MCP server listens on `http://localhost:3003/webhook`, so for real inbound events you need a public tunnel such as ngrok that forwards to port 3003. The UI stores three items: access token, phone number ID, and webhook verify token.",
		bullets: [
			"Create a Meta app and add the WhatsApp product.",
			"Generate or copy a valid Cloud API access token.",
			"Copy the WhatsApp phone number ID from the Meta dashboard.",
			"Choose a verify token string you control.",
			"Expose local port `3003` publicly using a tunnel, then place that public `/webhook` URL into the Meta webhook configuration.",
			"During webhook verification, the verify token in Meta must exactly match the token entered into this page.",
			"After saving config here, send a test WhatsApp message to confirm inbound payloads reach the local MCP."
		]
	},
	{
		title: "What can fail most often",
		body: "Most connection failures on this page come from one of five things: the local MCP server is not running, the redirect URL does not exactly match the platform configuration, the wrong Google or Slack workspace account is used during consent, WhatsApp webhook verification tokens do not match, or the local port is not exposed publicly for Meta callbacks."
	}
];
function IntegrationsPage() {
	const { user, isLoading: authLoading } = useAuth();
	const [statuses, setStatuses] = (0, import_react.useState)(/* @__PURE__ */ new Map());
	const [syncing, setSyncing] = (0, import_react.useState)(null);
	const [connecting, setConnecting] = (0, import_react.useState)(null);
	const [loadingState, setLoadingState] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(null);
	const [notification, setNotification] = (0, import_react.useState)(null);
	const [showWhitepaper, setShowWhitepaper] = (0, import_react.useState)(false);
	const [configuringSlack, setConfiguringSlack] = (0, import_react.useState)(false);
	const [slackToken, setSlackToken] = (0, import_react.useState)("");
	const [slackChannels, setSlackChannels] = (0, import_react.useState)("");
	const [saveLoading, setSaveLoading] = (0, import_react.useState)(false);
	const [disconnectingSlack, setDisconnectingSlack] = (0, import_react.useState)(false);
	const [disconnectText, setDisconnectText] = (0, import_react.useState)("");
	const [disconnectLoading, setDisconnectLoading] = (0, import_react.useState)(false);
	const [configuringWA, setConfiguringWA] = (0, import_react.useState)(false);
	const [waAccessToken, setWaAccessToken] = (0, import_react.useState)("");
	const [waPhoneNumberId, setWaPhoneNumberId] = (0, import_react.useState)("");
	const [waVerifyToken, setWaVerifyToken] = (0, import_react.useState)("");
	const [waSaveLoading, setWaSaveLoading] = (0, import_react.useState)(false);
	const [disconnectingWA, setDisconnectingWA] = (0, import_react.useState)(false);
	const [waDisconnectText, setWaDisconnectText] = (0, import_react.useState)("");
	const [waDisconnectLoading, setWaDisconnectLoading] = (0, import_react.useState)(false);
	const refreshStatuses = (0, import_react.useCallback)(async () => {
		if (!user?.id) return;
		setLoadingState(true);
		try {
			const fromDB = await loadIntegrationStatuses(user.id);
			const calReachable = await checkCalendarMCPReachable();
			const gmailReachable = await checkGmailMCPReachable();
			const slackConnected = await checkSlackMCPConnected();
			const whatsappConnected = await checkWhatsAppMCPConnected();
			if (slackConnected && !fromDB.get("slack")?.connected) {
				await upsertIntegrationStatus(user.id, "slack", true, [
					"channels:history",
					"channels:read",
					"users:read"
				]);
				fromDB.set("slack", {
					service: "slack",
					connected: true,
					scopes: [
						"channels:history",
						"channels:read",
						"users:read"
					],
					connected_at: (/* @__PURE__ */ new Date()).toISOString(),
					metadata: {}
				});
			}
			if (whatsappConnected && !fromDB.get("whatsapp")?.connected) {
				await upsertIntegrationStatus(user.id, "whatsapp", true, ["messages", "message_templates"]);
				fromDB.set("whatsapp", {
					service: "whatsapp",
					connected: true,
					scopes: ["messages", "message_templates"],
					connected_at: (/* @__PURE__ */ new Date()).toISOString(),
					metadata: {}
				});
			}
			const merged = new Map(fromDB);
			if (!calReachable) merged.set("google_calendar", {
				...fromDB.get("google_calendar") || {
					service: "google_calendar",
					scopes: [],
					connected_at: null,
					metadata: {}
				},
				connected: false
			});
			if (!gmailReachable) merged.set("gmail", {
				...fromDB.get("gmail") || {
					service: "gmail",
					scopes: [],
					connected_at: null,
					metadata: {}
				},
				connected: false
			});
			setStatuses(merged);
		} catch (err) {
			console.warn("[integrations] status load error:", err);
		} finally {
			setLoadingState(false);
		}
	}, [user?.id]);
	(0, import_react.useEffect)(() => {
		if (authLoading || !user?.id) return;
		const params = new URLSearchParams(window.location.search);
		const handleReturn = async () => {
			if (params.get("google_calendar_connected") === "true") {
				if (await handleGoogleOAuthReturn("google_calendar")) showNotification("Google Calendar connected successfully.");
				window.history.replaceState({}, "", "/integrations");
			}
			if (params.get("gmail_connected") === "true") {
				if (await handleGoogleOAuthReturn("gmail")) showNotification("Gmail connected successfully.");
				window.history.replaceState({}, "", "/integrations");
			}
			if (params.get("slack_connected") === "true") {
				await upsertIntegrationStatus(user.id, "slack", true, [
					"channels:history",
					"channels:read",
					"users:read"
				]);
				showNotification("Slack connected successfully.");
				window.history.replaceState({}, "", "/integrations");
			}
			if (params.get("slack_error")) {
				setError(`Slack connection failed: ${params.get("slack_error")}`);
				window.history.replaceState({}, "", "/integrations");
			}
			await refreshStatuses();
		};
		handleReturn();
	}, [
		authLoading,
		user?.id,
		refreshStatuses
	]);
	(0, import_react.useEffect)(() => {
		if (!authLoading && user?.id) refreshStatuses();
	}, [
		authLoading,
		user?.id,
		refreshStatuses
	]);
	function showNotification(msg) {
		setNotification(msg);
		setTimeout(() => setNotification(null), 4e3);
	}
	async function handleConfigure(id) {
		if (!user) return;
		if (id === "slack") {
			setSlackToken("");
			setSlackChannels("C0BDDSACL3D");
			setConfiguringSlack(true);
			return;
		}
		if (id === "whatsapp") {
			setWaAccessToken("");
			setWaPhoneNumberId("");
			setWaVerifyToken("wp_verify_swarm_token");
			setConfiguringWA(true);
			return;
		}
		setConnecting(id);
		setError(null);
		try {
			if (id === "google_calendar") await connectGoogleCalendar();
			else if (id === "gmail") await connectGmail();
			else showNotification(`${id} integration coming soon.`);
		} catch (err) {
			setError(`Failed to connect ${id}: ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			setConnecting(null);
		}
	}
	async function handleDisconnect(id) {
		if (!user) return;
		if (id === "slack") {
			setDisconnectText("");
			setDisconnectingSlack(true);
			return;
		}
		if (id === "whatsapp") {
			setWaDisconnectText("");
			setDisconnectingWA(true);
			return;
		}
		setSyncing(id);
		await disconnectIntegration(user.id, id);
		await refreshStatuses();
		setSyncing(null);
		showNotification(`${id} disconnected.`);
	}
	const handleSaveSlackConfig = async (e) => {
		e.preventDefault();
		if (!user) return;
		setSaveLoading(true);
		setError(null);
		try {
			const body = {
				botToken: slackToken.trim(),
				channels: slackChannels.split(",").map((c) => c.trim()).filter(Boolean)
			};
			if (!(await fetch(`http://localhost:3000/config`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body)
			})).ok) throw new Error("Failed to save Slack configuration.");
			await upsertIntegrationStatus(user.id, "slack", true, [
				"channels:history",
				"channels:read",
				"users:read"
			]);
			showNotification("Slack configuration saved successfully.");
			setConfiguringSlack(false);
			await refreshStatuses();
		} catch (err) {
			setError(err.message || "Failed to update configuration.");
		} finally {
			setSaveLoading(false);
		}
	};
	const handleDisconnectSlack = async (e) => {
		e.preventDefault();
		if (!user) return;
		if (disconnectText.toLowerCase() !== "disconnect slack") return;
		setDisconnectLoading(true);
		setError(null);
		try {
			if (!(await fetch(`http://localhost:3000/disconnect`, { method: "POST" })).ok) throw new Error("Failed to disconnect Slack.");
			await disconnectIntegration(user.id, "slack");
			showNotification("Slack disconnected successfully.");
			setDisconnectingSlack(false);
			await refreshStatuses();
		} catch (err) {
			setError(err.message || "Failed to disconnect Slack.");
		} finally {
			setDisconnectLoading(false);
		}
	};
	const handleSaveWhatsAppConfig = async (e) => {
		e.preventDefault();
		if (!user) return;
		setWaSaveLoading(true);
		setError(null);
		try {
			const body = {
				accessToken: waAccessToken.trim(),
				phoneNumberId: waPhoneNumberId.trim(),
				verifyToken: waVerifyToken.trim()
			};
			if (!(await fetch(`http://localhost:3003/config`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body)
			})).ok) throw new Error("Failed to save WhatsApp configuration.");
			await upsertIntegrationStatus(user.id, "whatsapp", true, ["messages", "message_templates"]);
			showNotification("WhatsApp configuration saved successfully.");
			setConfiguringWA(false);
			await refreshStatuses();
		} catch (err) {
			setError(err.message || "Failed to update configuration.");
		} finally {
			setWaSaveLoading(false);
		}
	};
	const handleDisconnectWhatsApp = async (e) => {
		e.preventDefault();
		if (!user) return;
		if (waDisconnectText.toLowerCase() !== "disconnect whatsapp") return;
		setWaDisconnectLoading(true);
		setError(null);
		try {
			if (!(await fetch(`http://localhost:3003/disconnect`, { method: "POST" })).ok) throw new Error("Failed to disconnect WhatsApp.");
			await disconnectIntegration(user.id, "whatsapp");
			showNotification("WhatsApp disconnected successfully.");
			setDisconnectingWA(false);
			await refreshStatuses();
		} catch (err) {
			setError(err.message || "Failed to disconnect WhatsApp.");
		} finally {
			setWaDisconnectLoading(false);
		}
	};
	async function handleSync(id) {
		setSyncing(id);
		await new Promise((r) => setTimeout(r, 800));
		await refreshStatuses();
		setSyncing(null);
		showNotification(`${id} status refreshed.`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1400px] px-6 pt-8 pb-28 animate-fade-in select-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-8 flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-mono tracking-widest text-muted-foreground uppercase",
						children: "MCP Integration Layer"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl",
						children: "Connected integrations"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "OAuth-authenticated MCP bridges for Calendar, Gmail, and Slack. Powered by real API calls."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "inline-flex items-center gap-2 rounded-xl border border-border bg-card text-foreground hover:bg-secondary/50 text-xs font-semibold px-4 py-2.5 transition-all shadow-sm",
						onClick: () => setShowWhitepaper(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-3.5 w-3.5" }), "Read whitepaper"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "inline-flex items-center gap-2 rounded-xl bg-foreground text-background hover:opacity-90 text-xs font-semibold px-4 py-2.5 transition-all shadow-sm",
						onClick: refreshStatuses,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3.5 w-3.5" }), "Refresh All"]
					})]
				})]
			}),
			notification && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 flex-shrink-0" }), notification]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-400 font-medium flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-4 w-4 flex-shrink-0" }),
					error,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setError(null),
						className: "ml-auto text-rose-400 hover:text-rose-600",
						children: "✕"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6",
				children: INTEGRATION_DEFS.map((def, idx) => {
					const status = statuses.get(def.id);
					const connected = !!status?.connected;
					const isSyncing = syncing === def.id;
					const isConnecting = connecting === def.id;
					const isUnavailable = [
						"github",
						"jira",
						"linear"
					].includes(String(def.id));
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: ["group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 flex flex-col gap-4 animate-scale-in", isUnavailable ? "opacity-[0.48] saturate-[0.18] grayscale-[0.3]" : "hover:shadow-md"].join(" "),
						style: { animationDelay: `${idx * 40}ms` },
						children: [
							loadingState && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute inset-0 rounded-2xl bg-card/70 flex items-center justify-center z-10",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin text-muted-foreground" })
							}),
							isUnavailable && !loadingState && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pointer-events-none absolute inset-0 z-[1] rounded-2xl bg-gradient-to-br from-slate-200/92 via-white/82 to-slate-300/90 dark:from-slate-100/34 dark:via-white/24 dark:to-slate-200/32 backdrop-blur-[2px]",
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative z-[2] flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/80 text-xl shadow-2xs group-hover:scale-105 transition-transform duration-300",
										children: def.icon
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
										className: "text-sm font-bold text-foreground tracking-tight flex items-center gap-1.5",
										children: [def.name, def.managed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30",
											children: "LIVE"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[10px] text-muted-foreground font-mono",
										children: ["MCP latency: ", def.latency]
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: ["px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 border flex-shrink-0", connected ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"].join(" "),
									children: [connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-3.5 w-3.5" }), connected ? "connected" : "disconnected"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "relative z-[2] text-xs text-muted-foreground leading-relaxed",
								children: def.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative z-[2] space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[9px] font-bold text-muted-foreground uppercase tracking-widest",
									children: connected && status?.scopes?.length ? "Granted scopes" : "Required scopes"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap gap-1.5",
									children: (connected && status?.scopes?.length ? status.scopes : def.permissions).map((perm) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] font-medium px-3 py-1 rounded-lg bg-secondary/50 text-secondary-foreground/90 border border-border/50 group-hover:border-border/80 group-hover:bg-secondary transition-all duration-300",
										children: perm
									}, perm))
								})]
							}),
							connected && status?.connected_at && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "relative z-[2] text-[10px] text-muted-foreground font-mono",
								children: ["Connected ", new Date(status.connected_at).toLocaleString()]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative z-[2] border-t border-border/50 pt-4 mt-auto flex items-center justify-between text-[11px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground font-mono",
									children: connected ? "Active" : def.id === "slack" || def.id === "whatsapp" ? "Requires Setup" : def.managed ? "Requires OAuth" : "Coming soon"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [
										connected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => handleSync(def.id),
											disabled: isSyncing,
											className: "h-8 px-3 rounded-lg border border-border bg-card hover:bg-secondary/40 text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1.5 transition-colors text-[11px]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: ["h-3.5 w-3.5", isSyncing ? "animate-spin text-mint" : ""].join(" ") }), "Sync"]
										}),
										def.managed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => connected ? handleDisconnect(def.id) : handleConfigure(def.id),
											disabled: isConnecting || isSyncing,
											className: [
												"h-8 px-3 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors text-[11px]",
												connected ? "border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400" : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400",
												isConnecting || isSyncing ? "opacity-60 cursor-not-allowed" : ""
											].join(" "),
											children: isConnecting ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }), "Connecting…"] }) : connected ? def.id === "slack" || def.id === "whatsapp" ? "Manage" : "Disconnect" : def.id === "slack" || def.id === "whatsapp" ? "Configure" : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-3.5 w-3.5" }), "Connect"] })
										}),
										!def.managed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											disabled: true,
											className: "h-8 px-3 rounded-lg border border-border bg-card text-muted-foreground/50 font-semibold text-[11px] cursor-not-allowed",
											children: "Configure"
										})
									]
								})]
							})
						]
					}, def.id);
				})
			}),
			!loadingState && !authLoading && user && [...INTEGRATION_DEFS.filter((d) => d.managed)].some((d) => !statuses.get(d.id)?.connected) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-10 rounded-2xl border border-border bg-card p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-bold text-foreground mb-3",
					children: "Setup instructions"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3 text-xs text-muted-foreground",
					children: [
						!statuses.get("google_calendar")?.connected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-foreground",
							children: "Google Calendar:"
						}), " Click Connect above — your Google account (already signed in) will be asked to grant calendar read access. No separate login required."] }),
						!statuses.get("gmail")?.connected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-foreground",
							children: "Gmail:"
						}), " Click Connect above — grants Gmail read access to your signed-in Google account."] }),
						!statuses.get("slack")?.connected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-foreground",
							children: "Slack:"
						}), " Click Configure above and enter your Slack User/Bot OAuth Token along with comma-separated channel IDs you want to monitor."] }),
						!statuses.get("whatsapp")?.connected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-foreground",
							children: "WhatsApp Business:"
						}), " Click Configure above and enter your Meta Access Token, Phone Number ID, and a Verify Token. Remember to run a local ngrok tunnel on port 3003 to forward webhooks."] })
					]
				})]
			}),
			showWhitepaper && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 bg-black/60 backdrop-blur-xs",
					onClick: () => setShowWhitepaper(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full max-w-4xl overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setShowWhitepaper(false),
						className: "absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-h-[86vh] overflow-y-auto px-6 py-6 sm:px-8 sm:py-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
								className: "mb-8 border-b border-border/60 pb-5 pr-10",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.28em] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400",
										children: "User Setup Whitepaper"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl",
										children: "How to connect your real integrations"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground",
										children: "This guide is written for the end user who wants these four integrations to work on their own machine. It combines the exact assumptions in this workspace with current official setup expectations from Google, Slack, and Meta."
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-5",
								children: WHITEPAPER_SECTIONS.map((section) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									className: "rounded-2xl border border-border/60 bg-secondary/20 p-5 sm:p-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-sm font-bold tracking-tight text-foreground sm:text-base",
											children: section.title
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-sm leading-7 text-muted-foreground",
											children: section.body
										}),
										section.bullets && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
											className: "mt-4 space-y-2.5",
											children: section.bullets.map((bullet) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
												className: "flex items-start gap-2.5 text-sm leading-6 text-foreground/88",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: bullet })]
											}, bullet))
										})
									]
								}, section.title))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
								className: "mt-8 rounded-2xl border border-border/60 bg-card px-5 py-4 text-xs leading-6 text-muted-foreground",
								children: [
									"Official references used for this modal:",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "text-foreground underline underline-offset-4",
										href: "https://developers.google.com/identity/protocols/oauth2/web-server",
										target: "_blank",
										rel: "noreferrer",
										children: "Google OAuth web server docs"
									}),
									",",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "text-foreground underline underline-offset-4",
										href: "https://developers.google.com/workspace/gmail/api/auth/scopes",
										target: "_blank",
										rel: "noreferrer",
										children: "Gmail scopes"
									}),
									",",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "text-foreground underline underline-offset-4",
										href: "https://api.slack.com/authentication/oauth-v2",
										target: "_blank",
										rel: "noreferrer",
										children: "Slack OAuth v2"
									}),
									",",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "text-foreground underline underline-offset-4",
										href: "https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started",
										target: "_blank",
										rel: "noreferrer",
										children: "WhatsApp Cloud API getting started"
									}),
									",",
									" ",
									"and",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "text-foreground underline underline-offset-4",
										href: "https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/create-webhook-endpoint/",
										target: "_blank",
										rel: "noreferrer",
										children: "Meta webhook setup"
									}),
									"."
								]
							})
						]
					})]
				})]
			}),
			configuringSlack && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 bg-black/60 backdrop-blur-xs",
					onClick: () => setConfiguringSlack(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setConfiguringSlack(false),
							className: "absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "mb-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg font-extrabold tracking-tight",
								children: "Configure Slack Integration"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground mt-1",
								children: "Enter your Slack Bot Token and channels to start active polling."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleSaveSlackConfig,
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[10px] font-bold text-muted-foreground uppercase tracking-wider block",
										children: "Slack Bot Token (xoxb-...)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "password",
										placeholder: "xoxb-...",
										value: slackToken,
										onChange: (e) => setSlackToken(e.target.value),
										className: "w-full rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm focus:border-foreground focus:outline-hidden transition-all font-mono",
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[10px] font-bold text-muted-foreground uppercase tracking-wider block",
										children: "Monitored Channel IDs (comma-separated)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										placeholder: "C0BDDSACL3D",
										value: slackChannels,
										onChange: (e) => setSlackChannels(e.target.value),
										className: "w-full rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm focus:border-foreground focus:outline-hidden transition-all font-mono",
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
									className: "flex items-center justify-end gap-3 pt-4 border-t border-border/50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setConfiguringSlack(false),
										className: "px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors",
										children: "Cancel"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "submit",
										disabled: saveLoading,
										className: "inline-flex items-center gap-1.5 rounded-xl bg-foreground text-background hover:opacity-90 text-xs font-semibold px-5 py-2.5 transition-all shadow-sm",
										children: [saveLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }), "Save Configuration"]
									})]
								})
							]
						})
					]
				})]
			}),
			disconnectingSlack && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 bg-black/60 backdrop-blur-xs",
					onClick: () => setDisconnectingSlack(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-500/20 bg-card p-6 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setDisconnectingSlack(false),
							className: "absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "mb-6 flex flex-col items-center text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-6 w-6" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-extrabold tracking-tight",
									children: "Disconnect Slack Integration?"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground mt-2 leading-relaxed max-w-sm",
									children: "This will severe the active MCP connection, halt all automated polling for this integration, and delete local configuration files."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleDisconnectSlack,
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-[10px] font-bold text-rose-500 uppercase tracking-wider block text-center",
									children: [
										"Type ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
											className: "text-foreground select-none pointer-events-none",
											children: "disconnect slack"
										}),
										" to confirm"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "disconnect slack",
									value: disconnectText,
									onChange: (e) => setDisconnectText(e.target.value),
									className: "w-full rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-center text-sm font-mono focus:border-rose-500 focus:outline-hidden transition-all text-rose-500 placeholder:text-rose-500/30",
									required: true
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
								className: "mt-8 flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setDisconnectingSlack(false),
									className: "w-full rounded-xl border border-border bg-card px-4 py-3 text-xs font-bold text-foreground hover:bg-secondary transition-all",
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									disabled: disconnectLoading || disconnectText.toLowerCase() !== "disconnect slack",
									className: "w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 text-white px-4 py-3 text-xs font-bold hover:bg-rose-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
									children: disconnectLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : "Disconnect Slack"
								})]
							})]
						})
					]
				})]
			}),
			configuringWA && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 bg-black/60 backdrop-blur-xs",
					onClick: () => setConfiguringWA(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setConfiguringWA(false),
							className: "absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "mb-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg font-extrabold tracking-tight",
								children: "Configure WhatsApp Integration"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground mt-1",
								children: "Enter your Meta Graph API credentials to start receiving message webhooks."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleSaveWhatsAppConfig,
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[10px] font-bold text-muted-foreground uppercase tracking-wider block",
										children: "Meta System User Access Token"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "password",
										placeholder: "EAAB...",
										value: waAccessToken,
										onChange: (e) => setWaAccessToken(e.target.value),
										className: "w-full rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm focus:border-foreground focus:outline-hidden transition-all font-mono",
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[10px] font-bold text-muted-foreground uppercase tracking-wider block",
										children: "Phone Number ID"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										placeholder: "e.g. 10459382103859",
										value: waPhoneNumberId,
										onChange: (e) => setWaPhoneNumberId(e.target.value),
										className: "w-full rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm focus:border-foreground focus:outline-hidden transition-all font-mono",
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[10px] font-bold text-muted-foreground uppercase tracking-wider block",
										children: "Webhook Verify Token (Hub Verify)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										placeholder: "wp_verify_swarm_token",
										value: waVerifyToken,
										onChange: (e) => setWaVerifyToken(e.target.value),
										className: "w-full rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm focus:border-foreground focus:outline-hidden transition-all font-mono",
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
									className: "flex items-center justify-end gap-3 pt-4 border-t border-border/50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setConfiguringWA(false),
										className: "px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors",
										children: "Cancel"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "submit",
										disabled: waSaveLoading,
										className: "inline-flex items-center gap-1.5 rounded-xl bg-foreground text-background hover:opacity-90 text-xs font-semibold px-5 py-2.5 transition-all shadow-sm",
										children: [waSaveLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }), "Save Configuration"]
									})]
								})
							]
						})
					]
				})]
			}),
			disconnectingWA && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 bg-black/60 backdrop-blur-xs",
					onClick: () => setDisconnectingWA(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-500/20 bg-card p-6 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setDisconnectingWA(false),
							className: "absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "mb-6 flex flex-col items-center text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-6 w-6" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-extrabold tracking-tight",
									children: "Disconnect WhatsApp Integration?"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground mt-2 leading-relaxed max-w-sm",
									children: "This will severe the active webhook listener connection and stop processing customer message payloads."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleDisconnectWhatsApp,
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-[10px] font-bold text-rose-500 uppercase tracking-wider block text-center",
									children: [
										"Type ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
											className: "text-foreground select-none pointer-events-none",
											children: "disconnect whatsapp"
										}),
										" to confirm"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "disconnect whatsapp",
									value: waDisconnectText,
									onChange: (e) => setWaDisconnectText(e.target.value),
									className: "w-full rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-center text-sm font-mono focus:border-rose-500 focus:outline-hidden transition-all text-rose-500 placeholder:text-rose-500/30",
									required: true
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
								className: "mt-8 flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setDisconnectingWA(false),
									className: "w-full rounded-xl border border-border bg-card px-4 py-3 text-xs font-bold text-foreground hover:bg-secondary transition-all",
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									disabled: waDisconnectLoading || waDisconnectText.toLowerCase() !== "disconnect whatsapp",
									className: "w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 text-white px-4 py-3 text-xs font-bold hover:bg-rose-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
									children: waDisconnectLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : "Disconnect WhatsApp"
								})]
							})]
						})
					]
				})]
			})
		]
	});
}
//#endregion
export { IntegrationsPage as component };
