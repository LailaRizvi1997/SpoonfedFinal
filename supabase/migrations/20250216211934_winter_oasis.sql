/*
  # Add Comments Feature

  1. New Tables
    - `review_comments` table for storing comments on reviews
      - `id` (uuid, primary key)
      - `review_id` (uuid, references reviews)
      - `user_id` (uuid, references users)
      - `content` (text, max 280 chars)
      - `created_at` (timestamptz)
      - `likes_count` (integer)

  2. Changes
    - Add `comments_count` column to reviews table
    - Add trigger to maintain comments count
    - Add indexes for better performance

  3. Security
    - Enable RLS
    - Add policies for viewing and managing comments
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) <= 280),
  created_at timestamptz DEFAULT now(),
  likes_count integer DEFAULT 0
);

-- Add comments_count to reviews table
DO $$ 
BEGIN
  ALTER TABLE reviews ADD COLUMN comments_count integer DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
  CREATE POLICY "Anyone can view comments"
    ON review_comments FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Users can create comments"
    ON review_comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can delete own comments"
    ON review_comments FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create function to update comments count
CREATE OR REPLACE FUNCTION update_review_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews 
    SET comments_count = comments_count + 1
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews 
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_review_comments_count_trigger ON review_comments;
CREATE TRIGGER update_review_comments_count_trigger
  AFTER INSERT OR DELETE ON review_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_review_comments_count();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON review_comments(review_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_user_id ON review_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_comments_count ON reviews(comments_count);