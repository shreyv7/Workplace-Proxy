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

export const API_BASE_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? "http://localhost:8000";

// ── Enumerations ──────────────────────────────────────────────────────────────

export type MessageSource = "slack" | "email" | "jira" | "teams";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export type BlockType = "deep_work" | "shallow_work" | "meeting" | "admin";

// ── Request types ─────────────────────────────────────────────────────────────

export interface ProcessRequest {
  /** Unique ID of the message from the source system (Slack ts, email msgid, etc.) */
  message_id: string;
  /** Platform the message originated from */
  source: MessageSource;
  /** Human-readable name of the message sender */
  sender_name: string;
  /** Sender's title or role in the organisation, if known */
  sender_role?: string;
  /** Raw text content of the message — NOTE: mock-data calls this "original_text" */
  content: string;
  /** ISO 8601 timestamp. Defaults to server-side "now" if omitted. */
  timestamp?: string;
  /** Prior messages in the thread, oldest first */
  thread_context?: string[];
  /** ID of the neurodivergent user who received the message */
  user_id: string;
  /**
   * Google OAuth access token from the Supabase session (session.provider_token).
   * Forwarded by the backend as Authorization: Bearer to Calendar and Gmail MCP servers.
   * Omit when the user has not connected Google integrations — MCPs fall back to demo mode.
   */
  google_access_token?: string;
}

export interface FeedbackRequest {
  /** request_id from the original ProcessResponse */
  request_id: string;
  /** 1 = poor, 5 = excellent */
  rating: number;
  user_id: string;
  notes?: string;
}

// ── Response types ────────────────────────────────────────────────────────────

export interface ActionItem {
  description: string;
  is_time_sensitive: boolean;
}

export interface TranslatedTask {
  title: string;
  description: string;
  action_items: ActionItem[];
  urgency: UrgencyLevel;
  /** ISO 8601 datetime or null */
  inferred_deadline: string | null;
  explicit_deadline_given: boolean;
  decoded_subtext: string | null;
}

export interface CalendarSlot {
  /** ISO 8601 datetime */
  suggested_start: string;
  /** ISO 8601 datetime */
  suggested_end: string;
  duration_minutes: number;
  block_type: BlockType;
  rationale: string;
}

export interface AgentDebatePosition {
  agent_name: string;
  approved: boolean;
  summary: string;
}

export interface DebateSummary {
  rounds_completed: number;
  consensus_reached: boolean;
  final_positions: AgentDebatePosition[];
  dissenting_concerns: string[];
}

export interface ProcessResponse {
  /** UUID string — use as debate_id / reference for feedback */
  request_id: string;
  original_message: string;
  translated_task: TranslatedTask;
  /** null when the Calendar MCP was unavailable during processing */
  calendar_slot: CalendarSlot | null;
  debate_summary: DebateSummary;
  /** 0.0–1.0 composite confidence score */
  confidence_score: number;
  processing_time_ms: number;
  /** Non-fatal warnings, e.g. "calendar unavailable, using fallback" */
  warnings: string[];
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  dependencies: Record<string, string>;
}

export interface DebugRuntimeAgent {
  id: string;
  display_name: string;
  name: string;
  role: string;
  primary_runtime: string;
  llm_backend: string;
  dependency: string;
  fallback_chain: string[];
  confidence_baseline: number | null;
  expertise: string[];
  limitations: string[];
}

export interface DebugRuntimeResponse {
  backend_mode: string;
  lyzr_enabled: boolean;
  lyzr_per_agent: boolean;
  adk_interceptor_enabled: boolean;
  mcp_transport: string;
  consensus_threshold: number;
  max_debate_rounds: number;
  agents: DebugRuntimeAgent[];
  last_transcript_available: boolean;
}

export interface DebugMetricsResponse {
  messages_processed: number;
  total_latency_ms: number;
  average_latency_ms: number;
  consensus_reached: number;
  consensus_rate: number;
  total_debate_rounds: number;
  average_debate_rounds: number;
  fallback_events: number;
  fallback_rate: number;
  demo_mode_hits: number;
}

export interface DebugTranscriptMessage {
  sender: string;
  recipient: string;
  type: string;
  confidence: number;
  reasoning: string;
  recommendations: string[];
  timestamp: string;
}

export interface DebugTranscriptConsensusRound {
  round: number;
  reached: boolean;
  approved_count: number;
  threshold: number;
  concerns: string[];
  dominant_objection: string | null;
  conflicting_concerns: string[];
}

export interface DebugTranscriptResponse {
  request_id: string;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  rounds_completed: number;
  final_consensus: boolean;
  final_confidence: number;
  total_processing_ms: number;
  stage_latencies: Record<string, number>;
  fallback_events: string[];
  consensus_history: DebugTranscriptConsensusRound[];
  confidence_history: Array<{
    round: number;
    score: number;
    approved_count: number;
    reached_consensus: boolean;
  }>;
  messages: DebugTranscriptMessage[];
}

export type ReplyTone = "professional" | "casual" | "concise";

export interface ReplyDraft {
  text: string;
  tone: ReplyTone;
  word_count: number;
}

export interface GenerateReplyRequest {
  message_id: string;
  original_content: string;
  sender_name: string;
  tone?: ReplyTone;
  additional_context?: string;
}

export interface GenerateReplyResponse {
  success: boolean;
  drafts: ReplyDraft[];
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, (err as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a workplace message through the multi-agent pipeline.
 * POST /api/v1/process
 */
export async function processMessage(req: ProcessRequest): Promise<ProcessResponse> {
  return postJson<ProcessResponse>("/api/v1/process", req);
}

/**
 * Submit the user's 1–5 quality rating for a translation result.
 * POST /api/v1/feedback
 */
export async function submitFeedback(req: FeedbackRequest): Promise<FeedbackResponse> {
  return postJson<FeedbackResponse>("/api/v1/feedback", req);
}

/**
 * Check whether the backend is reachable and all dependencies are up.
 * GET /api/v1/health
 */
export async function checkHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>("/api/v1/health");
}

export async function getRuntimeSnapshot(): Promise<DebugRuntimeResponse> {
  return getJson<DebugRuntimeResponse>("/api/v1/debug/runtime");
}

export async function getDebugMetrics(): Promise<DebugMetricsResponse> {
  return getJson<DebugMetricsResponse>("/api/v1/debug/metrics");
}

export async function getDebugTranscript(): Promise<DebugTranscriptResponse> {
  return getJson<DebugTranscriptResponse>("/api/v1/debug/transcript");
}

export interface UpdateSettingsRequest {
  debate_consensus_threshold?: number;
  max_debate_rounds?: number;
}

export async function updateDebugSettings(req: UpdateSettingsRequest): Promise<{ status: string }> {
  return postJson<{ status: string }>("/api/v1/debug/settings", req);
}

export async function generateReplyDrafts(
  req: GenerateReplyRequest,
): Promise<GenerateReplyResponse> {
  return postJson<GenerateReplyResponse>("/api/v1/generate-reply", req);
}

export { ApiError };
