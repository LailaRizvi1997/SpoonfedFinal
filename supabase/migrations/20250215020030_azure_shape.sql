-- Drop existing check constraint
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_media_check;

-- Create a more permissive check constraint for media array
CREATE OR REPLACE FUNCTION check_media_array(media_array jsonb)
RETURNS boolean AS $$
BEGIN
  -- Allow null or empty array
  IF media_array IS NULL OR jsonb_array_length(media_array) = 0 THEN
    RETURN true;
  END IF;

  -- Must be an array
  IF jsonb_typeof(media_array) != 'array' THEN
    RETURN false;
  END IF;

  -- Maximum 10 items
  IF jsonb_array_length(media_array) > 10 THEN
    RETURN false;
  END IF;

  -- Each item must be an object with required fields
  FOR i IN 0..jsonb_array_length(media_array) - 1 LOOP
    DECLARE
      item jsonb := jsonb_array_element(media_array, i);
    BEGIN
      -- Check if item is an object
      IF jsonb_typeof(item) != 'object' THEN
        RETURN false;
      END IF;

      -- Check required fields
      IF NOT (
        item ? 'type' 
        AND item ? 'url'
        AND jsonb_typeof(item->'type') = 'string'
        AND jsonb_typeof(item->'url') = 'string'
      ) THEN
        RETURN false;
      END IF;

      -- Check type value
      IF item->>'type' NOT IN ('photo', 'video') THEN
        RETURN false;
      END IF;
    END;
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add the new check constraint
ALTER TABLE reviews ADD CONSTRAINT reviews_media_check
  CHECK (check_media_array(media));

-- Add storage policies for review media if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Review media is publicly accessible'
  ) THEN
    CREATE POLICY "Review media is publicly accessible"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'reviews');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can upload review media'
  ) THEN
    CREATE POLICY "Users can upload review media"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'reviews');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can delete own review media'
  ) THEN
    CREATE POLICY "Users can delete own review media"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'reviews' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;