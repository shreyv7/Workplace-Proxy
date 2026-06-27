-- ============================================================
-- Migration 002: user_integrations table
-- Run this in Supabase → SQL Editor (after migration 001)
-- ============================================================
--
-- Stores OAuth connection state for each user's third-party integrations.
-- Each row = one user × one service (google_calendar, gmail, slack).
--
-- The actual OAuth access tokens are NOT stored here for security:
--   - Google tokens come from the Supabase session (provider_token)
--   - Slack bot token is stored in the Slack MCP server process
-- This table tracks only the connection STATUS and metadata
-- so the frontend can show accurate connected/disconnected states.

CREATE TABLE IF NOT EXISTS public.user_integrations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service      TEXT NOT NULL,     -- 'google_calendar' | 'gmail' | 'slack'
  connected    BOOLEAN NOT NULL DEFAULT FALSE,
  scopes       TEXT[],            -- OAuth scopes granted (e.g. ['calendar.readonly'])
  connected_at TIMESTAMPTZ,       -- When the user last authorised this integration
  metadata     JSONB DEFAULT '{}',-- Service-specific metadata (e.g. slack workspace name)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_integrations_user_service_key UNIQUE (user_id, service)
);

CREATE INDEX IF NOT EXISTS user_integrations_user_id_idx ON public.user_integrations (user_id);

-- Reuse the set_updated_at trigger function from migration 001
DROP TRIGGER IF EXISTS set_user_integrations_updated_at ON public.user_integrations;
CREATE TRIGGER set_user_integrations_updated_at
  BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_integrations"
  ON public.user_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_integrations"
  ON public.user_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_integrations"
  ON public.user_integrations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_integrations"
  ON public.user_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- ── Grant access ──────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_integrations TO anon, authenticated;
