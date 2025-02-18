/*
  # Add Gatekeep Feature

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `type` (text, subscription type)
      - `status` (text, subscription status)
      - `current_period_start` (timestamptz)
      - `current_period_end` (timestamptz)
      - `created_at` (timestamptz)

    - `gatekept_restaurants`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, references restaurants)
      - `user_id` (uuid, references users)
      - `review` (text, gatekeep justification)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)

  2. Changes
    - Add `is_premium` column to users table
    - Add `gatekeep_count` column to restaurants table

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users NOT NULL,
  type text NOT NULL CHECK (type IN ('hidden_gems_monthly', 'hidden_gems_yearly')),
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'expired')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, type)
);

-- Create gatekept_restaurants table
CREATE TABLE IF NOT EXISTS gatekept_restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants NOT NULL,
  user_id uuid REFERENCES users NOT NULL,
  review text NOT NULL CHECK (length(review) >= 100),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  UNIQUE(restaurant_id, user_id)
);

-- Add new columns to existing tables
DO $$ 
BEGIN
  -- Add is_premium to users if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE users ADD COLUMN is_premium boolean DEFAULT false;
  END IF;

  -- Add gatekeep_count to restaurants if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'gatekeep_count'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN gatekeep_count integer DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gatekept_restaurants ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  TO service_role
  USING (true);

-- Create policies for gatekept_restaurants
CREATE POLICY "Premium users can read all gatekept restaurants"
  ON gatekept_restaurants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_premium = true
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Users can read basic gatekept info"
  ON gatekept_restaurants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can gatekeep restaurants"
  ON gatekept_restaurants FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM gatekept_restaurants
      WHERE user_id = auth.uid()
      AND created_at > now() - interval '30 days'
    )
  );

CREATE POLICY "Users can remove own gatekeeps"
  ON gatekept_restaurants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update gatekeep count
CREATE OR REPLACE FUNCTION update_gatekeep_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE restaurants
    SET gatekeep_count = gatekeep_count + 1
    WHERE id = NEW.restaurant_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE restaurants
    SET gatekeep_count = GREATEST(0, gatekeep_count - 1)
    WHERE id = OLD.restaurant_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for gatekeep count
CREATE TRIGGER update_gatekeep_count_trigger
AFTER INSERT OR DELETE ON gatekept_restaurants
FOR EACH ROW
EXECUTE FUNCTION update_gatekeep_count();

-- Create function to check gatekeep eligibility
CREATE OR REPLACE FUNCTION check_gatekeep_eligibility(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM gatekept_restaurants
    WHERE gatekept_restaurants.user_id = $1
    AND created_at > now() - interval '30 days'
  );
END;
$$ LANGUAGE plpgsql;