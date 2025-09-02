import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useChatRoom } from '@/hooks/useChatRoom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import RoomSidebar from './RoomSidebar';
import { Menu, Hash, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const ChatRoom = () => {
  const { user } = useAuth();
  const {
    messages,
    rooms,
    currentRoom,
    onlineUsers,
    loading,
    sendMessage,
    createRoom,
    switchRoom,
    loadMessages
  } = useChatRoom();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSendMessage = async (content: string) => {
    setSending(true);
    const { error } = await sendMessage(content);
    
    if (error) {
      toast({
        title: "Failed to send message",
        description: error,
        variant: "destructive"
      });
    }
    setSending(false);
  };

  const handleLoadMore = async (offset: number) => {
    if (currentRoom) {
      return await loadMessages(offset);
    }
    return [];
  };

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 border-r">
        <RoomSidebar
          rooms={rooms}
          currentRoom={currentRoom}
          onlineUsers={onlineUsers}
          onRoomSwitch={switchRoom}
          onCreateRoom={createRoom}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b bg-background p-4 flex items-center gap-3">
          {/* Mobile Menu Button */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <RoomSidebar
                rooms={rooms}
                currentRoom={currentRoom}
                onlineUsers={onlineUsers}
                onRoomSwitch={(room) => {
                  switchRoom(room);
                  setIsSidebarOpen(false);
                }}
                onCreateRoom={createRoom}
                className="border-0"
              />
            </SheetContent>
          </Sheet>

          {/* Room Info */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Hash className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold truncate">
                {currentRoom?.name || 'Select a room'}
              </h1>
              {currentRoom && (
                <p className="text-sm text-muted-foreground truncate">
                  {currentRoom.description || 'No description'}
                </p>
              )}
            </div>
          </div>

          {/* Online Users Count & Theme Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{onlineUsers.length}</span>
              <span className="hidden sm:inline">online</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          loading={loading}
          onLoadMore={handleLoadMore}
        />

        {/* Message Input */}
        {currentRoom && (
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={sending}
          />
        )}
      </div>
    </div>
  );
};

export default ChatRoom;