-- Drop old policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view timetables" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload timetables" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update timetables" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete timetables" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated users to view enrollments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload enrollments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update enrollments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete enrollments" ON storage.objects;

-- Create storage buckets if they don't exist (using singular form)
INSERT INTO storage.buckets (id, name, public)
VALUES ('timetable', 'timetable', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('enrollment', 'enrollment', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for timetable bucket (singular)
CREATE POLICY "Allow authenticated users to view timetable"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'timetable');

CREATE POLICY "Allow authenticated users to upload timetable"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'timetable');

CREATE POLICY "Allow authenticated users to update timetable"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'timetable');

CREATE POLICY "Allow authenticated users to delete timetable"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'timetable');

-- Create policies for enrollment bucket (singular)
CREATE POLICY "Allow authenticated users to view enrollment"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'enrollment');

CREATE POLICY "Allow authenticated users to upload enrollment"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'enrollment');

CREATE POLICY "Allow authenticated users to update enrollment"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'enrollment');

CREATE POLICY "Allow authenticated users to delete enrollment"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'enrollment'); 