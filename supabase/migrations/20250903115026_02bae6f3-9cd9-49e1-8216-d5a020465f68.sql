-- Add new profile fields for enhanced user profiles
ALTER TABLE public.profiles 
ADD COLUMN nickname TEXT,
ADD COLUMN bio TEXT CHECK (length(bio) <= 150),
ADD COLUMN avatar_uploaded_url TEXT;

-- Create index for nickname lookups
CREATE INDEX idx_profiles_nickname ON public.profiles(nickname);

-- Add trigger to update updated_at on profile changes
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();