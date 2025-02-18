-- Add note column to list_restaurants table
ALTER TABLE list_restaurants 
ADD COLUMN IF NOT EXISTS note text CHECK (char_length(note) <= 500);

-- Create index for better performance when querying by list_id
CREATE INDEX IF NOT EXISTS idx_list_restaurants_list_id ON list_restaurants(list_id);

-- Create index for better performance when querying by restaurant_id
CREATE INDEX IF NOT EXISTS idx_list_restaurants_restaurant_id ON list_restaurants(restaurant_id);

-- Add RLS policies if they don't exist
DO $$ 
BEGIN
  -- Policy for viewing list restaurants
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'list_restaurants' 
    AND policyname = 'Users can view list restaurants for accessible lists'
  ) THEN
    CREATE POLICY "Users can view list restaurants for accessible lists"
      ON list_restaurants FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM lists
          WHERE lists.id = list_id
          AND (lists.is_public = true OR lists.user_id = auth.uid())
        )
      );
  END IF;

  -- Policy for managing list restaurants
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'list_restaurants' 
    AND policyname = 'Users can manage restaurants in own lists'
  ) THEN
    CREATE POLICY "Users can manage restaurants in own lists"
      ON list_restaurants FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM lists
          WHERE lists.id = list_id
          AND lists.user_id = auth.uid()
        )
      );
  END IF;
END $$;