import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xpihsdeapqxqexcqjvmw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwaWhzZGVhcHF4cWV4Y3Fqdm13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4MjMsImV4cCI6MjA5Nzk3OTgyM30.Ixons1qO4sIh2Ah1ac6ph0pSdEnuSzKSn8XwMt9iUu4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Persist Google provider_token across page reloads ─────────────────────────
// Supabase only exposes provider_token in the SIGNED_IN event fired right after
// the OAuth redirect. Capture it here and write to localStorage so that
// the Dashboard and other pages can forward it to the Calendar MCP server
// even after a full page refresh.
supabase.auth.onAuthStateChange((_event, session) => {
  if (typeof window === "undefined") return;
  if (session?.provider_token) {
    sessionStorage.setItem("google_provider_token", session.provider_token);
    localStorage.setItem("google_provider_token", session.provider_token);
  }
});

