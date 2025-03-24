-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('timetables', 'timetables', false),
  ('enrollments', 'enrollments', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to avatars
CREATE POLICY "Give users authenticated access to timetables"
ON storage.objects FOR ALL USING (
  bucket_id = 'timetables'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Give users authenticated access to enrollments"
ON storage.objects FOR ALL USING (
  bucket_id = 'enrollments'
  AND auth.role() = 'authenticated'
); 