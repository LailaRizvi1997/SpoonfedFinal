/*
  # Fix reviews table structure

  1. Changes
    - Add missing columns to reviews table
    - Update column names to match the application
    - Add proper constraints

  2. Security
    - Maintain existing RLS policies
*/

-- Add missing columns and fix column names
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS text TEXT,
  ADD COLUMN IF NOT EXISTS tag TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add check constraint for text length
ALTER TABLE reviews
  ADD CONSTRAINT reviews_text_length 
  CHECK (length(text) <= 140);

-- Add check constraint for valid tags
ALTER TABLE reviews
  ADD CONSTRAINT reviews_valid_tag
  CHECK (tag IN (
    'worth the hype',
    'underrated',
    'overhyped',
    'elite',
    'daylight robbery',
    'guilty pleasure',
    'marmite',
    'mid',
    'NPC central'
  ));