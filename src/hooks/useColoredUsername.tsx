import { useMemo } from 'react';

// Accessible color palette for usernames
const USERNAME_COLORS = [
  'hsl(210, 100%, 45%)', // Blue
  'hsl(140, 60%, 40%)',  // Green
  'hsl(270, 60%, 50%)',  // Purple
  'hsl(30, 90%, 50%)',   // Orange
  'hsl(180, 60%, 40%)',  // Teal
  'hsl(320, 60%, 50%)',  // Pink
  'hsl(60, 80%, 45%)',   // Yellow
  'hsl(0, 70%, 50%)',    // Red
  'hsl(200, 60%, 45%)',  // Light Blue
  'hsl(100, 50%, 40%)',  // Lime
  'hsl(300, 50%, 45%)',  // Magenta
  'hsl(40, 70%, 50%)',   // Amber
];

export const useColoredUsername = (userId: string, displayName: string) => {
  return useMemo(() => {
    // Create a simple hash from userId for consistency
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    const colorIndex = Math.abs(hash) % USERNAME_COLORS.length;
    return {
      color: USERNAME_COLORS[colorIndex],
      displayName
    };
  }, [userId, displayName]);
};