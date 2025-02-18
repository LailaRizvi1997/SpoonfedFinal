/*
  # Initial Schema for SpoonFed

  1. Tables
    - users
      - id (uuid, primary key)
      - username (text, unique)
      - full_name (text)
      - avatar_url (text)
      - created_at (timestamp)
    
    - cuisine_preferences
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - region (text)
      - cuisine (text)
      - created_at (timestamp)
    
    - restaurants
      - id (uuid, primary key)
      - name (text)
      - google_place_id (text, unique)
      - cuisine_type (text)
      - location (text)
      - rating_avg (numeric)
      - visit_count (integer)
      - created_at (timestamp)
    
    - reviews
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - restaurant_id (uuid, foreign key)
      - rating (integer)
      - text (text)
      - photo_url (text)
      - is_golden_spoon (boolean)
      - is_wooden_spoon (boolean)
      - created_at (timestamp)
    
    - lists
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - name (text)
      - is_public (boolean)
      - like_count (integer)
      - created_at (timestamp)
    
    - list_restaurants
      - id (uuid, primary key)
      - list_id (uuid, foreign key)
      - restaurant_id (uuid, foreign key)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Cuisine preferences table
CREATE TABLE cuisine_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  region text NOT NULL,
  cuisine text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cuisine_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all cuisine preferences"
  ON cuisine_preferences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own cuisine preferences"
  ON cuisine_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Restaurants table
CREATE TABLE restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  google_place_id text UNIQUE NOT NULL,
  cuisine_type text NOT NULL,
  location text NOT NULL,
  rating_avg numeric DEFAULT 0,
  visit_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read restaurants"
  ON restaurants FOR SELECT
  TO authenticated
  USING (true);

-- Reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text text NOT NULL CHECK (length(text) <= 200),
  photo_url text,
  is_golden_spoon boolean DEFAULT false,
  is_wooden_spoon boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own reviews"
  ON reviews FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Lists table
CREATE TABLE lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_public boolean DEFAULT true,
  like_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read public lists"
  ON lists FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own lists"
  ON lists FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- List restaurants table
CREATE TABLE list_restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid REFERENCES lists(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(list_id, restaurant_id)
);

ALTER TABLE list_restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read public list restaurants"
  ON list_restaurants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_id
      AND (lists.is_public = true OR lists.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own list restaurants"
  ON list_restaurants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_id
      AND lists.user_id = auth.uid()
    )
  );