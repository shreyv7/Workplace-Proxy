-- Migration 002: telemetry_history table

CREATE TABLE IF NOT EXISTS public.telemetry_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  hours_saved NUMERIC(5,2) DEFAULT 0,
  cognitive_friction INTEGER DEFAULT 0,
  focus_hours_protected NUMERIC(4,2) DEFAULT 0,
  clarity_score INTEGER DEFAULT 0,
  context_switches_prevented INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS and grant access
ALTER TABLE public.telemetry_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all" ON public.telemetry_history
  FOR SELECT USING (true);

CREATE POLICY "Allow write access to all" ON public.telemetry_history
  FOR ALL USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.telemetry_history TO anon, authenticated;

-- Seed data for past 30 days (daily stats)
INSERT INTO public.telemetry_history (date, hours_saved, cognitive_friction, focus_hours_protected, clarity_score, context_switches_prevented)
VALUES
  (CURRENT_DATE - INTERVAL '29 days', 1.5, 30, 3.5, 80, 1),
  (CURRENT_DATE - INTERVAL '28 days', 2.0, 32, 4.0, 82, 2),
  (CURRENT_DATE - INTERVAL '27 days', 2.2, 35, 4.2, 85, 2),
  (CURRENT_DATE - INTERVAL '26 days', 2.5, 40, 4.5, 87, 3),
  (CURRENT_DATE - INTERVAL '25 days', 1.8, 28, 3.8, 88, 1),
  (CURRENT_DATE - INTERVAL '24 days', 1.2, 25, 3.0, 89, 0),
  (CURRENT_DATE - INTERVAL '23 days', 1.9, 31, 4.0, 90, 2),
  (CURRENT_DATE - INTERVAL '22 days', 2.4, 34, 4.5, 91, 3),
  (CURRENT_DATE - INTERVAL '21 days', 2.8, 38, 4.8, 92, 4),
  (CURRENT_DATE - INTERVAL '20 days', 3.0, 42, 5.0, 93, 4),
  (CURRENT_DATE - INTERVAL '19 days', 2.1, 29, 4.1, 91, 2),
  (CURRENT_DATE - INTERVAL '18 days', 1.5, 26, 3.5, 90, 1),
  (CURRENT_DATE - INTERVAL '17 days', 2.0, 32, 4.0, 92, 2),
  (CURRENT_DATE - INTERVAL '16 days', 2.5, 36, 4.5, 93, 3),
  (CURRENT_DATE - INTERVAL '15 days', 2.9, 39, 4.9, 94, 4),
  (CURRENT_DATE - INTERVAL '14 days', 3.2, 44, 5.2, 95, 5),
  (CURRENT_DATE - INTERVAL '13 days', 2.3, 30, 4.2, 93, 2),
  (CURRENT_DATE - INTERVAL '12 days', 1.6, 27, 3.6, 92, 1),
  (CURRENT_DATE - INTERVAL '11 days', 2.2, 33, 4.1, 94, 2),
  (CURRENT_DATE - INTERVAL '10 days', 2.7, 37, 4.6, 95, 3),
  (CURRENT_DATE - INTERVAL '9 days', 3.1, 41, 5.0, 96, 4),
  (CURRENT_DATE - INTERVAL '8 days', 3.4, 45, 5.5, 97, 5),
  (CURRENT_DATE - INTERVAL '7 days', 2.5, 32, 4.3, 95, 2),
  -- Last 7 days (Weekly analysis view mapping matches Mon-Fri)
  (CURRENT_DATE - INTERVAL '6 days', 2.0, 35, 4.5, 96, 2), -- Mon
  (CURRENT_DATE - INTERVAL '5 days', 3.0, 68, 3.0, 92, 3), -- Tue
  (CURRENT_DATE - INTERVAL '4 days', 3.5, 50, 5.5, 95, 4), -- Wed
  (CURRENT_DATE - INTERVAL '3 days', 4.0, 42, 6.0, 96, 5), -- Thu
  (CURRENT_DATE - INTERVAL '2 days', 2.5, 25, 4.0, 97, 2), -- Fri
  (CURRENT_DATE - INTERVAL '1 days', 1.0, 15, 2.0, 98, 1), -- Sat
  (CURRENT_DATE, 4.1, 18, 5.0, 96, 6) -- Sun
ON CONFLICT (date) DO NOTHING;
