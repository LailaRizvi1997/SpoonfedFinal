-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Drop review-videos policies
  DROP POLICY IF EXISTS "Review videos are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload review videos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own review videos" ON storage.objects;

  -- Drop review-photos policies
  DROP POLICY IF EXISTS "Review photos are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload review photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own review photos" ON storage.objects;

  -- Drop review-audio policies
  DROP POLICY IF EXISTS "Review audio is publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload review audio" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own review audio" ON storage.objects;
END $$;

-- Create or update storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('review-videos', 'review-videos', true),
  ('review-photos', 'review-photos', true),
  ('review-audio', 'review-audio', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper folder structure and permissions
-- Review Videos
CREATE POLICY "Review videos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'review-videos');

CREATE POLICY "Users can upload review videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-videos'
);

CREATE POLICY "Users can delete own review videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'review-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Review Photos
CREATE POLICY "Review photos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'review-photos');

CREATE POLICY "Users can upload review photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-photos'
);

CREATE POLICY "Users can delete own review photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'review-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Review Audio
CREATE POLICY "Review audio is publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'review-audio');

CREATE POLICY "Users can upload review audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-audio'
);

CREATE POLICY "Users can delete own review audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'review-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add media column to reviews table if it doesn't exist
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::JSONB;

-- Add check constraint for media array structure
CREATE OR REPLACE FUNCTION check_media_array(media_array jsonb)
RETURNS boolean AS $$
DECLARE
  i integer;
  current_item jsonb;
BEGIN
  -- Check if null or empty array
  IF media_array IS NULL OR jsonb_array_length(media_array) = 0 THEN
    RETURN true;
  END IF;

  -- Check array length
  IF jsonb_array_length(media_array) > 10 THEN
    RETURN false;
  END IF;

  -- Check each element
  FOR i IN 0..jsonb_array_length(media_array) - 1 LOOP
    current_item := jsonb_array_element(media_array, i);
    
    -- Validate required fields
    IF jsonb_typeof(current_item->'type') != 'string' OR
       NOT (current_item->>'type' IN ('image', 'video')) OR
       jsonb_typeof(current_item->'url') != 'string' THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add check constraint using the validation function
ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_media_check;

ALTER TABLE reviews
ADD CONSTRAINT reviews_media_check
CHECK (check_media_array(media));