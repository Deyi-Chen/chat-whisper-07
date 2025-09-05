import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2 } from 'lucide-react';

interface ProfileEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    display_name: string;
    nickname?: string;
    bio?: string;
    avatar_url?: string;
    avatar_uploaded_url?: string;
  };
  onProfileUpdate: () => void;
}

const ProfileEditor = ({ open, onOpenChange, profile, onProfileUpdate }: ProfileEditorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    nickname: profile.nickname || profile.display_name,
    bio: profile.bio || '',
    avatar_url: profile.avatar_uploaded_url || profile.avatar_url || '',
  });

  const handleAvatarUpload = async (file: File) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login required",
        description: "Sign in to upload an avatar."
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or WebP image."
      });
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 2MB."
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const objectName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(objectName, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(objectName);

      const publicUrl = data.publicUrl;

      // Update DB immediately
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          avatar_uploaded_url: publicUrl,
        })
        .eq('id', user.id);

      if (dbError) {
        throw dbError;
      }

      // Update local state for instant preview
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      toast({
        title: "Avatar updated",
        description: "Looking good, superstar."
      });
      
      onProfileUpdate?.();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: (error as any)?.message || "Check console/network tab."
      });
    } finally {
      setUploadingAvatar(false);
      // Reset file input so re-selecting same file retriggers onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate nickname length
    if (formData.nickname.length < 2 || formData.nickname.length > 24) {
      toast({
        variant: "destructive",
        title: "Invalid nickname",
        description: "Nickname must be between 2 and 24 characters."
      });
      return;
    }

    // Check for reserved usernames
    const reservedNames = ['admin', 'system', 'bot', 'moderator', 'support'];
    if (reservedNames.includes(formData.nickname.toLowerCase())) {
      toast({
        variant: "destructive",
        title: "Reserved username",
        description: "This username is reserved. Please choose another."
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: formData.nickname.trim(),
          bio: formData.bio.trim(),
          avatar_uploaded_url: formData.avatar_url,
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully."
      });
      
      onProfileUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Failed to update profile. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.avatar_url} />
                <AvatarFallback className="text-lg">
                  {(formData.nickname || profile.display_name).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar || !user}
                title={!user ? "Sign in to upload an avatar" : undefined}
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleAvatarUpload(file);
                }
              }}
            />
            <p className="text-xs text-muted-foreground text-center">
              Upload a profile picture (max 2MB, JPG/PNG/WebP)
            </p>
          </div>

          {/* Nickname */}
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              value={formData.nickname}
              onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
              placeholder="Enter your nickname"
              maxLength={24}
              required
            />
            <p className="text-xs text-muted-foreground">
              2-24 characters, displayed in chat messages
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell others about yourself..."
              maxLength={150}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/150 characters
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditor;