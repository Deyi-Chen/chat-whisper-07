import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  edited_at?: string;
  deleted_at?: string;
  profiles: {
    display_name: string;
    avatar_url?: string;
    is_guest: boolean;
  };
  reactions?: Reaction[];
}

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface UserPresence {
  id: string;
  user_id: string;
  room_id: string;
  is_online: boolean;
  profiles: {
    display_name: string;
    avatar_url?: string;
  };
}

export const useChatRoom = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageHistory, setMessageHistory] = useState<{ [roomId: string]: Message[] }>({});

  // Rate limiting
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const RATE_LIMIT_MS = 2000; // 2 seconds

  // Load rooms
  const loadRooms = useCallback(async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at');

    if (error) {
      console.error('Error loading rooms:', error);
      return;
    }

    setRooms(data || []);
    
    // Set default room to Lobby
    if (data && data.length > 0 && !currentRoom) {
      const lobby = data.find(room => room.name === 'Lobby') || data[0];
      setCurrentRoom(lobby);
    }
  }, [currentRoom]);

  // Load reactions for messages
  const loadReactions = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return {};

    const { data: reactionsData, error } = await supabase
      .from('reactions')
      .select('*')
      .in('message_id', messageIds);

    if (error) {
      console.error('Error loading reactions:', error);
      return {};
    }

    // Group reactions by message_id
    const reactionsByMessage = reactionsData?.reduce((acc, reaction) => {
      if (!acc[reaction.message_id]) {
        acc[reaction.message_id] = [];
      }
      acc[reaction.message_id].push(reaction);
      return acc;
    }, {} as Record<string, Reaction[]>) || {};

    return reactionsByMessage;
  }, []);

  // Load messages for a room
  const loadMessages = useCallback(async (roomId: string, offset = 0, limit = 50) => {
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (messagesError) {
      console.error('Error loading messages:', messagesError);
      return [];
    }

    if (!messagesData || messagesData.length === 0) {
      return [];
    }

    // Get profiles for all users in the messages
    const userIds = [...new Set(messagesData.map(m => m.user_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, is_guest')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error loading profiles:', profilesError);
      return [];
    }

    // Load reactions for all messages
    const messageIds = messagesData.map(m => m.id);
    const reactionsByMessage = await loadReactions(messageIds);

    // Combine messages with profiles and reactions
    const messagesWithProfiles = messagesData.map(message => {
      const profile = profilesData?.find(p => p.user_id === message.user_id);
      return {
        ...message,
        profiles: profile || {
          display_name: 'Unknown User',
          is_guest: true
        },
        reactions: reactionsByMessage[message.id] || []
      };
    }).reverse();

    return messagesWithProfiles;
  }, [loadReactions]);

  // Load user presence
  const loadUserPresence = useCallback(async (roomId: string) => {
    const { data: presenceData, error: presenceError } = await supabase
      .from('user_presence')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_online', true);

    if (presenceError) {
      console.error('Error loading user presence:', presenceError);
      return;
    }

    if (!presenceData || presenceData.length === 0) {
      setOnlineUsers([]);
      return;
    }

    // Get profiles for all online users
    const userIds = presenceData.map(p => p.user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error loading profiles for presence:', profilesError);
      return;
    }

    // Combine presence with profiles
    const presenceWithProfiles = presenceData.map(presence => {
      const profile = profilesData?.find(p => p.user_id === presence.user_id);
      return {
        ...presence,
        profiles: profile || {
          display_name: 'Unknown User'
        }
      };
    });

    setOnlineUsers(presenceWithProfiles);
  }, []);

  // Update user presence
  const updatePresence = useCallback(async (roomId: string, isOnline = true) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: user.id,
        room_id: roomId,
        is_online: isOnline,
        last_seen: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating presence:', error);
    }
  }, [user]);

  // Send message with rate limiting and profanity filter
  const sendMessage = useCallback(async (content: string) => {
    if (!user || !currentRoom) return { error: 'Not authenticated or no room selected' };

    // Rate limiting
    const now = Date.now();
    if (now - lastMessageTime < RATE_LIMIT_MS) {
      return { error: 'Please wait before sending another message' };
    }

    // Length check
    if (content.length > 2000) {
      return { error: 'Message too long. Maximum 2000 characters.' };
    }

    // Basic profanity filter
    const profaneWords = ['spam', 'badword']; // Add more as needed
    const containsProfanity = profaneWords.some(word => 
      content.toLowerCase().includes(word.toLowerCase())
    );

    if (containsProfanity) {
      return { error: 'Message contains inappropriate content' };
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        room_id: currentRoom.id,
        user_id: user.id,
        content: content.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
      return { error: 'Failed to send message' };
    }

    setLastMessageTime(now);
    return { error: null };
  }, [user, currentRoom, lastMessageTime]);

  // Edit message
  const editMessage = useCallback(async (messageId: string, content: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('messages')
      .update({
        content: content.trim(),
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error editing message:', error);
      return { error: 'Failed to edit message' };
    }

    // Update local state
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: content.trim(), edited_at: new Date().toISOString() }
        : msg
    ));

    return { error: null };
  }, [user]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting message:', error);
      return { error: 'Failed to delete message' };
    }

    // Update local state
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, deleted_at: new Date().toISOString() }
        : msg
    ));

    return { error: null };
  }, [user]);

  // Add reaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji
      });

    if (error) {
      console.error('Error adding reaction:', error);
      return { error: 'Failed to add reaction' };
    }

    return { error: null };
  }, [user]);

  // Remove reaction
  const removeReaction = useCallback(async (reactionId: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', reactionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error removing reaction:', error);
      return { error: 'Failed to remove reaction' };
    }

    return { error: null };
  }, [user]);

  // Create new room
  const createRoom = useCallback(async (name: string, description?: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('rooms')
      .insert({
        name: name.trim(),
        description: description?.trim(),
        created_by: user.id
      });

    if (error) {
      console.error('Error creating room:', error);
      return { error: 'Failed to create room' };
    }

    loadRooms();
    return { error: null };
  }, [user, loadRooms]);

  // Switch room
  const switchRoom = useCallback(async (room: Room) => {
    if (currentRoom) {
      // Store current room messages in history
      setMessageHistory(prev => ({
        ...prev,
        [currentRoom.id]: messages
      }));
      
      // Update presence to offline for current room
      await updatePresence(currentRoom.id, false);
    }

    setCurrentRoom(room);
    setLoading(true);

    // Load cached messages or fetch from server
    const cachedMessages = messageHistory[room.id];
    if (cachedMessages) {
      setMessages(cachedMessages);
    } else {
      const newMessages = await loadMessages(room.id);
      setMessages(newMessages);
    }

    // Update presence for new room
    await updatePresence(room.id, true);
    await loadUserPresence(room.id);
    
    setLoading(false);
  }, [currentRoom, messages, messageHistory, updatePresence, loadMessages, loadUserPresence]);

  // Initialize
  useEffect(() => {
    if (!user) return;

    const initialize = async () => {
      await loadRooms();
      setLoading(false);
    };

    initialize();
  }, [user, loadRooms]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentRoom) return;

    // Load initial data
    const initializeRoom = async () => {
      const newMessages = await loadMessages(currentRoom.id);
      setMessages(newMessages);
      await updatePresence(currentRoom.id, true);
      await loadUserPresence(currentRoom.id);
    };

    initializeRoom();

    // Subscribe to new messages
    const messageChannel = supabase
      .channel('room-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${currentRoom.id}`
        },
        async (payload) => {
          // Get the profile for the new message
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url, is_guest')
            .eq('user_id', payload.new.user_id)
            .single();

          const newMessage: Message = {
            ...payload.new,
            profiles: profileData || {
              display_name: 'Unknown User',
              is_guest: true
            }
          } as Message;

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    // Subscribe to presence changes
    const presenceChannel = supabase
      .channel('room-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `room_id=eq.${currentRoom.id}`
        },
        () => {
          loadUserPresence(currentRoom.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [currentRoom, loadMessages, loadUserPresence, updatePresence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentRoom && user) {
        updatePresence(currentRoom.id, false);
      }
    };
  }, [currentRoom, user, updatePresence]);

  return {
    messages,
    rooms,
    currentRoom,
    onlineUsers,
    loading,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    createRoom,
    switchRoom,
    loadMessages: (offset: number) => currentRoom ? loadMessages(currentRoom.id, offset) : Promise.resolve([])
  };
};