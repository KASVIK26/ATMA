-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create a policy to allow users to read their own data
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Create a policy to allow users to update their own data
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a policy to allow new user registration
CREATE POLICY "Allow user registration"
ON public.users FOR INSERT
WITH CHECK (
    -- Allow insert only if the user is inserting their own profile
    auth.uid() = id
    -- Ensure role is 'student' for new registrations
    AND role = 'student'
);

-- Create a policy to allow service role to manage all users
CREATE POLICY "Service role can manage users"
ON public.users
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role'); 