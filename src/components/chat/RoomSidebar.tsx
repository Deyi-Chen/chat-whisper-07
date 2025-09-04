import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Room, UserPresence } from '@/hooks/useChatRoom';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Hash, Users, LogOut, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import ProfileEditor from './ProfileEditor';

interface RoomSidebarProps {
  rooms: Room[];
  currentRoom: Room | null;
  onlineUsers: UserPresence[];
  onRoomSwitch: (room: Room) => void;
  onCreateRoom: (name: string, description?: string) => Promise<{ error: any }>;
  className?: string;
}

const RoomSidebar = ({ 
  rooms, 
  currentRoom, 
  onlineUsers, 
  onRoomSwitch, 
  onCreateRoom,
  className 
}: RoomSidebarProps) => {
  const { user, signOut } = useAuth();
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    display_name: string;
    nickname?: string;
    bio?: string;
    avatar_url?: string;
    avatar_uploaded_url?: string;
  } | null>(null);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      toast({
        title: "Error",
        description: "Room name is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { error } = await onCreateRoom(newRoomName, newRoomDescription);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `Room "${newRoomName}" created!`,
      });
      setNewRoomName('');
      setNewRoomDescription('');
      setIsCreateDialogOpen(false);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, nickname, bio, avatar_url, avatar_uploaded_url')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      setUserProfile(data);
    };

    loadUserProfile();
  }, [user]);

  const handleProfileUpdate = () => {
    // Reload user profile after update
    if (user) {
      supabase
        .from('profiles')
        .select('display_name, nickname, bio, avatar_url, avatar_uploaded_url')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setUserProfile(data);
        });
    }
  };

  const displayName = userProfile?.nickname || userProfile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = userProfile?.avatar_uploaded_url || userProfile?.avatar_url;

  return (
    <div className={cn("flex flex-col h-full bg-sidebar border-r", className)}>
      {/* User Profile Section */}
      <div className="p-4 border-b bg-sidebar-accent/50">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-xs font-medium">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.user_metadata?.is_guest ? 'Guest User' : 'Registered User'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsProfileDialogOpen(true)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Rooms Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-sidebar-foreground">Rooms</h3>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input
                      id="room-name"
                      placeholder="Enter room name..."
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room-description">Description (Optional)</Label>
                    <Input
                      id="room-description"
                      placeholder="Enter room description..."
                      value={newRoomDescription}
                      onChange={(e) => setNewRoomDescription(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Creating..." : "Create Room"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <ScrollArea className="h-48">
            <div className="space-y-1">
              {rooms.map((room) => (
                <Button
                  key={room.id}
                  variant={currentRoom?.id === room.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onRoomSwitch(room)}
                  className="w-full justify-start gap-2 h-8 text-left"
                >
                  <Hash className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{room.name}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Online Users Section */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-sidebar-foreground" />
            <h3 className="text-sm font-semibold text-sidebar-foreground">
              Online Users
            </h3>
            <Badge variant="secondary" className="text-xs">
              {onlineUsers.length}
            </Badge>
          </div>
          
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {onlineUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No users online</p>
              ) : (
                onlineUsers.map((presence) => (
                  <div key={presence.id} className="flex items-center gap-2">
                    <div className="relative">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={presence.profiles.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {presence.profiles.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full border border-background" />
                    </div>
                    <span className="text-xs truncate flex-1">
                      {presence.profiles.display_name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Profile Editor Dialog */}
      {userProfile && (
        <ProfileEditor
          open={isProfileDialogOpen}
          onOpenChange={setIsProfileDialogOpen}
          profile={userProfile}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default RoomSidebar;