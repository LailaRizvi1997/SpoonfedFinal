-- Drop existing list_favorites table if it exists
DROP TABLE IF EXISTS list_favorites;

-- Create list_favorites table with proper structure
CREATE TABLE IF NOT EXISTS list_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  list_id uuid REFERENCES lists(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, list_id)
);

-- Add favorites_count to lists table if it doesn't exist
ALTER TABLE lists
ADD COLUMN IF NOT EXISTS favorites_count integer DEFAULT 0;

-- Enable RLS
ALTER TABLE list_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view list favorites"
  ON list_favorites FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own list favorites"
  ON list_favorites FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update favorites count
CREATE OR REPLACE FUNCTION update_list_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE lists 
    SET favorites_count = favorites_count + 1
    WHERE id = NEW.list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE lists 
    SET favorites_count = GREATEST(0, favorites_count - 1)
    WHERE id = OLD.list_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for favorites count
DROP TRIGGER IF EXISTS update_list_favorites_count_trigger ON list_favorites;
CREATE TRIGGER update_list_favorites_count_trigger
  AFTER INSERT OR DELETE ON list_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_list_favorites_count();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_list_favorites_user_id ON list_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_list_favorites_list_id ON list_favorites(list_id);

-- Update existing favorites counts
WITH favorite_counts AS (
  SELECT 
    list_id,
    COUNT(*) as count
  FROM list_favorites
  GROUP BY list_id
)
UPDATE lists l
SET favorites_count = COALESCE(fc.count, 0)
FROM favorite_counts fc
WHERE l.id = fc.list_id;