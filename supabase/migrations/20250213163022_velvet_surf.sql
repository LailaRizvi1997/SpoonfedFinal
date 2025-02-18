-- Add cover_url column to lists table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lists' AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE lists ADD COLUMN cover_url text;
  END IF;
END $$;