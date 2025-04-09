'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function DebugAuth() {
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const checkAuth = async () => {
    try {
      setAuthStatus('checking');
      
      // Get the current session
      const { data, error } = await supabase.auth.getSession();
      
      console.log('[DebugAuth] Session check result:', { data, error });
      
      if (error) {
        console.error('[DebugAuth] Session error:', error);
        setAuthStatus('unauthenticated');
        toast.error('Session Error', {
          description: error.message,
        });
        return;
      }
      
      if (data?.session) {
        setAuthStatus('authenticated');
        setUserId(data.session.user.id);
        setEmail(data.session.user.email);
        setSessionInfo(data.session);
        console.log('[DebugAuth] User authenticated:', data.session.user.id);
      } else {
        setAuthStatus('unauthenticated');
        setUserId(null);
        setEmail(null);
        setSessionInfo(null);
        console.log('[DebugAuth] No active session found');
      }
    } catch (err) {
      console.error('[DebugAuth] Error checking auth:', err);
      setAuthStatus('unauthenticated');
      toast.error('Auth Check Error', {
        description: err instanceof Error ? err.message : 'Unknown error checking authentication',
      });
    }
  };

  // Run on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const handleSignIn = async () => {
    try {
      // This will redirect to the Supabase hosted auth page
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error('[DebugAuth] Sign in error:', error);
        toast.error('Sign In Error', {
          description: error.message,
        });
      }
    } catch (err) {
      console.error('[DebugAuth] Error during sign in:', err);
      toast.error('Sign In Error', {
        description: err instanceof Error ? err.message : 'Unknown error during sign in',
      });
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[DebugAuth] Sign out error:', error);
        toast.error('Sign Out Error', {
          description: error.message,
        });
        return;
      }
      
      toast.success('Signed Out', {
        description: 'You have been signed out successfully',
      });
      
      // Recheck auth status
      checkAuth();
    } catch (err) {
      console.error('[DebugAuth] Error during sign out:', err);
      toast.error('Sign Out Error', {
        description: err instanceof Error ? err.message : 'Unknown error during sign out',
      });
    }
  };

  return (
    <div className="p-4 mb-4 border rounded-md bg-muted/20">
      <h3 className="text-lg font-medium mb-2">Authentication Status</h3>
      
      <div className="flex items-center gap-2 mb-4">
        <div 
          className={`w-3 h-3 rounded-full ${
            authStatus === 'authenticated' ? 'bg-green-500' : 
            authStatus === 'unauthenticated' ? 'bg-red-500' : 'bg-yellow-500'
          }`}
        />
        <span className="font-medium">
          {authStatus === 'authenticated' ? 'Authenticated' : 
           authStatus === 'unauthenticated' ? 'Not Authenticated' : 'Checking...'}
        </span>
      </div>
      
      {authStatus === 'authenticated' && (
        <div className="mb-4">
          <p className="text-sm">Signed in as: <span className="font-medium">{email}</span></p>
          <p className="text-sm text-muted-foreground">User ID: {userId}</p>
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-4">
        {authStatus === 'authenticated' ? (
          <Button size="sm" variant="destructive" onClick={handleSignOut}>
            Sign Out
          </Button>
        ) : (
          <Button size="sm" variant="default" onClick={handleSignIn}>
            Sign In with GitHub
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={checkAuth}>
          Recheck Status
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>
      
      {showDetails && sessionInfo && (
        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">
          {JSON.stringify(sessionInfo, null, 2)}
        </pre>
      )}
    </div>
  );
} 