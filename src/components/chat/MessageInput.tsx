import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

const MessageInput = ({ onSendMessage, disabled }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      textareaRef.current?.focus();
    }
  }, [message, disabled, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleEmojiClick = useCallback((emojiData: EmojiClickData) => {
    const cursor = textareaRef.current?.selectionStart || 0;
    const newMessage = message.slice(0, cursor) + emojiData.emoji + message.slice(cursor);
    setMessage(newMessage);
    setIsEmojiPickerOpen(false);
    
    // Focus and set cursor position after emoji
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursor + emojiData.emoji.length, cursor + emojiData.emoji.length);
      }
    }, 0);
  }, [message]);

  const isValid = message.trim().length > 0 && message.length <= 2000;

  return (
    <div className="border-t bg-background p-4">
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message... (Shift+Enter for new line)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={cn(
              "min-h-[44px] max-h-32 resize-none pr-12",
              message.length > 2000 && "border-destructive focus-visible:ring-destructive"
            )}
          />
          
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={disabled}
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                side="top" 
                align="end" 
                className="p-0 border-0 w-auto"
                sideOffset={8}
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={320}
                  height={400}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <Button 
          type="submit" 
          disabled={!isValid || disabled}
          size="sm"
          className="h-[44px] px-4"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
      
      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
        <span>Enter to send, Shift+Enter for new line</span>
        <span className={cn(
          message.length > 1800 && "text-destructive font-medium"
        )}>
          {message.length}/2000
        </span>
      </div>
    </div>
  );
};

export default MessageInput;