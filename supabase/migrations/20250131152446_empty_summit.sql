/*
  # Add Restaurant Gatekeeping System

  1. New Tables
    - `gatekeeps`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `restaurant_id` (uuid, references restaurants)
      - `created_at` (timestamptz)
      - `can_remove_at` (timestamptz) - Date when the gatekeep can be removed (30 days after creation)
      - `removed_at` (timestamptz, nullable) - When the gatekeep was removed

  2. Changes
    - Add `gatekeep_count` to restaurants table
    - Add `is_premium` to users table

  3. Security
    - Enable RLS on new tables
    - Add policies for gatekeep management
*/

-- Create gatekeeps table
CREATE TABLE IF NOT EXISTS gatekeeps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users ON DELETE CASCADE NOT NULL,
  restaurant_id uuid REFERENCES restaurants ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  can_remove_at timestamptz NOT NULL,
  removed_at timestamptz,
  UNIQUE(user_id, restaurant_id)
);

-- Add columns to existing tables
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS gatekeep_count integer DEFAULT 0;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;

-- Enable RLS
ALTER TABLE gatekeeps ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own gatekeeps"
  ON gatekeeps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Premium users can view all active gatekeeps"
  ON gatekeeps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND is_premium = true
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Users can create gatekeeps"
  ON gatekeeps FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND NOT EXISTS (
      SELECT 1 FROM gatekeeps 
      WHERE user_id = auth.uid() 
      AND created_at > now() - interval '30 days'
      AND removed_at IS NULL
    )
  );

CREATE POLICY "Users can remove their own gatekeeps"
  ON gatekeeps FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND now() >= can_remove_at
    AND removed_at IS NULL
  )
  WITH CHECK (
    removed_at IS NOT NULL
  );

-- Create function to update gatekeep count
CREATE OR REPLACE FUNCTION update_gatekeep_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE restaurants 
    SET gatekeep_count = gatekeep_count + 1
    WHERE id = NEW.restaurant_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.removed_at IS NOT NULL AND OLD.removed_at IS NULL THEN
    UPDATE restaurants 
    SET gatekeep_count = GREATEST(0, gatekeep_count - 1)
    WHERE id = NEW.restaurant_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for gatekeep count
DROP TRIGGER IF EXISTS update_gatekeep_count_trigger ON gatekeeps;
CREATE TRIGGER update_gatekeep_count_trigger
AFTER INSERT OR UPDATE ON gatekeeps
FOR EACH ROW
EXECUTE FUNCTION update_gatekeep_count();

-- Create function to check gatekeep eligibility
CREATE OR REPLACE FUNCTION check_gatekeep_eligibility(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM gatekeeps
    WHERE gatekeeps.user_id = $1
    AND created_at > now() - interval '30 days'
    AND removed_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to get gatekept restaurants
CREATE OR REPLACE FUNCTION get_gatekept_restaurants(is_premium boolean)
RETURNS TABLE (
  id uuid,
  name text,
  cuisine_type text,
  neighborhood text,
  gatekeep_count integer,
  gatekeepers jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.cuisine_type,
    r.address as neighborhood,
    r.gatekeep_count,
    CASE WHEN is_premium THEN
      jsonb_agg(
        jsonb_build_object(
          'user_id', u.id,
          'username', u.username,
          'created_at', g.created_at
        )
      )
    ELSE
      NULL
    END as gatekeepers
  FROM restaurants r
  JOIN gatekeeps g ON g.restaurant_id = r.id AND g.removed_at IS NULL
  JOIN users u ON u.id = g.user_id
  WHERE r.gatekeep_count > 0
  GROUP BY r.id, r.name, r.cuisine_type, r.address, r.gatekeep_count;
END;
$$ LANGUAGE plpgsql;