import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UsePresenceHeartbeatProps {
  roomId: string | null;
  enabled?: boolean;
}

export const usePresenceHeartbeat = ({ roomId, enabled = true }: UsePresenceHeartbeatProps) => {
  const { user } = useAuth();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(0);

  const updatePresence = async (isOnline = true) => {
    if (!user || !roomId) return;

    try {
      const now = new Date().toISOString();
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          room_id: roomId,
          is_online: isOnline,
          last_seen: now
        });
      
      lastHeartbeatRef.current = Date.now();
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  const startHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Initial presence update
    updatePresence(true);

    // Set up heartbeat every 10 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      updatePresence(true);
    }, 10000);
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    // Mark as offline when stopping heartbeat
    updatePresence(false);
  };

  // Set up heartbeat when room changes
  useEffect(() => {
    if (!enabled || !user || !roomId) {
      stopHeartbeat();
      return;
    }

    startHeartbeat();

    return () => {
      stopHeartbeat();
    };
  }, [user, roomId, enabled]);

  // Handle page visibility changes
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, reduce heartbeat frequency or stop
        stopHeartbeat();
      } else {
        // Page is visible again, resume heartbeat
        if (user && roomId) {
          startHeartbeat();
        }
      }
    };

    const handleBeforeUnload = () => {
      // Mark as offline when leaving the page
      if (user && roomId) {
        navigator.sendBeacon('/api/offline', JSON.stringify({
          user_id: user.id,
          room_id: roomId
        }));
        // Fallback synchronous call
        updatePresence(false);
      }
    };

    const handleFocus = () => {
      // Resume heartbeat when window gains focus
      if (user && roomId && !heartbeatIntervalRef.current) {
        startHeartbeat();
      }
    };

    const handleBlur = () => {
      // Optional: reduce activity when window loses focus
      // For now, we'll keep the heartbeat running
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [user, roomId, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, []);

  return {
    updatePresence,
    lastHeartbeat: lastHeartbeatRef.current
  };
};
