/*
  # Add Location-Based Search Capabilities

  1. New Extensions
    - Enable PostGIS for location-based queries
    - Enable pg_trgm for text search

  2. Changes
    - Add address and coordinates columns to restaurants table
    - Add text search indexes
    - Add location-based search functions

  3. Notes
    - Uses safe operations that preserve existing data
    - Adds spatial indexing for efficient location queries
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$ 
BEGIN
  -- Add address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'address'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN address TEXT;
  END IF;

  -- Add coordinates columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN latitude DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN longitude DOUBLE PRECISION;
  END IF;

  -- Add text search indexes if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_restaurant_name_trgm'
  ) THEN
    CREATE INDEX idx_restaurant_name_trgm ON restaurants 
    USING gin (name gin_trgm_ops);
  END IF;

  -- Add spatial index if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_restaurant_coordinates'
  ) THEN
    CREATE INDEX idx_restaurant_coordinates 
    ON restaurants 
    USING gist (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));
  END IF;
END $$;

-- Create function for location-based restaurant search
CREATE OR REPLACE FUNCTION search_restaurants(
  search_term TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  distance DOUBLE PRECISION,
  google_place_data JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.address,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(r.longitude, r.latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) as distance,
    r.google_place_data
  FROM restaurants r
  WHERE 
    r.name ILIKE '%' || search_term || '%'
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(r.longitude, r.latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance
  LIMIT 20;
END;
$$;