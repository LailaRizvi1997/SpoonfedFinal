/*
  # Add Media Support for Reviews

  1. Changes
    - Add media column to store review media (photos, videos)
    - Add validation function for media structure
    - Add check constraint using validation function

  2. Media Structure
    Each media item must have:
      - type: "image" | "video"
      - url: string
      - caption?: string
      - captionPosition?: "top" | "center" | "bottom"
      - audioUrl?: string
*/

-- Create a function to validate media array structure
CREATE OR REPLACE FUNCTION check_media_array(media_array jsonb)
RETURNS boolean AS $$
DECLARE
  i integer;
  current_item jsonb;
  is_valid boolean;
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

    -- Validate optional fields
    IF (current_item ? 'caption' AND jsonb_typeof(current_item->'caption') != 'string') OR
       (current_item ? 'captionPosition' AND (
         jsonb_typeof(current_item->'captionPosition') != 'string' OR
         NOT (current_item->>'captionPosition' IN ('top', 'center', 'bottom'))
       )) OR
       (current_item ? 'audioUrl' AND jsonb_typeof(current_item->'audioUrl') != 'string') THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add media column to reviews table
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::JSONB;

-- Add check constraint using the validation function
ALTER TABLE reviews
  ADD CONSTRAINT reviews_media_check
  CHECK (check_media_array(media));