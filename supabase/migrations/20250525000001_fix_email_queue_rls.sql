-- Drop existing RLS policies for email_queue
DROP POLICY IF EXISTS "Communications staff can manage email queue" ON public.email_queue;

-- Create new policies that allow authenticated users to perform all operations
CREATE POLICY "Allow read access to email_queue for authenticated users"
  ON public.email_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to email_queue for authenticated users"
  ON public.email_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to email_queue for authenticated users"
  ON public.email_queue FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow delete access to email_queue for authenticated users"
  ON public.email_queue FOR DELETE
  TO authenticated
  USING (true); 