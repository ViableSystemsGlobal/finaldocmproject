-- Add a column to track where souls were converted to
ALTER TABLE soul_winning 
ADD COLUMN IF NOT EXISTS converted_to TEXT DEFAULT NULL;

-- Add a column to track when the conversion happened
ALTER TABLE soul_winning 
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN soul_winning.converted_to IS 'Where the soul was converted to (visitor, member)';
COMMENT ON COLUMN soul_winning.converted_at IS 'When the soul was converted'; 