-- Create helper functions for email statistics

-- Function to get all email stats
CREATE OR REPLACE FUNCTION get_all_email_stats()
RETURNS TABLE (
  status TEXT,
  count BIGINT
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT status, COUNT(*)::BIGINT
  FROM email_queue
  GROUP BY status
  ORDER BY status;
$$;

-- Function to get email stats for a specific campaign
CREATE OR REPLACE FUNCTION get_email_stats_by_campaign(campaign_id UUID)
RETURNS TABLE (
  status TEXT,
  count BIGINT
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT status, COUNT(*)::BIGINT
  FROM email_queue
  WHERE metadata->>'campaign_id' = campaign_id::TEXT
  GROUP BY status
  ORDER BY status;
$$;

-- Add RLS policies for the functions
GRANT EXECUTE ON FUNCTION get_all_email_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_email_stats_by_campaign TO authenticated; 