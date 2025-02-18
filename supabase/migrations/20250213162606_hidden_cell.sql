-- Add description column to lists table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lists' AND column_name = 'description'
  ) THEN
    ALTER TABLE lists ADD COLUMN description text CHECK (char_length(description) <= 500);
  END IF;
END $$;