/*
  # Add followers functionality

  1. New Tables
    - `followers` table for tracking user follows
      - `follower_id` (uuid, references users)
      - `following_id` (uuid, references users)
      - `created_at` (timestamp)

  2. Changes
    - Add follower/following count columns to users table
    - Add trigger to maintain counts

  3. Security
    - Enable RLS
    - Add policies for viewing and managing follows
*/

-- Create followers table
CREATE TABLE IF NOT EXISTS followers (
  follower_id uuid REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- Add follower count columns to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;

-- Enable RLS
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view followers"
  ON followers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own follows"
  ON followers FOR ALL
  TO authenticated
  USING (auth.uid() = follower_id);

-- Create function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment counts
    UPDATE users 
    SET followers_count = followers_count + 1
    WHERE id = NEW.following_id;
    
    UPDATE users 
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement counts
    UPDATE users 
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE id = OLD.following_id;
    
    UPDATE users 
    SET following_count = GREATEST(0, following_count - 1)
    WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_follower_counts_trigger
  AFTER INSERT OR DELETE ON followers
  FOR EACH ROW
  EXECUTE FUNCTION update_follower_counts();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_users_followers_count ON users(followers_count);
CREATE INDEX IF NOT EXISTS idx_users_following_count ON users(following_count);