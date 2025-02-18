/*
  # Update restaurants table schema

  1. Changes
    - Make location column nullable
    - Add neighborhood column
    - Add indexes for location-based queries

  2. Data Migration
    - Set default values for existing records
    - Update indexes
*/

-- Make location column nullable and add neighborhood
ALTER TABLE restaurants 
  ALTER COLUMN location DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS neighborhood text;

-- Create indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_restaurant_neighborhood ON restaurants(neighborhood);
CREATE INDEX IF NOT EXISTS idx_restaurant_cuisine_type ON restaurants(cuisine_type);

-- Update existing records
UPDATE restaurants 
SET neighborhood = address 
WHERE neighborhood IS NULL AND address IS NOT NULL;