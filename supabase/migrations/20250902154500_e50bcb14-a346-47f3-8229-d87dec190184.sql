-- Add support for message editing and reactions
ALTER TABLE messages ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Create reactions table
CREATE TABLE public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS on reactions
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Reactions policies
CREATE POLICY "Anyone can view reactions" 
ON public.reactions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can add reactions" 
ON public.reactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" 
ON public.reactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add reactions to realtime publication
ALTER TABLE public.reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;

-- Update messages replica identity for better realtime updates
ALTER TABLE public.messages REPLICA IDENTITY FULL;