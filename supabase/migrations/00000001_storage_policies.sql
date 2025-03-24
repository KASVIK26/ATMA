-- Enable storage by creating policies
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('timetables', 'enrollments'));

-- Allow authenticated users to view their university's files
CREATE POLICY "Allow authenticated users to view files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id IN ('timetables', 'enrollments') AND (
  EXISTS (
    SELECT 1 FROM auth.users au
    JOIN public.users u ON u.id = au.id
    JOIN public.sections s ON (
      CASE 
        WHEN bucket_id = 'timetables' THEN s.timetable_file_id = name
        WHEN bucket_id = 'enrollments' THEN s.enrollment_file_id = name
      END
    )
    JOIN public.years y ON y.id = s.year_id
    JOIN public.branches b ON b.id = y.branch_id
    JOIN public.programs p ON p.id = b.program_id
    WHERE au.id = auth.uid()
    AND p.university_id = u.university_id
  )
));

-- Allow authenticated users to delete their university's files
CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('timetables', 'enrollments') AND (
  EXISTS (
    SELECT 1 FROM auth.users au
    JOIN public.users u ON u.id = au.id
    JOIN public.sections s ON (
      CASE 
        WHEN bucket_id = 'timetables' THEN s.timetable_file_id = name
        WHEN bucket_id = 'enrollments' THEN s.enrollment_file_id = name
      END
    )
    JOIN public.years y ON y.id = s.year_id
    JOIN public.branches b ON b.id = y.branch_id
    JOIN public.programs p ON p.id = b.program_id
    WHERE au.id = auth.uid()
    AND p.university_id = u.university_id
    AND u.role = 'admin'
  )
)); 