-- Add spoon count columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS golden_spoon_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS wooden_spoon_count integer DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_golden_spoon_count ON users(golden_spoon_count);
CREATE INDEX IF NOT EXISTS idx_users_wooden_spoon_count ON users(wooden_spoon_count);

-- Create function to update user spoon counts
CREATE OR REPLACE FUNCTION update_user_spoon_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_golden_spoon THEN
      UPDATE users 
      SET golden_spoon_count = golden_spoon_count + 1
      WHERE id = NEW.user_id;
    END IF;
    IF NEW.is_wooden_spoon THEN
      UPDATE users 
      SET wooden_spoon_count = wooden_spoon_count + 1
      WHERE id = NEW.user_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_golden_spoon THEN
      UPDATE users 
      SET golden_spoon_count = GREATEST(0, golden_spoon_count - 1)
      WHERE id = OLD.user_id;
    END IF;
    IF OLD.is_wooden_spoon THEN
      UPDATE users 
      SET wooden_spoon_count = GREATEST(0, wooden_spoon_count - 1)
      WHERE id = OLD.user_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for spoon counts
DROP TRIGGER IF EXISTS update_user_spoon_counts_trigger ON reviews;
CREATE TRIGGER update_user_spoon_counts_trigger
  AFTER INSERT OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_user_spoon_counts();

-- Update existing spoon counts
WITH spoon_counts AS (
  SELECT 
    user_id,
    COUNT(*) FILTER (WHERE is_golden_spoon) as golden_count,
    COUNT(*) FILTER (WHERE is_wooden_spoon) as wooden_count
  FROM reviews
  GROUP BY user_id
)
UPDATE users u
SET 
  golden_spoon_count = COALESCE(sc.golden_count, 0),
  wooden_spoon_count = COALESCE(sc.wooden_count, 0)
FROM spoon_counts sc
WHERE u.id = sc.user_id;