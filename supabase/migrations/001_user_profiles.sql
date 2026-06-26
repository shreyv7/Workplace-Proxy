-- ============================================================
-- Migration 001: user_profiles table
-- Run this in Supabase → SQL Editor
-- ============================================================

-- Create the user_profiles table referenced throughout the onboarding flow.
-- Each row stores one user's cognitive preferences collected during onboarding.
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cognitive_profile    TEXT,          -- 'adhd' | 'autism' | 'audhd' | 'high_load' | 'prefer_not_to_say'
  communication_style  TEXT,          -- 'checklists' | 'bullet_points' | 'short_paragraphs' | 'visual_kanban'
  peak_focus_time      TEXT,          -- 'morning' | 'afternoon' | 'evening' | 'variable'
  working_hours_start  TEXT,          -- e.g. '09:00'
  working_hours_end    TEXT,          -- e.g. '18:00'
  stress_triggers      TEXT[],        -- array: ['ambiguous_deadlines', 'vague_requests', ...]
  urgency_preference   TEXT,          -- 'assume_urgent' | 'use_context' | 'ask_clarification' | 'default_low'
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_profiles_user_id_key UNIQUE (user_id)
);

-- Index for the most common lookup pattern
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON public.user_profiles (user_id);

-- Automatically update updated_at on every row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and write only their own profile row
CREATE POLICY "users_select_own_profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Grant access to the anon and authenticated roles
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO anon, authenticated;
