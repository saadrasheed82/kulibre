-- SQL Query to create teams tables in Supabase
-- Run this in the Supabase SQL Editor

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table to link profiles to teams
CREATE TABLE IF NOT EXISTS public.team_members (
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- Options: 'owner', 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Enable Row Level Security on teams tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for teams

-- Allow all authenticated users to view teams
CREATE POLICY "Allow all authenticated users to view teams" 
  ON public.teams FOR SELECT 
  TO authenticated
  USING (true);

-- Allow authenticated users to create teams
CREATE POLICY "Authenticated users can create teams" 
  ON public.teams FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Allow team owners and admins to update their teams
CREATE POLICY "Team owners and admins can update teams" 
  ON public.teams FOR UPDATE 
  TO authenticated
  USING (
    id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Allow team owners to delete their teams
CREATE POLICY "Team owners can delete teams" 
  ON public.teams FOR DELETE 
  TO authenticated
  USING (
    id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Create RLS policies for team_members

-- Allow all authenticated users to view team members
CREATE POLICY "Allow all authenticated users to view team members" 
  ON public.team_members FOR SELECT 
  TO authenticated
  USING (true);

-- Allow team owners and admins to add members
CREATE POLICY "Team owners and admins can add members" 
  ON public.team_members FOR INSERT 
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Allow team owners and admins to update member roles
CREATE POLICY "Team owners and admins can update member roles" 
  ON public.team_members FOR UPDATE 
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Allow team owners and admins to remove members
CREATE POLICY "Team owners and admins can remove members" 
  ON public.team_members FOR DELETE 
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Insert a sample team and add the current user as the owner
INSERT INTO public.teams (name, description, created_by)
VALUES (
  'Default Team', 
  'This is the default team created automatically', 
  auth.uid()
)
ON CONFLICT DO NOTHING;

-- Add the current user as the owner of the default team
INSERT INTO public.team_members (team_id, user_id, role)
SELECT 
  id, 
  auth.uid(), 
  'owner'
FROM public.teams 
WHERE name = 'Default Team' AND created_by = auth.uid()
ON CONFLICT DO NOTHING;

-- Create a second sample team
INSERT INTO public.teams (name, description, created_by)
VALUES (
  'Marketing Team', 
  'Team responsible for marketing activities', 
  auth.uid()
)
ON CONFLICT DO NOTHING;

-- Add the current user as the owner of the marketing team
INSERT INTO public.team_members (team_id, user_id, role)
SELECT 
  id, 
  auth.uid(), 
  'owner'
FROM public.teams 
WHERE name = 'Marketing Team' AND created_by = auth.uid()
ON CONFLICT DO NOTHING;

-- Create a third sample team
INSERT INTO public.teams (name, description, created_by)
VALUES (
  'Development Team', 
  'Team responsible for software development', 
  auth.uid()
)
ON CONFLICT DO NOTHING;

-- Add the current user as the owner of the development team
INSERT INTO public.team_members (team_id, user_id, role)
SELECT 
  id, 
  auth.uid(), 
  'owner'
FROM public.teams 
WHERE name = 'Development Team' AND created_by = auth.uid()
ON CONFLICT DO NOTHING;

-- Add existing profiles as members to teams
-- This will add all existing profiles to the Default Team
INSERT INTO public.team_members (team_id, user_id, role)
SELECT 
  t.id,
  p.id,
  CASE 
    WHEN p.id = auth.uid() THEN 'owner'
    WHEN p.role = 'admin' THEN 'admin'
    ELSE 'member'
  END
FROM 
  public.profiles p,
  public.teams t
WHERE 
  t.name = 'Default Team'
  AND p.id != auth.uid() -- Skip the current user as they're already added as owner
  AND NOT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = t.id AND user_id = p.id
  )
ON CONFLICT DO NOTHING;