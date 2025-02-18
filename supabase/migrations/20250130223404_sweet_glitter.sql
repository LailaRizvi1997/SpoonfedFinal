/*
  # Fix Restaurant Schema

  1. Changes
    - Rename google_data to google_place_data to match the actual column name
    - Add missing columns for restaurant details

  2. Notes
    - Uses safe ALTER TABLE operations
    - Preserves existing data
*/

DO $$ 
BEGIN
  -- Rename google_data to google_place_data if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'google_data'
  ) THEN
    ALTER TABLE restaurants RENAME COLUMN google_data TO google_place_data;
  END IF;

  -- Add google_place_data if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'google_place_data'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN google_place_data JSONB DEFAULT '{}'::JSONB;
  END IF;

  -- Add missing columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'address'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN address TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'cuisine_type'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN cuisine_type TEXT;
  END IF;
END $$;