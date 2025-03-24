-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for registration" ON public.users;
DROP POLICY IF EXISTS "Enable read own profile" ON public.users;
DROP POLICY IF EXISTS "Enable update own profile" ON public.users;

-- Create a policy that allows insert during registration
CREATE POLICY "Allow registration"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy for reading own profile
CREATE POLICY "Allow users to read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create policy for updating own profile
CREATE POLICY "Allow users to update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id); 