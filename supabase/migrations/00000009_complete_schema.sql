-- Drop all existing tables and policies
DROP TABLE IF EXISTS public.sections CASCADE;
DROP TABLE IF EXISTS public.years CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;
DROP TABLE IF EXISTS public.programs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.universities CASCADE;

-- Create universities table
CREATE TABLE public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    university_id UUID REFERENCES public.universities(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create programs table
CREATE TABLE public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    duration TEXT NOT NULL,
    university_id UUID REFERENCES public.universities(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create branches table
CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    program_id UUID REFERENCES public.programs(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create years table
CREATE TABLE public.years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_number INTEGER NOT NULL,
    branch_id UUID REFERENCES public.branches(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create sections table
CREATE TABLE public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    timetable_file_id TEXT,
    enrollment_file_id TEXT,
    year_id UUID REFERENCES public.years(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Enable insert access for authenticated users" ON public.users
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON public.users
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Enable update for users based on id" ON public.users
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policies for other tables (read-only for authenticated users)
CREATE POLICY "Enable read access for authenticated users" ON public.universities
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON public.programs
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON public.branches
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON public.years
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON public.sections
FOR SELECT TO authenticated USING (true);

-- Create a default university for testing
INSERT INTO public.universities (name, location) VALUES
('Test University', 'Test Location')
ON CONFLICT DO NOTHING; 