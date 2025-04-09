import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// This endpoint syncs the current user from Supabase Auth to our custom users table
// It helps ensure we have user data available for history tracking
export async function POST(req: Request) {
  // Add CORS headers
  const origin = req.headers.get('origin');
  
  // Create a supabase client that uses cookies
  const cookieStore = cookies();
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    // Get the current authenticated user using the server client
    const { data: sessionData, error: sessionError } = await supabaseServer.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      return new NextResponse(
        JSON.stringify({ error: 'User must be authenticated' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    const userId = sessionData.session.user.id;
    const userEmail = sessionData.session.user.email;
    
    // Check if user already exists in our custom table
    const { data: existingUser, error: checkError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking for existing user:', checkError);
      return new NextResponse(
        JSON.stringify({ error: checkError.message }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    let result;
    
    // Create display name from email (everything before the @)
    const displayName = userEmail ? userEmail.split('@')[0] : `User-${userId.substring(0, 8)}`;
    
    // If user exists, update the record
    if (existingUser) {
      // Only update if email has changed
      if (existingUser.email !== userEmail) {
        const { data, error } = await supabaseServer
          .from('users')
          .update({
            email: userEmail,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (error) {
          console.error('Error updating user:', error);
          return new NextResponse(
            JSON.stringify({ error: error.message }),
            { 
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin || '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              }
            }
          );
        }
        
        result = { action: 'updated', user: { id: userId, email: userEmail } };
      } else {
        // User already exists and is up to date
        result = { action: 'none', user: existingUser };
      }
    } else {
      // Create new user record
      const { data, error } = await supabaseServer
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          display_name: displayName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (error) {
        console.error('Error creating user:', error);
        return new NextResponse(
          JSON.stringify({ error: error.message }),
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': origin || '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        );
      }
      
      result = { action: 'created', user: data?.[0] };
    }
    
    return new NextResponse(
      JSON.stringify(result),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  } catch (err) {
    console.error('Unexpected error in user sync:', err);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

// Support OPTIONS request for CORS preflight
export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin');
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 