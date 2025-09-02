import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus } from 'lucide-react';
import { Reaction } from '@/hooks/useChatRoom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface MessageReactionsProps {
  reactions: Reaction[];
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (reactionId: string) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😄', '😮', '😢', '😡', '🎉', '🔥'];

const MessageReactions = ({ reactions, onAddReaction, onRemoveReaction }: MessageReactionsProps) => {
  const { user } = useAuth();
  const [showPicker, setShowPicker] = useState(false);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  const handleReactionClick = (emoji: string) => {
    if (!user) return;
    
    const userReaction = groupedReactions[emoji]?.find(r => r.user_id === user.id);
    if (userReaction) {
      onRemoveReaction(userReaction.id);
    } else {
      onAddReaction(emoji);
    }
  };

  if (reactions.length === 0) {
    return (
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-2 w-auto" side="top">
          <div className="flex gap-1 flex-wrap max-w-48">
            {QUICK_REACTIONS.map(emoji => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-accent"
                onClick={() => {
                  onAddReaction(emoji);
                  setShowPicker(false);
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-1">
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const count = reactionList.length;
        const userReacted = user && reactionList.some(r => r.user_id === user.id);
        
        return (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 text-xs gap-1 rounded-full border",
              userReacted 
                ? "bg-primary/10 border-primary/20 text-primary" 
                : "border-border hover:bg-accent"
            )}
            onClick={() => handleReactionClick(emoji)}
          >
            <span>{emoji}</span>
            <span className="text-xs">{count}</span>
          </Button>
        );
      })}
      
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-2 w-auto" side="top">
          <div className="flex gap-1 flex-wrap max-w-48">
            {QUICK_REACTIONS.map(emoji => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-accent"
                onClick={() => {
                  onAddReaction(emoji);
                  setShowPicker(false);
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MessageReactions;