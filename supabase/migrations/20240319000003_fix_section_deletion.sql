-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view files from their university" ON files;
DROP POLICY IF EXISTS "Users can insert files for their university" ON files;
DROP POLICY IF EXISTS "Users can delete files from their university" ON files;

-- Create more permissive RLS policies
CREATE POLICY "Enable read access for users in same university"
ON files FOR SELECT
USING (
  auth.uid() IN (
    SELECT u.id FROM users u
    JOIN programs p ON u.university_id = p.university_id
    JOIN branches b ON p.id = b.program_id
    JOIN years y ON b.id = y.branch_id
    JOIN sections s ON y.id = s.year_id
    WHERE s.id = files.section_id
  )
);

CREATE POLICY "Enable insert for users in same university"
ON files FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT u.id FROM users u
    JOIN programs p ON u.university_id = p.university_id
    JOIN branches b ON p.id = b.program_id
    JOIN years y ON b.id = y.branch_id
    JOIN sections s ON y.id = s.year_id
    WHERE s.id = section_id
  )
);

CREATE POLICY "Enable delete for users in same university"
ON files FOR DELETE
USING (
  auth.uid() IN (
    SELECT u.id FROM users u
    JOIN programs p ON u.university_id = p.university_id
    JOIN branches b ON p.id = b.program_id
    JOIN years y ON b.id = y.branch_id
    JOIN sections s ON y.id = s.year_id
    WHERE s.id = section_id
  )
);

-- Create function to delete files from storage
CREATE OR REPLACE FUNCTION delete_section_files()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    file_record RECORD;
BEGIN
    -- Loop through all files associated with the section
    FOR file_record IN 
        SELECT * FROM files 
        WHERE section_id = OLD.id
    LOOP
        -- Delete file from storage bucket
        -- Note: This is done in the application layer through the deleteFile function
        -- Here we just clean up the database records
        DELETE FROM files WHERE id = file_record.id;
    END LOOP;
    
    RETURN OLD;
END;
$$;

-- Create trigger to delete files before section deletion
DROP TRIGGER IF EXISTS before_section_delete ON sections;
CREATE TRIGGER before_section_delete
    BEFORE DELETE ON sections
    FOR EACH ROW
    EXECUTE FUNCTION delete_section_files(); 