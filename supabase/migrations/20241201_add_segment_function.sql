-- Create a function to count subscribers by segment
CREATE OR REPLACE FUNCTION count_subscribers_by_segment(segment_key TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM newsletter_subscribers
    WHERE status = 'active' 
    AND segments ? segment_key
  );
END;
$$ LANGUAGE plpgsql; 