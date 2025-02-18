/*
  # Add photo_url and photos columns to restaurants

  1. New Columns
    - photos (text array) - Store multiple photo URLs
    - photo_url (text) - Store the primary photo URL
  
  2. Changes
    - Add photos array column with default empty array
    - Add photo_url column
    - Create trigger to automatically set photo_url from first photo in array
    - Create index on photo_url for better query performance
*/

-- Add photos array column
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add photo_url column
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create function for updating photo_url from photos array
CREATE OR REPLACE FUNCTION get_first_photo() 
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.photos IS NOT NULL AND array_length(NEW.photos, 1) > 0 THEN
    NEW.photo_url := NEW.photos[1];
  ELSE
    NEW.photo_url := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for automatically setting photo_url
DROP TRIGGER IF EXISTS set_photo_url ON restaurants;
CREATE TRIGGER set_photo_url
  BEFORE INSERT OR UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION get_first_photo();

-- Create index for photo_url lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_photo_url ON restaurants(photo_url);