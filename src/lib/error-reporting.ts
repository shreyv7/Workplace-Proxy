export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  // Fallback: log to console. Replace with a DSN or analytics call if desired.
  console.error("Reported error:", error, context);
}
