-- Add new profile fields for enhanced user profiles (skip trigger as it already exists)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT CHECK (length(bio) <= 150),
ADD COLUMN IF NOT EXISTS avatar_uploaded_url TEXT;

-- Create index for nickname lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON public.profiles(nickname);