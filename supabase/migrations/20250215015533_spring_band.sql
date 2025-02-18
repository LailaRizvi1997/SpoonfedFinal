-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Review media is publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload review media" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own review media" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create or update reviews bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('reviews', 'reviews', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create simplified policies for the reviews bucket
CREATE POLICY "Review media is publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reviews');

CREATE POLICY "Users can upload review media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reviews');

CREATE POLICY "Users can delete own review media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'reviews' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add media column to reviews table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'media'
  ) THEN
    ALTER TABLE reviews ADD COLUMN media JSONB DEFAULT '[]'::JSONB;
  END IF;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Drop existing check constraint if it exists
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_media_check;

-- Create a more flexible check constraint for media array
CREATE OR REPLACE FUNCTION check_media_array(media_array jsonb)
RETURNS boolean AS $$
BEGIN
  -- Allow null or empty array
  IF media_array IS NULL OR jsonb_array_length(media_array) = 0 THEN
    RETURN true;
  END IF;

  -- Validate array structure
  RETURN (
    -- Must be an array
    jsonb_typeof(media_array) = 'array'
    -- Maximum 10 items
    AND jsonb_array_length(media_array) <= 10
    -- Each item must be an object with required fields
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(media_array) AS item
      WHERE jsonb_typeof(item) != 'object'
        OR NOT (
          -- Required fields
          (item ? 'type' AND jsonb_typeof(item->'type') = 'string')
          AND (item ? 'url' AND jsonb_typeof(item->'url') = 'string')
          -- Type must be either 'image' or 'video'
          AND (item->>'type' IN ('image', 'video'))
        )
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add the new check constraint
ALTER TABLE reviews ADD CONSTRAINT reviews_media_check
  CHECK (check_media_array(media));