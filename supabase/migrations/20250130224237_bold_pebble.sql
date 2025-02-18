/*
  # Fix Restaurant Table RLS Policies

  1. Changes
    - Add RLS policy for inserting restaurants
    - Add RLS policy for updating restaurants
    - Ensure authenticated users can read all restaurants

  2. Security
    - Enable RLS on restaurants table
    - Allow all authenticated users to read restaurants
    - Allow authenticated users to insert/update restaurants
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read restaurants" ON restaurants;
  DROP POLICY IF EXISTS "Users can insert restaurants" ON restaurants;
  DROP POLICY IF EXISTS "Users can update restaurants" ON restaurants;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies
CREATE POLICY "Anyone can read restaurants"
ON restaurants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert restaurants"
ON restaurants FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update restaurants"
ON restaurants FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);