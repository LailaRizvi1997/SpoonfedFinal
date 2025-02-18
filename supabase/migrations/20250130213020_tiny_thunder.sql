/*
  # Restaurant Review Platform Schema Update

  1. New Tables
    - users: Extended user profile with cuisine preferences and stats
    - restaurants: Restaurant details with ratings and metadata
    - reviews: User reviews with golden/wooden spoon features
    - followers: User following relationships
    - likes: Review likes tracking
    - saved_restaurants: User's wishlist and visited places
    - lists: User-created restaurant lists

  2. Changes
    - Added advanced restaurant metrics (review distribution, ratings)
    - Implemented golden/wooden spoon system
    - Added social features (followers, likes)
    - Enhanced user profiles with badges and stats

  3. Security
    - Enable RLS on all tables
    - Add policies for data access control
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Update users table
DO $$ 
BEGIN
  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS top_cuisines TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS golden_spoon_history JSONB DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS wooden_spoon_history JSONB DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS current_golden_spoon_id UUID,
    ADD COLUMN IF NOT EXISTS current_wooden_spoon_id UUID;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create restaurants table if not exists
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  review_distribution INTEGER[] DEFAULT ARRAY[0,0,0,0,0],
  rating_avg DECIMAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  early_adopter_threshold INTEGER DEFAULT 10,
  visit_count INTEGER DEFAULT 0,
  google_data JSONB DEFAULT '{}'::JSONB,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  golden_spoon_count INTEGER DEFAULT 0,
  wooden_spoon_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table if not exists
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users NOT NULL,
  restaurant_id UUID REFERENCES restaurants NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  likes_count INTEGER DEFAULT 0,
  is_golden_spoon BOOLEAN DEFAULT false,
  is_wooden_spoon BOOLEAN DEFAULT false,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create followers table if not exists
CREATE TABLE IF NOT EXISTS followers (
  follower_id UUID REFERENCES users,
  following_id UUID REFERENCES users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id)
);

-- Create likes table if not exists
CREATE TABLE IF NOT EXISTS likes (
  user_id UUID REFERENCES users,
  review_id UUID REFERENCES reviews,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, review_id)
);

-- Create saved_restaurants table if not exists
CREATE TABLE IF NOT EXISTS saved_restaurants (
  user_id UUID REFERENCES users,
  restaurant_id UUID REFERENCES restaurants,
  type TEXT CHECK (type IN ('wishlist', 'visited')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, restaurant_id, type)
);

-- Create lists table if not exists
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints for golden/wooden spoon references
DO $$ 
BEGIN
  ALTER TABLE users
    ADD CONSTRAINT fk_current_golden_spoon
    FOREIGN KEY (current_golden_spoon_id)
    REFERENCES restaurants(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE users
    ADD CONSTRAINT fk_current_wooden_spoon
    FOREIGN KEY (current_wooden_spoon_id)
    REFERENCES restaurants(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_name ON restaurants USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_review_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_restaurant_rating ON restaurants(rating_avg);

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies with safety checks
DO $$ 
BEGIN
  -- Restaurants policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'restaurants' 
    AND policyname = 'Anyone can read restaurants'
  ) THEN
    CREATE POLICY "Anyone can read restaurants"
      ON restaurants FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Reviews policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Anyone can read reviews'
  ) THEN
    CREATE POLICY "Anyone can read reviews"
      ON reviews FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Users can create reviews'
  ) THEN
    CREATE POLICY "Users can create reviews"
      ON reviews FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Users can update own reviews'
  ) THEN
    CREATE POLICY "Users can update own reviews"
      ON reviews FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Users can delete own reviews'
  ) THEN
    CREATE POLICY "Users can delete own reviews"
      ON reviews FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Followers policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'followers' 
    AND policyname = 'Anyone can read followers'
  ) THEN
    CREATE POLICY "Anyone can read followers"
      ON followers FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'followers' 
    AND policyname = 'Users can manage own following'
  ) THEN
    CREATE POLICY "Users can manage own following"
      ON followers FOR ALL
      TO authenticated
      USING (auth.uid() = follower_id);
  END IF;

  -- Likes policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'likes' 
    AND policyname = 'Anyone can read likes'
  ) THEN
    CREATE POLICY "Anyone can read likes"
      ON likes FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'likes' 
    AND policyname = 'Users can manage own likes'
  ) THEN
    CREATE POLICY "Users can manage own likes"
      ON likes FOR ALL
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Saved restaurants policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'saved_restaurants' 
    AND policyname = 'Users can read own saved restaurants'
  ) THEN
    CREATE POLICY "Users can read own saved restaurants"
      ON saved_restaurants FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'saved_restaurants' 
    AND policyname = 'Users can manage saved restaurants'
  ) THEN
    CREATE POLICY "Users can manage saved restaurants"
      ON saved_restaurants FOR ALL
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Lists policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lists' 
    AND policyname = 'Users can read public lists'
  ) THEN
    CREATE POLICY "Users can read public lists"
      ON lists FOR SELECT
      TO authenticated
      USING (is_public = true OR auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lists' 
    AND policyname = 'Users can manage own lists'
  ) THEN
    CREATE POLICY "Users can manage own lists"
      ON lists FOR ALL
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create functions for maintaining counts
CREATE OR REPLACE FUNCTION update_review_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET reviews_count = reviews_count + 1 WHERE id = NEW.user_id;
    UPDATE restaurants 
    SET 
      review_distribution[NEW.rating] = COALESCE(review_distribution[NEW.rating], 0) + 1,
      review_count = review_count + 1,
      rating_avg = (
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM reviews
        WHERE restaurant_id = NEW.restaurant_id
      )
    WHERE id = NEW.restaurant_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET reviews_count = reviews_count - 1 WHERE id = OLD.user_id;
    UPDATE restaurants 
    SET 
      review_distribution[OLD.rating] = GREATEST(0, COALESCE(review_distribution[OLD.rating], 0) - 1),
      review_count = GREATEST(0, review_count - 1),
      rating_avg = (
        SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
        FROM reviews
        WHERE restaurant_id = OLD.restaurant_id
      )
    WHERE id = OLD.restaurant_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for review counts
DROP TRIGGER IF EXISTS review_counts_trigger ON reviews;
CREATE TRIGGER review_counts_trigger
AFTER INSERT OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_review_counts();

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
    UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for follower counts
DROP TRIGGER IF EXISTS follower_counts_trigger ON followers;
CREATE TRIGGER follower_counts_trigger
AFTER INSERT OR DELETE ON followers
FOR EACH ROW
EXECUTE FUNCTION update_follower_counts();