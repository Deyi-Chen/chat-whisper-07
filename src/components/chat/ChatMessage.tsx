import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Message } from '@/hooks/useChatRoom';
import { useAuth } from '@/hooks/useAuth';
import { useColoredUsername } from '@/hooks/useColoredUsername';
import { format, formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Edit, Trash2, Copy } from 'lucide-react';
import MessageReactions from './MessageReactions';

interface ChatMessageProps {
  message: Message;
  onEditMessage?: (messageId: string, content: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (reactionId: string) => void;
}

const ChatMessage = ({ 
  message, 
  onEditMessage, 
  onDeleteMessage, 
  onAddReaction, 
  onRemoveReaction 
}: ChatMessageProps) => {
  const { user } = useAuth();
  const isOwnMessage = user?.id === message.user_id;
  const { color: usernameColor } = useColoredUsername(message.user_id, message.profiles.display_name);
  
  // Precise timestamp format: YYYY.MM.DD.HH:mm:ss
  const preciseTimestamp = format(new Date(message.created_at), 'yyyy.MM.dd.HH:mm:ss');
  const relativeTimestamp = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });
  const fullTimestamp = format(new Date(message.created_at), 'PPp');
  
  // Display nickname if available, otherwise display_name
  const displayName = message.profiles.nickname || message.profiles.display_name;
  
  const isDeleted = !!message.deleted_at;
  const isEdited = !!message.edited_at;

  const handleCopyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}#message-${message.id}`;
    navigator.clipboard.writeText(link);
  };

  if (isDeleted) {
    return (
      <div className="flex gap-3 p-4 opacity-50">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.profiles.avatar_url} />
          <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
            {message.profiles.display_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="font-medium text-sm"
              style={{ color: usernameColor }}
            >
              {displayName}
              {message.profiles.is_guest && " (Guest)"}
            </span>
            <div className="text-xs text-muted-foreground">
              <span className="font-mono">{preciseTimestamp}</span>
              <span className="ml-1 opacity-75">({relativeTimestamp})</span>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground italic">
            Message deleted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      id={`message-${message.id}`}
      className={cn(
        "group flex gap-3 p-4 hover:bg-muted/50 transition-colors",
        isOwnMessage && "flex-row-reverse"
      )}
    >
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
          <span 
            className={cn(
              "font-medium text-sm",
              message.profiles.is_guest && "opacity-75"
            )}
            style={{ color: usernameColor }}
          >
            {displayName}
            {message.profiles.is_guest && " (Guest)"}
          </span>
          <div className="text-xs text-muted-foreground">
            <span className="font-mono">{preciseTimestamp}</span>
            <span className="ml-1 opacity-75">({relativeTimestamp})</span>
          </div>
          {isEdited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
          
          {/* Message Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy link
              </DropdownMenuItem>
              {isOwnMessage && onEditMessage && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      const newContent = prompt('Edit message:', message.content);
                      if (newContent && newContent !== message.content) {
                        onEditMessage(message.id, newContent);
                      }
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {onDeleteMessage && (
                    <DropdownMenuItem 
                      onClick={() => onDeleteMessage(message.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className={cn(
          "inline-block max-w-[80%] p-3 rounded-lg break-words whitespace-pre-wrap",
          isOwnMessage 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-muted"
        )}>
          {message.content}
        </div>
        
        {/* Reactions */}
        {onAddReaction && onRemoveReaction && (
          <MessageReactions
            reactions={message.reactions || []}
            onAddReaction={(emoji) => onAddReaction(message.id, emoji)}
            onRemoveReaction={onRemoveReaction}
          />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;