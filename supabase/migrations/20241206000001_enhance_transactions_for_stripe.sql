-- Enhanced Transactions Schema for Stripe Integration
-- This migration adds Stripe-specific fields and creates supporting tables

-- 1. Add Stripe-specific columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS refunded_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurring_interval TEXT, -- monthly, yearly, etc.
ADD COLUMN IF NOT EXISTS fund_designation TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tax_deductible BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS acknowledgment_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS acknowledgment_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. Create stripe_webhooks table for webhook event tracking
CREATE TABLE IF NOT EXISTS public.stripe_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    event_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create donation_campaigns table for campaign tracking
CREATE TABLE IF NOT EXISTS public.donation_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    goal_amount DECIMAL(12,2),
    current_amount DECIMAL(12,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    campaign_type TEXT DEFAULT 'general', -- general, building, missions, emergency
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create recurring_donations table for subscription management
CREATE TABLE IF NOT EXISTS public.recurring_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    interval_type TEXT NOT NULL, -- month, year
    interval_count INTEGER DEFAULT 1,
    fund_designation TEXT DEFAULT 'General',
    status TEXT DEFAULT 'active', -- active, paused, cancelled, past_due
    next_payment_date DATE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create donation_receipts table for tax receipt management
CREATE TABLE IF NOT EXISTS public.donation_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    receipt_number TEXT UNIQUE NOT NULL,
    tax_year INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    tax_deductible_amount DECIMAL(10,2) NOT NULL,
    issued_date DATE DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create giving_statements table for annual statements
CREATE TABLE IF NOT EXISTS public.giving_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    statement_year INTEGER NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    tax_deductible_amount DECIMAL(12,2) NOT NULL,
    transaction_count INTEGER NOT NULL,
    statement_url TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    emailed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contact_id, statement_year)
);

-- 7. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent ON public.transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_customer ON public.transactions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON public.transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_fund_designation ON public.transactions(fund_designation);
CREATE INDEX IF NOT EXISTS idx_transactions_is_recurring ON public.transactions(is_recurring);
CREATE INDEX IF NOT EXISTS idx_transactions_transacted_at ON public.transactions(transacted_at);

CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_event_id ON public.stripe_webhooks(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_processed ON public.stripe_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_event_type ON public.stripe_webhooks(event_type);

CREATE INDEX IF NOT EXISTS idx_recurring_donations_contact_id ON public.recurring_donations(contact_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_stripe_subscription ON public.recurring_donations(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_status ON public.recurring_donations(status);

CREATE INDEX IF NOT EXISTS idx_donation_receipts_contact_id ON public.donation_receipts(contact_id);
CREATE INDEX IF NOT EXISTS idx_donation_receipts_tax_year ON public.donation_receipts(tax_year);
CREATE INDEX IF NOT EXISTS idx_donation_receipts_receipt_number ON public.donation_receipts(receipt_number);

CREATE INDEX IF NOT EXISTS idx_giving_statements_contact_year ON public.giving_statements(contact_id, statement_year);

-- 8. Add RLS policies (Row Level Security)
ALTER TABLE public.stripe_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giving_statements ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.stripe_webhooks
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.donation_campaigns
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.recurring_donations
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.donation_receipts
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.giving_statements
    FOR ALL USING (true) WITH CHECK (true);

-- 9. Grant permissions
GRANT ALL ON public.stripe_webhooks TO anon, authenticated, service_role;
GRANT ALL ON public.donation_campaigns TO anon, authenticated, service_role;
GRANT ALL ON public.recurring_donations TO anon, authenticated, service_role;
GRANT ALL ON public.donation_receipts TO anon, authenticated, service_role;
GRANT ALL ON public.giving_statements TO anon, authenticated, service_role;

-- 10. Create function to calculate net amount
CREATE OR REPLACE FUNCTION calculate_net_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate net amount as amount minus fees and refunds
    NEW.net_amount = NEW.amount - COALESCE(NEW.fee_amount, 0) - COALESCE(NEW.refunded_amount, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate net amount
DROP TRIGGER IF EXISTS trigger_calculate_net_amount ON public.transactions;
CREATE TRIGGER trigger_calculate_net_amount
    BEFORE INSERT OR UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_net_amount();

-- 11. Create function to update campaign totals
CREATE OR REPLACE FUNCTION update_campaign_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Update campaign total when a transaction is added/updated/deleted
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE donation_campaigns 
        SET current_amount = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM transactions 
            WHERE category = 'campaign_' || donation_campaigns.id::text
            AND payment_status = 'succeeded'
        ),
        updated_at = NOW()
        WHERE id::text = REPLACE(NEW.category, 'campaign_', '');
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE donation_campaigns 
        SET current_amount = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM transactions 
            WHERE category = 'campaign_' || donation_campaigns.id::text
            AND payment_status = 'succeeded'
        ),
        updated_at = NOW()
        WHERE id::text = REPLACE(OLD.category, 'campaign_', '');
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update campaign totals
DROP TRIGGER IF EXISTS trigger_update_campaign_total ON public.transactions;
CREATE TRIGGER trigger_update_campaign_total
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_total();

-- 12. Insert sample donation campaigns
INSERT INTO public.donation_campaigns (name, description, goal_amount, campaign_type) VALUES
('General Fund', 'Support our ongoing ministry and operations', 50000.00, 'general'),
('Building Fund', 'Help us expand our facilities to serve more people', 100000.00, 'building'),
('Missions Support', 'Support our global mission partners', 25000.00, 'missions'),
('Youth Ministry', 'Invest in the next generation', 15000.00, 'ministry')
ON CONFLICT DO NOTHING;

-- 13. Add updated_at trigger for tables that need it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_donation_campaigns_updated_at
    BEFORE UPDATE ON public.donation_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_donations_updated_at
    BEFORE UPDATE ON public.recurring_donations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Enhanced transactions schema for Stripe integration created successfully!' AS status; 