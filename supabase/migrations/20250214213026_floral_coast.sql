-- Add created_at to list_favorites if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'list_favorites' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE list_favorites ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_list_favorites_user_id ON list_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_list_favorites_list_id ON list_favorites(list_id);