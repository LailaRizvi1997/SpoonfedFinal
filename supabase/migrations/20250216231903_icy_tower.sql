-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('reviews', 'reviews', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for avatars bucket
CREATE POLICY "Avatar files are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policies for reviews bucket
CREATE POLICY "Review files are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reviews');

CREATE POLICY "Users can upload review files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reviews' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own review files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'reviews' AND
  (storage.foldername(name))[1] = auth.uid()::text
);