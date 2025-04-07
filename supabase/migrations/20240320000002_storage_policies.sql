-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('timetables', 'timetables', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('enrollments', 'enrollments', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for timetables bucket
CREATE POLICY "Allow authenticated users to view timetables"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'timetables');

CREATE POLICY "Allow authenticated users to upload timetables"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'timetables');

CREATE POLICY "Allow authenticated users to update timetables"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'timetables');

CREATE POLICY "Allow authenticated users to delete timetables"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'timetables');

-- Create policies for enrollments bucket
CREATE POLICY "Allow authenticated users to view enrollments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'enrollments');

CREATE POLICY "Allow authenticated users to upload enrollments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'enrollments');

CREATE POLICY "Allow authenticated users to update enrollments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'enrollments');

CREATE POLICY "Allow authenticated users to delete enrollments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'enrollments'); 