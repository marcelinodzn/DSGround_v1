'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * SupabaseSyncManager - Component to ensure proper synchronization with Supabase
 * This component:
 * 1. Checks authentication status
 * 2. Shows sync status indicators
 * 3. Helps debug sync issues across browsers
 */
export function SupabaseSyncManager() {
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[SyncManager] Auth error:', error);
          setAuthStatus('unauthenticated');
          setError(`Authentication error: ${error.message}`);
          return;
        }
        
        if (data?.session) {
          console.log('[SyncManager] User authenticated');
          setAuthStatus('authenticated');
        } else {
          console.log('[SyncManager] User not authenticated');
          setAuthStatus('unauthenticated');
        }
      } catch (e) {
        console.error('[SyncManager] Error checking auth:', e);
        setAuthStatus('unauthenticated');
        setError(e instanceof Error ? e.message : 'Unknown authentication error');
      }
    };
    
    // Check initial auth state
    checkAuth();
    
    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      console.log(`[SyncManager] Auth state changed: ${event}`, session ? 'Session exists' : 'No session');
      
      if (session) {
        setAuthStatus('authenticated');
        setError(null);
      } else {
        setAuthStatus('unauthenticated');
      }
    });
    
    // Subscribe to realtime changes for typography_settings with reconnection logic
    let typographySubscription: RealtimeChannel;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const setupRealtimeSubscription = () => {
      console.log('[SyncManager] Setting up realtime subscription for typography settings');
      
      // First remove any existing subscription to avoid duplicates
      if (typographySubscription) {
        try {
          typographySubscription.unsubscribe();
        } catch (e) {
          console.error('[SyncManager] Error unsubscribing from previous channel:', e);
        }
      }
      
      typographySubscription = supabase
        .channel(`typography_changes_${Date.now()}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'typography_settings' 
        }, (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('[SyncManager] Typography settings changed:', payload);
          
          // Notify the UI to refresh data when changes come in
          // This will trigger a re-fetch in components that need the data
          window.dispatchEvent(new CustomEvent('typographySettingsChanged', { 
            detail: { 
              platformId: payload.new?.platform_id,
              operation: payload.eventType,
              timestamp: new Date()
            } 
          }));
          
          setSyncStatus('synced');
          setLastSyncTime(new Date());
        })
        .subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
          console.log(`[SyncManager] Realtime subscription status:`, status);
          
          if (status === 'SUBSCRIBED') {
            console.log('[SyncManager] Successfully subscribed to typography changes');
            reconnectAttempts = 0; // Reset reconnect counter on success
            setSyncStatus('synced');
            setError(null);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[SyncManager] Error subscribing to typography changes');
            setSyncStatus('error');
            setError('Could not subscribe to real-time updates. Some changes may not be reflected immediately.');
            
            // Try to reconnect with exponential backoff
            if (reconnectAttempts < maxReconnectAttempts) {
              reconnectAttempts++;
              const delay = Math.min(1000 * (2 ** reconnectAttempts), 30000); // Max 30 second delay
              console.log(`[SyncManager] Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts})`);
              
              setTimeout(() => {
                console.log(`[SyncManager] Reconnecting now (attempt ${reconnectAttempts})`);
                setupRealtimeSubscription();
              }, delay);
            }
          }
        });
    };
    
    // Initial subscription setup
    setupRealtimeSubscription();
    
    // Monitor network status
    const handleOnline = () => {
      console.log('[SyncManager] Network online');
      setSyncStatus('synced');
      setError(null);
    };
    
    const handleOffline = () => {
      console.log('[SyncManager] Network offline');
      setSyncStatus('error');
      setError('Network connection lost. Changes will be synchronized when connection is restored.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set up event listener for custom sync events
    const handleSyncEvent = (event: CustomEvent) => {
      if (event.detail.status === 'syncing') {
        setSyncStatus('syncing');
      } else if (event.detail.status === 'synced') {
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      } else if (event.detail.status === 'error') {
        setSyncStatus('error');
        setError(event.detail.error || 'Unknown sync error');
      }
    };
    
    window.addEventListener('supabaseSyncStatusChange', handleSyncEvent as EventListener);
    
    // Cleanup 
    return () => {
      authListener?.subscription?.unsubscribe();
      // Ensure the typographySubscription exists before trying to unsubscribe
      if (typographySubscription) {
        try {
          typographySubscription.unsubscribe();
        } catch (e) {
          console.error('[SyncManager] Error unsubscribing during cleanup:', e);
        }
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('supabaseSyncStatusChange', handleSyncEvent as EventListener);
    };
  }, []);
  
  // No visual component by default - this is just to manage sync state
  // You can optionally show a small status indicator
  if (!showDebug) return null;
  
  return (
    <div 
      style={{ 
        position: 'fixed',
        bottom: 16,
        right: 16,
        padding: '8px 12px',
        backgroundColor: syncStatus === 'synced' ? '#4CAF50' : 
                        syncStatus === 'syncing' ? '#2196F3' : '#F44336',
        color: 'white',
        borderRadius: 4,
        fontSize: 12,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 9999,
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => setShowDebug(!showDebug)}
    >
      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
        {syncStatus === 'synced' ? 'Synced with Supabase' : 
         syncStatus === 'syncing' ? 'Syncing...' : 'Sync Error'}
      </div>
      
      {lastSyncTime && (
        <div style={{ fontSize: 10 }}>
          Last sync: {lastSyncTime.toLocaleTimeString()}
        </div>
      )}
      
      {error && (
        <div style={{ marginTop: 4, color: '#FFCDD2', fontSize: 10 }}>
          {error}
        </div>
      )}
      
      <div style={{ marginTop: 4, fontSize: 10 }}>
        Auth: {authStatus}
      </div>
    </div>
  );
}

// Helper functions for triggering sync status changes from anywhere in the app
export function notifySyncStarted() {
  window.dispatchEvent(new CustomEvent('supabaseSyncStatusChange', { 
    detail: { status: 'syncing' } 
  }));
}

export function notifySyncCompleted() {
  window.dispatchEvent(new CustomEvent('supabaseSyncStatusChange', { 
    detail: { status: 'synced' } 
  }));
  
  // Also dispatch an event to trigger data refresh in components
  window.dispatchEvent(new CustomEvent('typographySettingsChanged', { 
    detail: { 
      operation: 'UPDATE',
      timestamp: new Date()
    } 
  }));
}

export function notifySyncError(error: string) {
  window.dispatchEvent(new CustomEvent('supabaseSyncStatusChange', { 
    detail: { status: 'error', error } 
  }));
} 