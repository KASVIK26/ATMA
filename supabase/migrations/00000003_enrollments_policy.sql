-- First, ensure the enrollments bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('enrollments', 'enrollments', false)
ON CONFLICT (id) DO NOTHING;

-- Drop any existing policies for enrollments bucket
DROP POLICY IF EXISTS "Allow authenticated enrollments access" ON storage.objects;

-- Create specific policies for enrollments bucket
CREATE POLICY "Allow authenticated enrollments access"
ON storage.objects
FOR ALL -- This allows all operations (SELECT, INSERT, UPDATE, DELETE)
TO authenticated -- This means only authenticated users
USING (
    bucket_id = 'enrollments' -- This specifically targets the enrollments bucket
    AND auth.role() = 'authenticated'
)
WITH CHECK (
    bucket_id = 'enrollments'
    AND auth.role() = 'authenticated'
); 