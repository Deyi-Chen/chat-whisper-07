import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Message } from '@/hooks/useChatRoom';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const { user } = useAuth();
  const isOwnMessage = user?.id === message.user_id;
  const timestamp = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });

  return (
    <div className={cn(
      "flex gap-3 p-4 hover:bg-muted/50 transition-colors",
      isOwnMessage && "flex-row-reverse"
    )}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={message.profiles.avatar_url} />
        <AvatarFallback className={cn(
          "text-xs font-medium",
          message.profiles.is_guest && "bg-muted text-muted-foreground"
        )}>
          {message.profiles.display_name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "flex-1 min-w-0",
        isOwnMessage && "text-right"
      )}>
        <div className={cn(
          "flex items-center gap-2 mb-1",
          isOwnMessage && "justify-end"
        )}>
          <span className={cn(
            "font-medium text-sm",
            message.profiles.is_guest && "text-muted-foreground"
          )}>
            {message.profiles.display_name}
            {message.profiles.is_guest && " (Guest)"}
          </span>
          <span className="text-xs text-muted-foreground">
            {timestamp}
          </span>
        </div>
        
        <div className={cn(
          "inline-block max-w-[80%] p-3 rounded-lg break-words whitespace-pre-wrap",
          isOwnMessage 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-muted"
        )}>
          {message.content}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;