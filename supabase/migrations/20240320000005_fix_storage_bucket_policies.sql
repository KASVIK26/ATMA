-- First, enable RLS on buckets table
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies on buckets table
DROP POLICY IF EXISTS "Allow bucket management" ON storage.buckets;

-- Create a policy to allow authenticated users to manage buckets
CREATE POLICY "Allow bucket management"
ON storage.buckets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Drop any existing policies on objects table
DROP POLICY IF EXISTS "Give authenticated users full access" ON storage.objects;

-- Create a simple policy for authenticated users to access objects
CREATE POLICY "Give authenticated users full access"
ON storage.objects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true); 