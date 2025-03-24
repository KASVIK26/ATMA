-- Drop existing policies first
DROP POLICY IF EXISTS "Allow registration" ON public.users;
DROP POLICY IF EXISTS "Allow users to read own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.users;

-- Recreate the users table without the role field
DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    university_id UUID REFERENCES public.universities(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Recreate the policies
CREATE POLICY "Allow registration"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow users to read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow users to update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id); 