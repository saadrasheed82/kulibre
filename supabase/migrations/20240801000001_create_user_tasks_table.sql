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