-- Enable RLS on files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing files
CREATE POLICY "Users can view files from their university"
ON files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sections s
    JOIN years y ON s.year_id = y.id
    JOIN branches b ON y.branch_id = b.id
    JOIN programs p ON b.program_id = p.id
    JOIN users u ON p.university_id = u.university_id
    WHERE files.section_id = s.id
    AND u.id = auth.uid()
  )
);

-- Create policy for inserting files
CREATE POLICY "Users can insert files for their university"
ON files
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sections s
    JOIN years y ON s.year_id = y.id
    JOIN branches b ON y.branch_id = b.id
    JOIN programs p ON b.program_id = p.id
    JOIN users u ON p.university_id = u.university_id
    WHERE files.section_id = s.id
    AND u.id = auth.uid()
  )
);

-- Create policy for deleting files
CREATE POLICY "Users can delete files from their university"
ON files
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM sections s
    JOIN years y ON s.year_id = y.id
    JOIN branches b ON y.branch_id = b.id
    JOIN programs p ON b.program_id = p.id
    JOIN users u ON p.university_id = u.university_id
    WHERE files.section_id = s.id
    AND u.id = auth.uid()
  )
); 