-- Drop existing storage policies
DROP POLICY IF EXISTS "Authenticated users can upload timetables" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view timetables" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their timetables" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their timetables" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload enrollments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view enrollments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their enrollments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their enrollments" ON storage.objects;

-- Create a single policy for authenticated users to manage files
CREATE POLICY "Authenticated users can manage files"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id IN ('timetables', 'enrollments')
    AND auth.role() = 'authenticated'
)
WITH CHECK (
    bucket_id IN ('timetables', 'enrollments')
    AND auth.role() = 'authenticated'
); 