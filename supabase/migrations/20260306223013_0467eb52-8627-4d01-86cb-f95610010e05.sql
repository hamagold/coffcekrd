
-- Create orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total integer NOT NULL DEFAULT 0,
  payment text NOT NULL DEFAULT 'cash',
  order_type text NOT NULL DEFAULT 'dine',
  lang text NOT NULL DEFAULT 'en',
  status text NOT NULL DEFAULT 'pending',
  customer_name text,
  customer_phone text,
  customer_address text,
  is_online boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (admins) to read all orders
CREATE POLICY "Authenticated users can read orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert orders
CREATE POLICY "Authenticated users can insert orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow anonymous users to insert orders (for online ordering)
CREATE POLICY "Anonymous users can insert orders"
  ON public.orders FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to delete orders (clear all)
CREATE POLICY "Authenticated users can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'super'::app_role));

-- Allow authenticated users to update orders
CREATE POLICY "Authenticated users can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
