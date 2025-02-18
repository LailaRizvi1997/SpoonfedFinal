-- Update the check constraint on reviews table for text length
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_text_length;
ALTER TABLE reviews ADD CONSTRAINT reviews_text_length CHECK (length(text) <= 250);