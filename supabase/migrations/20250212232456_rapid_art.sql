/*
  # Add Restaurant Lists Support
  
  1. New Tables
    - lists
      - id: UUID (primary key)
      - user_id: UUID (foreign key to users)
      - name: text (list name)
      - description: text (optional)
      - cover_url: text (optional, for list cover image)
      - is_public: boolean (default true)
      - created_at: timestamptz
      - updated_at: timestamptz
    
    - list_restaurants
      - id: UUID (primary key)
      - list_id: UUID (foreign key to lists)
      - restaurant_id: UUID (foreign key to restaurants)
      - added_at: timestamptz
      - notes: text (optional)

  2. Security
    - Enable RLS on both tables
    - Add policies for reading and managing lists
    - Add policies for managing list restaurants
*/

-- Create lists table
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

-- Create list_restaurants table
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

-- Create updated_at trigger for lists
CREATE OR REPLACE FUNCTION update_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_lists_updated_at();

-- Create indexes
CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_lists_is_public ON lists(is_public);
CREATE INDEX idx_list_restaurants_list_id ON list_restaurants(list_id);
CREATE INDEX idx_list_restaurants_restaurant_id ON list_restaurants(restaurant_id);