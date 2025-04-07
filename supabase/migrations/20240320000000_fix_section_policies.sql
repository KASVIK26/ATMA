-- Drop existing policies
DROP POLICY IF EXISTS "Allow university members to view sections" ON sections;
DROP POLICY IF EXISTS "Allow admins to manage sections" ON sections;
DROP POLICY IF EXISTS "Allow authenticated users to view sections" ON sections;
DROP POLICY IF EXISTS "Allow users to view university sections" ON sections;

-- Allow all authenticated users to view sections (since this is admin-only)
CREATE POLICY "Allow authenticated users to view sections"
    ON sections
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow all authenticated users to manage sections (since this is admin-only)
CREATE POLICY "Allow authenticated users to manage sections"
    ON sections
    FOR ALL
    TO authenticated
    USING (true); 