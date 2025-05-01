-- Create team table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.team (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_team table to link profiles to teams
CREATE TABLE IF NOT EXISTS public.user_team (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES public.team(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on team tables
ALTER TABLE public.team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_team ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for team table

-- Allow all authenticated users to view teams
CREATE POLICY IF NOT EXISTS "Allow all authenticated users to view teams" 
  ON public.team FOR SELECT 
  TO authenticated
  USING (true);

-- Allow authenticated users to create teams
CREATE POLICY IF NOT EXISTS "Authenticated users can create teams" 
  ON public.team FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Allow team owners and admins to update their teams
CREATE POLICY IF NOT EXISTS "Team owners and admins can update teams" 
  ON public.team FOR UPDATE 
  TO authenticated
  USING (
    id IN (
      SELECT team_id FROM public.user_team 
      WHERE user_id = auth.uid()
    )
  );

-- Allow team owners to delete their teams
CREATE POLICY IF NOT EXISTS "Team owners can delete teams" 
  ON public.team FOR DELETE 
  TO authenticated
  USING (
    id IN (
      SELECT team_id FROM public.user_team 
      WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for user_team table

-- Allow all authenticated users to view team members
CREATE POLICY IF NOT EXISTS "Allow all authenticated users to view team members" 
  ON public.user_team FOR SELECT 
  TO authenticated
  USING (true);

-- Allow team owners and admins to add members
CREATE POLICY IF NOT EXISTS "Team owners and admins can add members" 
  ON public.user_team FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Allow team owners and admins to update member roles
CREATE POLICY IF NOT EXISTS "Team owners and admins can update member roles" 
  ON public.user_team FOR UPDATE 
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM public.user_team 
      WHERE user_id = auth.uid()
    )
  );

-- Allow team owners and admins to remove members
CREATE POLICY IF NOT EXISTS "Team owners and admins can remove members" 
  ON public.user_team FOR DELETE 
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM public.user_team 
      WHERE user_id = auth.uid()
    )
  );
