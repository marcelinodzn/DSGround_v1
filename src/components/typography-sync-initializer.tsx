'use client';

import { useEffect } from 'react';
import { useTypographyStore } from '@/store/typography';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * TypographySyncInitializer - Component dedicated to real-time sync setup
 * 
 * This component:
 * 1. Sets up real-time synchronization with Supabase
 * 2. Establishes proper event listeners
 * 3. Cleans up when unmounted
 * 4. Syncs current user to the users table for history tracking
 * 
 * This is separate from the typography-initializer component which
 * focuses on data loading rather than synchronization.
 */
export function TypographySyncInitializer() {
  const setupRealTimeSync = useTypographyStore(state => state.setupRealTimeSync);
  
  // Sync the current user to our custom users table
  const syncCurrentUser = async () => {
    try {
      // Check if we have an authenticated user
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session) {
        // Call our sync API to ensure user exists in our custom table
        const response = await fetch('/api/users/sync', {
          method: 'POST',
          credentials: 'include',
        });
        
        if (!response.ok) {
          // Parse error response
          try {
            const errorData = await response.json();
            console.error('[TypographySyncInitializer] User sync failed:', errorData);
            
            if (response.status === 401) {
              // Authentication error
              toast.error('Authentication Required', {
                description: 'Please sign in to use all features',
                duration: 5000
              });
            } else {
              // Other errors
              toast.error('Sync Error', {
                description: errorData?.error || 'Failed to sync user data',
                duration: 5000
              });
            }
          } catch (e) {
            console.error('[TypographySyncInitializer] Error parsing error response:', e);
          }
          return;
        }
        
        console.log('[TypographySyncInitializer] User synced to custom users table');
      } else {
        console.log('[TypographySyncInitializer] No authenticated user, skipping sync');
      }
    } catch (error) {
      console.error('[TypographySyncInitializer] Error syncing user:', error);
      toast.error('Sync Error', {
        description: 'Could not sync user data. Some features may be limited.',
        duration: 5000
      });
    }
  };
  
  useEffect(() => {
    console.log('[TypographySyncInitializer] Setting up real-time sync');
    
    // Setup real-time sync for typography data
    const cleanup = setupRealTimeSync();
    
    // Sync the current user for history tracking
    syncCurrentUser().catch(err => {
      console.error('[TypographySyncInitializer] Unexpected error in syncCurrentUser:', err);
    });
    
    // Return cleanup function
    return () => {
      console.log('[TypographySyncInitializer] Cleaning up real-time sync');
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [setupRealTimeSync]);
  
  // This component doesn't render anything
  return null;
}
