-- Add RLS policies for campaign_recipients
-- First, drop any existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow read access to campaign_recipients for authenticated users" ON public.campaign_recipients;
DROP POLICY IF EXISTS "Allow insert access to campaign_recipients for authenticated users" ON public.campaign_recipients;
DROP POLICY IF EXISTS "Allow update access to campaign_recipients for authenticated users" ON public.campaign_recipients;
DROP POLICY IF EXISTS "Allow delete access to campaign_recipients for authenticated users" ON public.campaign_recipients;
DROP POLICY IF EXISTS "Communications staff can manage campaign recipients" ON public.campaign_recipients;

-- Create new policies that allow authenticated users to perform all operations
CREATE POLICY "Allow read access to campaign_recipients for authenticated users"
  ON public.campaign_recipients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to campaign_recipients for authenticated users"
  ON public.campaign_recipients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to campaign_recipients for authenticated users"
  ON public.campaign_recipients FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow delete access to campaign_recipients for authenticated users"
  ON public.campaign_recipients FOR DELETE
  TO authenticated
  USING (true); 