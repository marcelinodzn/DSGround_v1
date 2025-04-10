'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LogIn, LogOut, User, Settings, Mail, Lock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";


export function ProfileSidebar() {
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [isSignInDialogOpen, setIsSignInDialogOpen] = useState(false);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const checkAuth = async () => {
    try {
      setAuthStatus('checking');
      
      // Get the current session
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[ProfileSidebar] Session error:', error);
        setAuthStatus('unauthenticated');
        return;
      }
      
      if (data?.session) {
        setAuthStatus('authenticated');
        setUserId(data.session.user.id);
        setEmail(data.session.user.email || null);
        
        // Get additional user info
        const userData = data.session.user.user_metadata;
        setName(userData?.full_name || userData?.name || data.session.user.email || null);
        setAvatarUrl(userData?.avatar_url || null);
        
        console.log('[ProfileSidebar] User authenticated:', data.session.user.id);
      } else {
        setAuthStatus('unauthenticated');
        setUserId(null);
        setEmail(null);
        setAvatarUrl(null);
        setName(null);
        console.log('[ProfileSidebar] No active session found');
      }
    } catch (err) {
      console.error('[ProfileSidebar] Error checking auth:', err);
      setAuthStatus('unauthenticated');
    }
  };

  // Run on mount
  useEffect(() => {
    checkAuth();
    
    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      console.log(`[ProfileSidebar] Auth state changed: ${event}`);
      
      if (session) {
        setAuthStatus('authenticated');
        setUserId(session.user.id);
        setEmail(session.user.email || null);
        
        // Get additional user info
        const userData = session.user.user_metadata;
        setName(userData?.full_name || userData?.name || session.user.email || null);
        setAvatarUrl(userData?.avatar_url || null);
      } else {
        setAuthStatus('unauthenticated');
        setUserId(null);
        setEmail(null);
        setName(null);
        setAvatarUrl(null);
      }
    });
    
    // Listen for auth dialog requests from other components
    const handleOpenAuthDialog = () => {
      setIsSignInDialogOpen(true);
    };
    
    window.addEventListener('open-auth-dialog', handleOpenAuthDialog);
    
    return () => {
      authListener?.subscription?.unsubscribe();
      window.removeEventListener('open-auth-dialog', handleOpenAuthDialog);
    };
  }, []);

  const handleSignIn = async () => {
    setIsSignInDialogOpen(true);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsSigningIn(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });
      
      if (error) {
        console.error('[ProfileSidebar] Sign in error:', error);
        toast.error('Sign In Error', {
          description: error.message,
        });
        return;
      }
      
      if (data?.user) {
        toast.success('Signed In', {
          description: `Welcome back, ${data.user.email}!`,
        });
        
        setIsSignInDialogOpen(false);
        setSignInEmail('');
        setSignInPassword('');
        
        // Trigger a refresh of typography data
        window.dispatchEvent(new CustomEvent('refresh-typography-data'));
      }
    } catch (err) {
      console.error('[ProfileSidebar] Error during sign in:', err);
      toast.error('Sign In Error', {
        description: err instanceof Error ? err.message : 'Unknown error during sign in',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsSigningIn(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signInEmail,
        password: signInPassword,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (error) {
        console.error('[ProfileSidebar] Sign up error:', error);
        toast.error('Sign Up Error', {
          description: error.message,
        });
        return;
      }
      
      if (data?.user) {
        toast.success('Check Your Email', {
          description: `A confirmation email has been sent to ${signInEmail}. Please click the link to verify your account.`,
          duration: 6000,
        });
        
        setIsSignInDialogOpen(false);
        setSignInEmail('');
        setSignInPassword('');
      }
    } catch (err) {
      console.error('[ProfileSidebar] Error during sign up:', err);
      toast.error('Sign Up Error', {
        description: err instanceof Error ? err.message : 'Unknown error during sign up',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[ProfileSidebar] Sign out error:', error);
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
      console.error('[ProfileSidebar] Error during sign out:', err);
      toast.error('Sign Out Error', {
        description: err instanceof Error ? err.message : 'Unknown error during sign out',
      });
    }
  };

  // A shorter user name display for the sidebar
  const getShortName = () => {
    if (!name && !email) return 'Guest';
    
    if (name) {
      // Get first name only
      const firstName = name.split(' ')[0];
      return firstName;
    }
    
    // If no name, use email but truncate it
    if (email) {
      const emailName = email.split('@')[0];
      return emailName.length > 10 ? `${emailName.substring(0, 10)}...` : emailName;
    }
    
    return 'User';
  };
  
  // Get initials for the avatar fallback
  const getInitials = () => {
    if (!name && !email) return 'G';
    
    if (name) {
      const nameParts = name.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return name[0].toUpperCase();
    }
    
    if (email) {
      return email[0].toUpperCase();
    }
    
    return 'U';
  };

  const toggleSignMode = () => {
    setIsSignUpMode(!isSignUpMode);
    // Clear any validation errors when switching modes
    setSignInEmail('');
    setSignInPassword('');
  };

  return (
    <>
      <div>
        <Separator className="-mx-4 w-[calc(100%+32px)]" />
        
        {authStatus === 'checking' ? (
          <div className="flex items-center justify-center px-4 py-3">
            <div className="animate-pulse w-6 h-6 rounded-full bg-muted"></div>
            <div className="ml-2 animate-pulse h-4 w-20 bg-muted rounded"></div>
          </div>
        ) : authStatus === 'authenticated' ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full px-4 py-2 justify-start text-xs hover:bg-accent rounded-md">
                <div className="h-6 w-6 mr-2 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name || email || 'User'} className="h-full w-full object-cover" />
                  ) : (
                    <span>{getInitials()}</span>
                  )}
                </div>
                <span className="truncate">{getShortName()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>
                <div className="text-sm font-medium">
                  {name || 'User'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {email}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Settings className="mr-2 h-4 w-4" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button 
            variant="ghost" 
            size="sm"
            className="w-full px-4 py-2 justify-start text-xs hover:bg-accent rounded-md"
            onClick={handleSignIn}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        )}
      </div>

      <Dialog open={isSignInDialogOpen} onOpenChange={setIsSignInDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isSignUpMode ? 'Create account' : 'Sign in to your account'}</DialogTitle>
            <DialogDescription>
              {isSignUpMode 
                ? 'Create a new account to save and sync your typography settings.'
                : 'Sign in to synchronize your typography settings across devices.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={isSignUpMode ? handleEmailSignUp : handleEmailSignIn}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-10"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-col sm:space-y-2">
              <Button type="submit" disabled={isSigningIn}>
                {isSigningIn ? 'Please wait...' : isSignUpMode ? 'Sign Up' : 'Sign In'}
              </Button>
              <Button type="button" variant="ghost" onClick={toggleSignMode}>
                {isSignUpMode ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 