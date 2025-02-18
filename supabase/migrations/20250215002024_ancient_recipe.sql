-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('list-covers', 'list-covers', true),
  ('profiles', 'profiles', true),
  ('reviews', 'reviews', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies for list-covers bucket
CREATE POLICY "List covers are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'list-covers');

CREATE POLICY "Users can upload list covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'list-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own list covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'list-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own list covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'list-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);