-- Create lists table if it doesn't exist
CREATE TABLE IF NOT EXISTS lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) <= 100),
  description text CHECK (char_length(description) <= 500),
  cover_url text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create list_restaurants table if it doesn't exist
CREATE TABLE IF NOT EXISTS list_restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid REFERENCES lists(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  notes text CHECK (char_length(notes) <= 500),
  UNIQUE(list_id, restaurant_id)
);

-- Enable RLS
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_restaurants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view public lists" ON lists;
  DROP POLICY IF EXISTS "Users can create lists" ON lists;
  DROP POLICY IF EXISTS "Users can update own lists" ON lists;
  DROP POLICY IF EXISTS "Users can delete own lists" ON lists;
  DROP POLICY IF EXISTS "Users can view list restaurants for accessible lists" ON list_restaurants;
  DROP POLICY IF EXISTS "Users can manage restaurants in own lists" ON list_restaurants;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies for lists
CREATE POLICY "Users can view public lists"
  ON lists FOR SELECT
  TO authenticated
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can create lists"
  ON lists FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own lists"
  ON lists FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own lists"
  ON lists FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for list_restaurants
CREATE POLICY "Users can view list restaurants for accessible lists"
  ON list_restaurants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_id
      AND (lists.is_public = true OR lists.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage restaurants in own lists"
  ON list_restaurants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_id
      AND lists.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_lists_updated_at ON lists;

-- Create trigger
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_lists_updated_at();

-- Create indexes
DROP INDEX IF EXISTS idx_lists_user_id;
DROP INDEX IF EXISTS idx_lists_is_public;
DROP INDEX IF EXISTS idx_list_restaurants_list_id;
DROP INDEX IF EXISTS idx_list_restaurants_restaurant_id;

CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_lists_is_public ON lists(is_public);
CREATE INDEX idx_list_restaurants_list_id ON list_restaurants(list_id);
CREATE INDEX idx_list_restaurants_restaurant_id ON list_restaurants(restaurant_id);