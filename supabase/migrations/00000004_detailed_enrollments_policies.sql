-- First drop the existing combined policy
DROP POLICY IF EXISTS "Allow authenticated enrollments access" ON storage.objects;

-- Create separate policies for different operations

-- 1. Policy for uploading files
CREATE POLICY "Upload enrollments files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'enrollments'
    AND auth.role() = 'authenticated'
);

-- 2. Policy for viewing/downloading files
CREATE POLICY "Read enrollments files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'enrollments'
    AND auth.role() = 'authenticated'
);

-- 3. Policy for updating files
CREATE POLICY "Update enrollments files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'enrollments'
    AND auth.role() = 'authenticated'
)
WITH CHECK (
    bucket_id = 'enrollments'
    AND auth.role() = 'authenticated'
);

-- 4. Policy for deleting files
CREATE POLICY "Delete enrollments files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'enrollments'
    AND auth.role() = 'authenticated'
); 