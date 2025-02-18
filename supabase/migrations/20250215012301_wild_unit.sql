/*
  # Fix Storage Policies

  1. Changes
    - Drops existing conflicting policies
    - Creates a single 'reviews' bucket for all review media
    - Simplifies storage policies with proper permissions
    - Maintains media validation for reviews table

  2. Security
    - Enables RLS on storage.objects
    - Allows public read access to review media
    - Restricts upload/delete to authenticated users
    - Validates media structure in reviews

  3. Notes
    - Uses a single bucket approach for simpler management
    - Maintains user ownership checks for deletions
*/

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
DO $$ 
BEGIN
  ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_media_check;
  ALTER TABLE reviews ADD CONSTRAINT reviews_media_check CHECK (check_media_array(media));
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;