-- Create storage buckets for review media
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('review-photos', 'review-photos', true),
  ('review-videos', 'review-videos', true),
  ('review-audio', 'review-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for review-photos bucket
CREATE POLICY "Review photos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'review-photos');

CREATE POLICY "Users can upload review photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own review photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'review-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policies for review-videos bucket
CREATE POLICY "Review videos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'review-videos');

CREATE POLICY "Users can upload review videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own review videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'review-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policies for review-audio bucket
CREATE POLICY "Review audio is publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'review-audio');

CREATE POLICY "Users can upload review audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-audio' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own review audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'review-audio' AND
  (storage.foldername(name))[1] = auth.uid()::text
);