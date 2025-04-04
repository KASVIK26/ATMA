-- Update sections table to use UUID foreign keys for files
ALTER TABLE sections
  DROP COLUMN IF EXISTS timetable_file_id,
  DROP COLUMN IF EXISTS enrollment_file_id;

ALTER TABLE sections
  ADD COLUMN timetable_file_id uuid REFERENCES files(id) ON DELETE SET NULL,
  ADD COLUMN enrollment_file_id uuid REFERENCES files(id) ON DELETE SET NULL; 