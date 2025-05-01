# Tasks Feature Setup

This document provides instructions on how to set up the Tasks feature in the Supabase database.

## Creating the User Tasks Table

To enable the Tasks feature, you need to create a `user_tasks` table in your Supabase database. You can do this by running the following SQL in the Supabase SQL Editor:

```sql
-- Create user_tasks table
CREATE TABLE IF NOT EXISTS public.user_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own tasks
CREATE POLICY "Users can view their own tasks"
  ON public.user_tasks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own tasks
CREATE POLICY "Users can insert their own tasks"
  ON public.user_tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own tasks
CREATE POLICY "Users can update their own tasks"
  ON public.user_tasks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own tasks
CREATE POLICY "Users can delete their own tasks"
  ON public.user_tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.user_tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
```

## Accessing the SQL Editor

1. Log in to your Supabase dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Create a new query
5. Paste the SQL above
6. Click "Run" to execute the query

## Verifying the Setup

After running the SQL, you should see the `user_tasks` table in the "Table Editor" section of your Supabase dashboard. You can verify that the table was created correctly by checking that it has the following columns:

- id
- title
- description
- status
- priority
- due_date
- completed_at
- user_id
- created_at
- updated_at

## Troubleshooting

If you encounter any issues with the Tasks feature, check the following:

1. Make sure the `user_tasks` table exists in your Supabase database
2. Verify that Row Level Security (RLS) is enabled for the table
3. Check that the RLS policies are correctly configured
4. Ensure that your Supabase client is properly authenticated

If you continue to experience issues, please contact the administrator for assistance.