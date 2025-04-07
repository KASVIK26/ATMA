-- Drop existing foreign key constraints
ALTER TABLE IF EXISTS sections DROP CONSTRAINT IF EXISTS sections_year_id_fkey;
ALTER TABLE IF EXISTS years DROP CONSTRAINT IF EXISTS years_branch_id_fkey;
ALTER TABLE IF EXISTS branches DROP CONSTRAINT IF EXISTS branches_program_id_fkey;
ALTER TABLE IF EXISTS programs DROP CONSTRAINT IF EXISTS programs_university_id_fkey;
ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_university_id_fkey;

-- Re-add foreign key constraints with proper ON DELETE behavior
ALTER TABLE sections
    ADD CONSTRAINT sections_year_id_fkey
    FOREIGN KEY (year_id)
    REFERENCES years(id)
    ON DELETE CASCADE;

ALTER TABLE years
    ADD CONSTRAINT years_branch_id_fkey
    FOREIGN KEY (branch_id)
    REFERENCES branches(id)
    ON DELETE CASCADE;

ALTER TABLE branches
    ADD CONSTRAINT branches_program_id_fkey
    FOREIGN KEY (program_id)
    REFERENCES programs(id)
    ON DELETE CASCADE;

ALTER TABLE programs
    ADD CONSTRAINT programs_university_id_fkey
    FOREIGN KEY (university_id)
    REFERENCES universities(id)
    ON DELETE CASCADE;

ALTER TABLE users
    ADD CONSTRAINT users_university_id_fkey
    FOREIGN KEY (university_id)
    REFERENCES universities(id)
    ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sections_year_id ON sections(year_id);
CREATE INDEX IF NOT EXISTS idx_years_branch_id ON years(branch_id);
CREATE INDEX IF NOT EXISTS idx_branches_program_id ON branches(program_id);
CREATE INDEX IF NOT EXISTS idx_programs_university_id ON programs(university_id);
CREATE INDEX IF NOT EXISTS idx_users_university_id ON users(university_id);

-- Verify data integrity
DO $$
BEGIN
    -- Check for orphaned sections
    IF EXISTS (
        SELECT 1 FROM sections s
        LEFT JOIN years y ON s.year_id = y.id
        WHERE y.id IS NULL
    ) THEN
        RAISE NOTICE 'Found orphaned sections';
    END IF;

    -- Check for orphaned years
    IF EXISTS (
        SELECT 1 FROM years y
        LEFT JOIN branches b ON y.branch_id = b.id
        WHERE b.id IS NULL
    ) THEN
        RAISE NOTICE 'Found orphaned years';
    END IF;

    -- Check for orphaned branches
    IF EXISTS (
        SELECT 1 FROM branches b
        LEFT JOIN programs p ON b.program_id = p.id
        WHERE p.id IS NULL
    ) THEN
        RAISE NOTICE 'Found orphaned branches';
    END IF;

    -- Check for orphaned programs
    IF EXISTS (
        SELECT 1 FROM programs p
        LEFT JOIN universities u ON p.university_id = u.id
        WHERE u.id IS NULL
    ) THEN
        RAISE NOTICE 'Found orphaned programs';
    END IF;
END $$; 