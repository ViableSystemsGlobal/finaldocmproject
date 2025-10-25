-- Create payment_categories table
CREATE TABLE IF NOT EXISTS public.payment_categories (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT        NOT NULL,
  description               TEXT,
  category_type             TEXT        NOT NULL DEFAULT 'other',
  is_active                 BOOLEAN     NOT NULL DEFAULT true,
  requires_reference        BOOLEAN     NOT NULL DEFAULT false,
  processing_fee_percentage DECIMAL(5,2),
  "order"                   INTEGER     NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_categories_active ON public.payment_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_categories_order ON public.payment_categories("order");
CREATE INDEX IF NOT EXISTS idx_payment_categories_type ON public.payment_categories(category_type);

-- Enable RLS
ALTER TABLE public.payment_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_categories
-- Allow authenticated users to read payment categories
CREATE POLICY "Allow authenticated users to read payment_categories"
  ON public.payment_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to manage payment categories
CREATE POLICY "Allow service role to manage payment_categories"
  ON public.payment_categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users with admin privileges to manage payment categories
CREATE POLICY "Allow admin users to manage payment_categories"
  ON public.payment_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.payment_categories TO authenticated;
GRANT ALL ON public.payment_categories TO service_role;

-- Insert default payment categories with Stripe integration focus
INSERT INTO public.payment_categories (name, description, category_type, is_active, requires_reference, processing_fee_percentage, "order") VALUES
  ('Cash', 'Physical cash donations received in person', 'cash', true, false, 0.00, 1),
  ('Check', 'Paper check donations', 'cash', true, true, 0.00, 2),
  ('Credit Card (Stripe)', 'Credit card payments processed through Stripe', 'card', true, false, 2.90, 3),
  ('Debit Card (Stripe)', 'Debit card payments processed through Stripe', 'card', true, false, 2.90, 4),
  ('Bank Transfer (ACH)', 'Automated Clearing House bank transfers', 'bank', true, true, 0.80, 5),
  ('Online Payment', 'General online payment methods', 'digital', true, false, 2.50, 6),
  ('Mobile App Payment', 'Payments made through mobile applications', 'digital', true, false, 2.50, 7),
  ('PayPal', 'PayPal payment processing', 'digital', true, false, 3.49, 8),
  ('Apple Pay (Stripe)', 'Apple Pay processed through Stripe', 'digital', true, false, 2.90, 9),
  ('Google Pay (Stripe)', 'Google Pay processed through Stripe', 'digital', true, false, 2.90, 10),
  ('Cryptocurrency', 'Bitcoin, Ethereum, and other crypto donations', 'crypto', false, true, 1.00, 11),
  ('Venmo', 'Venmo digital payments', 'digital', false, false, 2.90, 12),
  ('Zelle', 'Zelle bank-to-bank transfers', 'bank', false, true, 0.00, 13),
  ('Wire Transfer', 'Bank wire transfers for large donations', 'bank', false, true, 0.00, 14),
  ('Stock/Securities', 'Stock donations and securities transfers', 'other', false, true, 0.00, 15)
ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_categories_updated_at
  BEFORE UPDATE ON public.payment_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.payment_categories IS 'Payment method categories for organizing transaction types with Stripe integration support';