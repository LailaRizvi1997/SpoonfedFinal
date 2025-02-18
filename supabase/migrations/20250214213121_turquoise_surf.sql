-- Drop existing list_favorites table if it exists
DROP TABLE IF EXISTS list_favorites;

-- Create list_favorites table with proper structure
CREATE TABLE list_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  list_id uuid REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, list_id)
);

-- Enable RLS
ALTER TABLE list_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view list favorites"
  ON list_favorites FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own list favorites"
  ON list_favorites FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_list_favorites_user_id ON list_favorites(user_id);
CREATE INDEX idx_list_favorites_list_id ON list_favorites(list_id);