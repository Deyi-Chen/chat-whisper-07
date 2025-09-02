import { useEffect, useRef, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';
import DateSeparator from './DateSeparator';
import { Message } from '@/hooks/useChatRoom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSameDay } from 'date-fns';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  onLoadMore?: (offset: number) => Promise<Message[]>;
  onEditMessage?: (messageId: string, content: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (reactionId: string) => void;
}

const MessageList = ({ 
  messages, 
  loading, 
  onEditMessage, 
  onDeleteMessage, 
  onAddReaction, 
  onRemoveReaction 
}: MessageListProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const prevMessageCount = useRef(messages.length);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
        setShowScrollToBottom(false);
        setAutoScroll(true);
      }
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messages.length > prevMessageCount.current) {
      setTimeout(scrollToBottom, 100);
    }
    prevMessageCount.current = messages.length;
  }, [messages.length, autoScroll, scrollToBottom]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
    setAutoScroll(isAtBottom);
    setShowScrollToBottom(!isAtBottom && messages.length > 0);
  }, [messages.length]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-12 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to start the conversation! Send a message below.
          </p>
          <div className="flex gap-2 justify-center text-2xl">
            <span>👋</span>
            <span>😄</span>
            <span>🎉</span>
            <span>💖</span>
            <span>🚀</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <ScrollArea className="h-full" ref={scrollAreaRef}>
        <div 
          className="h-full"
          onScroll={handleScroll}
        >
          {messages.map((message, index) => {
            const currentDate = new Date(message.created_at);
            const prevMessage = messages[index - 1];
            const prevDate = prevMessage ? new Date(prevMessage.created_at) : null;
            const showDateSeparator = !prevDate || !isSameDay(currentDate, prevDate);

            return (
              <div key={message.id}>
                {showDateSeparator && <DateSeparator date={currentDate} />}
                <ChatMessage 
                  message={message} 
                  onEditMessage={onEditMessage}
                  onDeleteMessage={onDeleteMessage}
                  onAddReaction={onAddReaction}
                  onRemoveReaction={onRemoveReaction}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {showScrollToBottom && (
        <Button
          onClick={scrollToBottom}
          size="sm"
          className={cn(
            "absolute bottom-4 right-4 rounded-full shadow-lg",
            "bg-primary hover:bg-primary/90 text-primary-foreground"
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default MessageList;