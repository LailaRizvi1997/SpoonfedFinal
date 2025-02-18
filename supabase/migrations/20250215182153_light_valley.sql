-- Add is_gatekept column to reviews table
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS is_gatekept boolean DEFAULT false;

-- Create index for faster filtering of gatekept reviews
CREATE INDEX IF NOT EXISTS idx_reviews_is_gatekept ON reviews(is_gatekept);

-- Update RLS policies to handle gatekept reviews
CREATE POLICY "Users can see non-gatekept reviews"
ON reviews FOR SELECT
TO authenticated
USING (
  NOT is_gatekept OR
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_premium = true
  )
);