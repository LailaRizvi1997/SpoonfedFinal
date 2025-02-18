/*
  # Create Storage Buckets

  1. New Buckets
    - `reviews` - For storing review media (photos, videos, audio)
    - `profiles` - For storing user profile pictures
  
  2. Security
    - Enable RLS on all buckets
    - Add policies for authenticated users to manage their own files
*/

-- Create reviews bucket
INSERT INTO storage.buckets (id, name)
VALUES ('reviews', 'reviews')
ON CONFLICT DO NOTHING;

-- Create profiles bucket
INSERT INTO storage.buckets (id, name)
VALUES ('profiles', 'profiles')
ON CONFLICT DO NOTHING;

-- Enable RLS on reviews bucket
CREATE POLICY "Users can view all review media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reviews');

CREATE POLICY "Users can upload review media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reviews'
  AND (storage.foldername(name))[1] IN ('review-media', 'review-audio')
);

CREATE POLICY "Users can delete own review media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'reviews'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Enable RLS on profiles bucket
CREATE POLICY "Users can view all profile pictures"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can update own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[2]
);