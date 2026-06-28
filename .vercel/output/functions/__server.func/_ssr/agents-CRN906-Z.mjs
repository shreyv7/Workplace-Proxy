import { n as require_jsx_runtime } from "../_libs/@lottiefiles/dotlottie-react+[...].mjs";
import { h as createFileRoute, m as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
require_jsx_runtime();
var $$splitComponentImporter = () => import("./agents-By4vy_Wd.mjs");
var Route = createFileRoute("/agents")({
	head: () => ({ meta: [{ title: "Agent Swarm — Workplace Proxy" }, {
		name: "description",
		content: "Inspect the live swarm runtime, fallback posture, dependency health, and last debate transcript."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
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
//#endregion
export { getAgentLatency as n, getAgentStatusTone as r, Route as t };
