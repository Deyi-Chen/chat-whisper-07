import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import PrivateMessageDialog from './PrivateMessageDialog';

interface ProfileCardProps {
  profile: {
    display_name: string;
    nickname?: string;
    bio?: string;
    avatar_url?: string;
    avatar_uploaded_url?: string;
    is_guest?: boolean;
    created_at?: string;
  };
  userId: string;
}

const ProfileCard = ({ profile, userId }: ProfileCardProps) => {
  const [isPrivateMessageOpen, setIsPrivateMessageOpen] = useState(false);
  const { user } = useAuth();
  const displayName = profile.nickname || profile.display_name;
  const avatarUrl = profile.avatar_uploaded_url || profile.avatar_url;
  
  const canSendMessage = user && user.id !== userId;
  
  return (
    <>
      <Card className="w-80 p-0">
        <CardContent className="p-4 space-y-3">
          {/* Header with avatar and name */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-lg">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base truncate">
                  {displayName}
                </h3>
                {profile.is_guest && (
                  <Badge variant="secondary" className="text-xs">
                    Guest
                  </Badge>
                )}
              </div>
              {profile.nickname && profile.nickname !== profile.display_name && (
                <p className="text-sm text-muted-foreground truncate">
                  @{profile.display_name}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="space-y-1">
              <p className="text-sm leading-relaxed">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Private Message Button */}
          {canSendMessage && (
            <div className="pt-2">
              <Button 
                onClick={() => setIsPrivateMessageOpen(true)}
                variant="outline" 
                size="sm" 
                className="w-full"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Private Message
              </Button>
            </div>
          )}

          {/* Member since */}
          {profile.created_at && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Member since {format(new Date(profile.created_at), 'MMM yyyy')}
              </p>
            </div>
          )}

          {/* User ID for debugging/admin purposes */}
          <div className="pt-1">
            <p className="text-xs text-muted-foreground font-mono truncate">
              ID: {userId.slice(0, 8)}...
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Private Message Dialog */}
      {canSendMessage && (
        <PrivateMessageDialog
          isOpen={isPrivateMessageOpen}
          onClose={() => setIsPrivateMessageOpen(false)}
          recipient={{
            id: userId,
            display_name: profile.display_name,
            nickname: profile.nickname,
            avatar_url: profile.avatar_url,
            avatar_uploaded_url: profile.avatar_uploaded_url,
          }}
        />
      )}
    </>
  );
};

export default ProfileCard;