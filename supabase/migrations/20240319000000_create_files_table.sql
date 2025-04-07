-- Create the files table
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY,
  path text NOT NULL,
  bucket text NOT NULL,
  section_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('timetable', 'enrollment')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create the UUID generation function
CREATE OR REPLACE FUNCTION generate_uuid()
RETURNS uuid
LANGUAGE sql
AS $$
  SELECT gen_random_uuid();
$$; 