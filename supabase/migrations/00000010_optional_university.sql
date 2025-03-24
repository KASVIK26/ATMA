-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;

-- Modify users table to make university_id optional
ALTER TABLE public.users ALTER COLUMN university_id DROP NOT NULL;

-- Create simplified policies for users table
CREATE POLICY "Enable insert for registration" ON public.users
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read own profile" ON public.users
FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable update own profile" ON public.users
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id); 