import { useEffect, useState } from 'react';
import { useTypographyStore } from '@/store/typography';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';

export function TypographySyncStatus() {
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState('');
  
  // Monitor synchronization events
  useEffect(() => {
    // Function to handle sync start events
    const handleSyncStarted = () => {
      setSyncState('syncing');
      setMessage('Synchronizing typography data...');
    };
    
    // Function to handle sync completion events
    const handleSyncCompleted = () => {
      setSyncState('success');
      setLastSync(new Date().toLocaleTimeString());
      setMessage('Typography data synchronized successfully');
      
      // Reset to idle after a delay
      setTimeout(() => {
        setSyncState('idle');
      }, 3000);
    };
    
    // Function to handle sync error events
    const handleSyncError = (error: string) => {
      setSyncState('error');
      setMessage(`Sync error: ${error}`);
    };
    
    // Check online status
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine) {
        setMessage('You are offline. Typography changes will sync when you reconnect.');
      }
    };
    
    // Setup listeners for custom sync events
    window.addEventListener('typography-sync-started', handleSyncStarted);
    window.addEventListener('typography-sync-completed', handleSyncCompleted);
    window.addEventListener('typography-sync-error', (e: any) => handleSyncError(e.detail || 'Unknown error'));
    
    // Setup online/offline listeners
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Initial check
    handleOnlineStatus();
    
    // Initialize real-time sync when the component mounts
    const cleanup = useTypographyStore.getState().setupRealTimeSync();
    
    // Cleanup function
    return () => {
      window.removeEventListener('typography-sync-started', handleSyncStarted);
      window.removeEventListener('typography-sync-completed', handleSyncCompleted);
      window.removeEventListener('typography-sync-error', handleSyncError as any);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      
      // Clean up real-time sync
      if (cleanup) cleanup();
    };
  }, []);
  
  // Get the appropriate icon based on the sync state
  const getIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    
    switch (syncState) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };
  
  // Get appropriate badge styling based on the sync state
  const getBadgeVariant = () => {
    if (!isOnline) return 'destructive';
    
    switch (syncState) {
      case 'syncing':
        return 'secondary';
      case 'success':
        return 'success';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getBadgeVariant() as any} className="cursor-default">
            {getIcon()}
            <span className="ml-1">
              {!isOnline ? 'Offline' : 
               syncState === 'syncing' ? 'Syncing...' : 
               syncState === 'error' ? 'Sync Error' : 
               lastSync ? `Synced at ${lastSync}` : 'Ready'}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{message || 'Typography data is ready'}</p>
          {syncState === 'error' && (
            <p className="text-xs mt-1">
              Try refreshing the page if the error persists.
            </p>
          )}
          {!isOnline && (
            <p className="text-xs mt-1">
              Connect to the internet to sync typography data.
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 