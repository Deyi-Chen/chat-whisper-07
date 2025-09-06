-- Fix security vulnerability: Restrict message access to authenticated users only
-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;

-- Create a new secure policy that requires authentication
CREATE POLICY "Authenticated users can view messages" 
  ON public.messages 
  FOR SELECT 
  TO authenticated
  USING (true);