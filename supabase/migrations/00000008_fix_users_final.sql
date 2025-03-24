-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
DROP POLICY IF EXISTS "Service role has full access" ON public.users;

-- Recreate the users table with the correct schema
DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    university_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create a single policy that allows authenticated users to insert their own profile
CREATE POLICY "Allow authenticated users to insert their own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = id
);

-- Allow users to read their own profile
CREATE POLICY "Allow users to read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (
    auth.uid() = id
);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (
    auth.uid() = id
)
WITH CHECK (
    auth.uid() = id
); 