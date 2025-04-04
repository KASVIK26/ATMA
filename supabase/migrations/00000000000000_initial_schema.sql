-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    university_id UUID REFERENCES universities(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    duration TEXT NOT NULL,
    university_id UUID REFERENCES universities(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    program_id UUID REFERENCES programs(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_number INTEGER NOT NULL CHECK (year_number > 0),
    branch_id UUID REFERENCES branches(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    timetable_file_id TEXT,
    enrollment_file_id TEXT,
    year_id UUID REFERENCES years(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE years ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Universities policies
CREATE POLICY "Allow authenticated users to manage universities"
    ON universities
    FOR ALL
    TO authenticated
    USING (true);

-- Users policies
CREATE POLICY "Users can view their own record"
    ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own record"
    ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Programs policies
CREATE POLICY "Allow authenticated users to manage programs"
    ON programs
    FOR ALL
    TO authenticated
    USING (true);

-- Branches policies
CREATE POLICY "Allow authenticated users to manage branches"
    ON branches
    FOR ALL
    TO authenticated
    USING (true);

-- Years policies
CREATE POLICY "Allow authenticated users to manage years"
    ON years
    FOR ALL
    TO authenticated
    USING (true);

-- Sections policies
CREATE POLICY "Allow authenticated users to manage sections"
    ON sections
    FOR ALL
    TO authenticated
    USING (true); 