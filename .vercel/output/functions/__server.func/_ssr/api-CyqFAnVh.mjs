//#region node_modules/.nitro/vite/services/ssr/assets/api-CyqFAnVh.js
/**
* Backend API client for Workplace Proxy — Role 2 (Multi-Agent Orchestrator).
*
* TypeScript types mirror the backend's Pydantic schemas in
* backend/orchestrator/api/schemas.py exactly. Keep them in sync.
*
* Backend base URL is read from the VITE_BACKEND_URL environment variable.
* Set it in your .env file:
*   VITE_BACKEND_URL=http://localhost:8000
*
* Schema mapping note — the frontend's ClarityMessage mock type uses different
* field names from the real API. When building requests from mock data:
*   ClarityMessage.original_text  →  ProcessRequest.content
*   ClarityMessage.message_id     →  ProcessRequest.message_id  (same)
*   ClarityMessage.source         →  ProcessRequest.source      (same values)
*   ClarityMessage.sender_name    →  ProcessRequest.sender_name (same)
*   ClarityMessage.sender_role    →  ProcessRequest.sender_role (same)
*   user_id                       →  must be supplied by the app (not in mock)
*
* When mapping responses back to display:
*   ProcessResponse.translated_task.title            →  ClarityMessage.translated_bullet_points.action
*   ProcessResponse.translated_task.action_items[].description →  ClarityMessage.translated_bullet_points.steps
*   ProcessResponse.translated_task.urgency          →  ClarityMessage.importance
*   ProcessResponse.calendar_slot.suggested_start    →  ClarityMessage.suggested_start_time (parse ISO → HH:MM)
*   ProcessResponse.calendar_slot.suggested_end      →  ClarityMessage.suggested_end_time   (parse ISO → HH:MM)
*   ProcessResponse.translated_task.decoded_subtext  →  ClarityMessage.reasoning
*   ProcessResponse.request_id                       →  ClarityMessage.debate_id
*   ProcessResponse.confidence_score                 →  ClarityMessage.fidelity_rating (scale 0–1 → 1–5)
*/
var API_BASE_URL = "http://localhost:8000";
var ApiError = class extends Error {
	status;
	constructor(status, message) {
		super(message);
		this.status = status;
		this.name = "ApiError";
	}
};
async function postJson(path, body) {
	const res = await fetch(`${API_BASE_URL}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({ detail: res.statusText }));
		throw new ApiError(res.status, err.detail ?? `HTTP ${res.status}`);
	}
	return res.json();
}
async function getJson(path) {
	const res = await fetch(`${API_BASE_URL}${path}`);
	if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
	return res.json();
}
/**
* Check whether the backend is reachable and all dependencies are up.
* GET /api/v1/health
*/
async function checkHealth() {
	return getJson("/api/v1/health");
}
async function getRuntimeSnapshot() {
	return getJson("/api/v1/debug/runtime");
}
async function getDebugMetrics() {
	return getJson("/api/v1/debug/metrics");
}
async function getDebugTranscript() {
	return getJson("/api/v1/debug/transcript");
}
async function updateDebugSettings(req) {
	return postJson("/api/v1/debug/settings", req);
}
async function generateReplyDrafts(req) {
	return postJson("/api/v1/generate-reply", req);
}
async function getDailyClarity(date, userId, googleAccessToken) {
	return getJson(`/api/v1/daily-clarity?date=${date}&user_id=${userId}${googleAccessToken ? `&google_access_token=${encodeURIComponent(googleAccessToken)}` : ""}`);
}
async function saveDailyNotes(userId, date, content) {
	return postJson("/api/v1/daily-clarity/notes", {
		user_id: userId,
		date,
		content
	});
}
async function rescheduleBlock(userId, blockId, newStart, newEnd) {
	return postJson("/api/v1/daily-clarity/reschedule", {
		user_id: userId,
		block_id: blockId,
		new_start: newStart,
		new_end: newEnd
	});
}
var MEMORY_SERVICE_URL = "http://localhost:8001";
async function getUserContext(userId, query = "user preferences focus cycles triggers") {
	const res = await fetch(`${MEMORY_SERVICE_URL}/context/user?user_id=${encodeURIComponent(userId)}&query=${encodeURIComponent(query)}`);
	if (!res.ok) throw new Error(`Memory service error: HTTP ${res.status}`);
	return res.json();
}
async function getCorporateContext(query = "corporate context projects jargon") {
	const res = await fetch(`${MEMORY_SERVICE_URL}/context/corporate?query=${encodeURIComponent(query)}`);
	if (!res.ok) throw new Error(`Memory service error: HTTP ${res.status}`);
	return res.json();
}
//#endregion
export { getCorporateContext as a, getDebugTranscript as c, rescheduleBlock as d, saveDailyNotes as f, generateReplyDrafts as i, getRuntimeSnapshot as l, ApiError as n, getDailyClarity as o, updateDebugSettings as p, checkHealth as r, getDebugMetrics as s, API_BASE_URL as t, getUserContext as u };
