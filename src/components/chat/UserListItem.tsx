import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { UserPresence } from '@/hooks/useChatRoom';
import ProfileCard from './ProfileCard';
import { format } from 'date-fns';

interface UserListItemProps {
  user: UserPresence;
}

const UserListItem = ({ user }: UserListItemProps) => {
  const displayName = user.profiles.nickname || user.profiles.display_name;
  const avatarUrl = user.profiles.avatar_uploaded_url || user.profiles.avatar_url;
  
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-xs">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium truncate">
                {displayName}
              </span>
            </div>
            {user.last_seen && (
              <div className="text-xs text-muted-foreground">
                Last seen: {format(new Date(user.last_seen), 'HH:mm:ss')}
              </div>
            )}
          </div>
        </div>
      </HoverCardTrigger>
      
      <HoverCardContent side="left" className="p-0">
        <ProfileCard 
          profile={{
            display_name: user.profiles.display_name,
            nickname: user.profiles.nickname,
            bio: user.profiles.bio,
            avatar_url: user.profiles.avatar_url,
            avatar_uploaded_url: user.profiles.avatar_uploaded_url,
          }}
          userId={user.user_id}
        />
      </HoverCardContent>
    </HoverCard>
  );
};

export default UserListItem;