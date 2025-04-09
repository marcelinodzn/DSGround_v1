import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const url = new URL(request.url);
  const platformId = url.searchParams.get('platformId');
  const limit = url.searchParams.get('limit') || '20';
  const origin = request.headers.get('origin');
  
  if (!platformId) {
    return new NextResponse(
      JSON.stringify({ error: 'Platform ID is required' }),
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
  
  // Create a supabase client that uses cookies
  const cookieStore = cookies();
  const supabase = createServerClient(
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
    // Fetch history data from the new typography_history table
    const { data, error } = await supabase
      .from('typography_history')
      .select('*')
      .eq('platform_id', platformId)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));
    
    if (error) {
      console.error('[History API] Error fetching typography history:', error);
      return new NextResponse(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    // Get unique user IDs for user info
    const userIds = [...new Set(data.map((item: any) => item.user_id).filter(Boolean))];
    
    // Fetch user information if we have user IDs
    let users: Record<string, any> = {};
    
    if (userIds.length > 0) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, display_name')
        .in('id', userIds);
      
      if (!userError && userData) {
        // Create a map of user ID to user data
        users = userData.reduce((acc: Record<string, any>, user: any) => {
          acc[user.id] = user;
          return acc;
        }, {});
      }
    }
    
    // Enrich history data with user information
    const enrichedData = data.map((item: any) => ({
      ...item,
      user: item.user_id ? users[item.user_id] || { id: item.user_id } : null
    }));
    
    return new NextResponse(
      JSON.stringify(enrichedData),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  } catch (err) {
    console.error('[History API] Unexpected error:', err);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 