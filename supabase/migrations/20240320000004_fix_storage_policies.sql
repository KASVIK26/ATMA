-- First, update the buckets to be public
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('timetables', 'enrollments');

-- Drop existing policies
DROP POLICY IF EXISTS "Allow access to files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to access storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload timetables for their university" ON storage.objects;

-- Create a single policy for full access to authenticated users
CREATE POLICY "Give authenticated users full access"
ON storage.objects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true); 