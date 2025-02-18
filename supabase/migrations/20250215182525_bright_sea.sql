-- Add likes_count column to reviews table
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- Create index for faster likes count queries
CREATE INDEX IF NOT EXISTS idx_reviews_likes_count ON reviews(likes_count);

-- Create likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS review_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  review_id uuid REFERENCES reviews(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, review_id)
);

-- Enable RLS on review_likes
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for review_likes
CREATE POLICY "Users can view all likes"
  ON review_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own likes"
  ON review_likes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update likes count
CREATE OR REPLACE FUNCTION update_review_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews 
    SET likes_count = likes_count + 1
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for likes count
DROP TRIGGER IF EXISTS update_review_likes_count_trigger ON review_likes;
CREATE TRIGGER update_review_likes_count_trigger
  AFTER INSERT OR DELETE ON review_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_likes_count();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_review_likes_user_id ON review_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id);