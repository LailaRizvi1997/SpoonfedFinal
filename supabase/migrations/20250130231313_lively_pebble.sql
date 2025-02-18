/*
  # Fix Restaurant Schema

  1. Changes
    - Add missing columns to restaurants table
    - Update existing rows with default values
    - Add indexes for performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add review_count if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'review_count'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;

  -- Add visit_count if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'visit_count'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN visit_count INTEGER DEFAULT 0;
  END IF;

  -- Add review_distribution if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'review_distribution'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN review_distribution INTEGER[] DEFAULT ARRAY[0,0,0,0,0];
  END IF;

  -- Add rating_avg if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'rating_avg'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN rating_avg DECIMAL DEFAULT 0;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_restaurant_review_count ON restaurants(review_count);
CREATE INDEX IF NOT EXISTS idx_restaurant_rating_avg ON restaurants(rating_avg);

-- Update review counts and ratings for existing restaurants
WITH review_stats AS (
  SELECT 
    restaurant_id,
    COUNT(*) as review_count,
    ROUND(AVG(rating)::numeric, 2) as rating_avg,
    ARRAY[
      COUNT(*) FILTER (WHERE rating = 1),
      COUNT(*) FILTER (WHERE rating = 2),
      COUNT(*) FILTER (WHERE rating = 3),
      COUNT(*) FILTER (WHERE rating = 4),
      COUNT(*) FILTER (WHERE rating = 5)
    ] as review_distribution
  FROM reviews
  GROUP BY restaurant_id
)
UPDATE restaurants r
SET 
  review_count = rs.review_count,
  rating_avg = rs.rating_avg,
  review_distribution = rs.review_distribution
FROM review_stats rs
WHERE r.id = rs.restaurant_id;

-- Create or replace function to update restaurant stats on review changes
CREATE OR REPLACE FUNCTION update_restaurant_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    WITH new_stats AS (
      SELECT 
        COUNT(*) as review_count,
        ROUND(AVG(rating)::numeric, 2) as rating_avg,
        ARRAY[
          COUNT(*) FILTER (WHERE rating = 1),
          COUNT(*) FILTER (WHERE rating = 2),
          COUNT(*) FILTER (WHERE rating = 3),
          COUNT(*) FILTER (WHERE rating = 4),
          COUNT(*) FILTER (WHERE rating = 5)
        ] as review_distribution
      FROM reviews
      WHERE restaurant_id = NEW.restaurant_id
    )
    UPDATE restaurants
    SET 
      review_count = new_stats.review_count,
      rating_avg = new_stats.rating_avg,
      review_distribution = new_stats.review_distribution
    FROM new_stats
    WHERE id = NEW.restaurant_id;
  ELSIF TG_OP = 'DELETE' THEN
    WITH new_stats AS (
      SELECT 
        COUNT(*) as review_count,
        COALESCE(ROUND(AVG(rating)::numeric, 2), 0) as rating_avg,
        ARRAY[
          COUNT(*) FILTER (WHERE rating = 1),
          COUNT(*) FILTER (WHERE rating = 2),
          COUNT(*) FILTER (WHERE rating = 3),
          COUNT(*) FILTER (WHERE rating = 4),
          COUNT(*) FILTER (WHERE rating = 5)
        ] as review_distribution
      FROM reviews
      WHERE restaurant_id = OLD.restaurant_id
    )
    UPDATE restaurants
    SET 
      review_count = new_stats.review_count,
      rating_avg = new_stats.rating_avg,
      review_distribution = new_stats.review_distribution
    FROM new_stats
    WHERE id = OLD.restaurant_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for restaurant stats
DROP TRIGGER IF EXISTS update_restaurant_stats_trigger ON reviews;
CREATE TRIGGER update_restaurant_stats_trigger
AFTER INSERT OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_restaurant_stats();