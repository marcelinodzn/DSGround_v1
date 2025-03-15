'use client';

import { useEffect } from 'react';
import { useTypographyStore } from '@/store/typography';

/**
 * TypographySyncInitializer - Component to initialize real-time sync for typography settings
 * 
 * This component:
 * 1. Sets up event listeners to detect changes from other browsers/tabs
 * 2. Refreshes typography data when changes are detected
 * 3. Makes the application more responsive to changes from other users
 */
export function TypographySyncInitializer() {
  const setupRealTimeSync = useTypographyStore(state => state.setupRealTimeSync);
  
  useEffect(() => {
    // Set up real-time sync listeners
    console.log('[TypographySyncInitializer] Setting up real-time typography sync');
    const cleanup = setupRealTimeSync();
    
    // Return cleanup function
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        console.log('[TypographySyncInitializer] Cleaning up real-time typography sync');
        cleanup();
      }
    };
  }, [setupRealTimeSync]);
  
  // This component doesn't render anything
  return null;
}
