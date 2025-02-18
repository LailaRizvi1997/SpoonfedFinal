-- Add photos array column
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add photo_url column
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create function for updating photo_url from photos array
CREATE OR REPLACE FUNCTION get_first_photo() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.photos IS NOT NULL AND array_length(NEW.photos, 1) > 0 THEN
    NEW.photo_url := NEW.photos[1];
  ELSE
    NEW.photo_url := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatically setting photo_url
DROP TRIGGER IF EXISTS set_photo_url ON restaurants;
CREATE TRIGGER set_photo_url
  BEFORE INSERT OR UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION get_first_photo();

-- Create index for photo_url lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_photo_url ON restaurants(photo_url);