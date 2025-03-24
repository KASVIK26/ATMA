-- Drop existing policies if any
DROP POLICY IF EXISTS "Give users authenticated access to timetables" ON storage.objects;
DROP POLICY IF EXISTS "Give users authenticated access to enrollments" ON storage.objects;

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('timetables', 'timetables', false),
  ('enrollments', 'enrollments', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a single policy for all authenticated users
CREATE POLICY "Allow full access for authenticated users"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id IN ('timetables', 'enrollments')
)
WITH CHECK (
  bucket_id IN ('timetables', 'enrollments')
); 