
CREATE TABLE public.plc_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id text NOT NULL,
  balance integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plc_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can read sessions (needed for frontend)
CREATE POLICY "Anyone can read plc sessions" ON public.plc_sessions FOR SELECT USING (true);

-- Anyone can insert (PLC machine via edge function with service role)
CREATE POLICY "Anyone can insert plc sessions" ON public.plc_sessions FOR INSERT WITH CHECK (true);

-- Anyone can update (for balance updates)
CREATE POLICY "Anyone can update plc sessions" ON public.plc_sessions FOR UPDATE USING (true);

-- Anyone can delete (for cleanup)
CREATE POLICY "Anyone can delete plc sessions" ON public.plc_sessions FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.plc_sessions;
