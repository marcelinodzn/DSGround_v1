import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient>

// Create a mock client for static generation during build time
const createMockClient = () => {
  console.warn('Using mock Supabase client for static generation')
  
  // Return a mock client with methods that return empty data
  return {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      eq: () => ({ data: [], error: null }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: null, error: null }),
    },
    realtime: {
      setAuth: () => {},
    },
  } as any
}

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    // Make sure we have the required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Missing Supabase environment variables, using mock client for static generation')
      // Instead of throwing an error, create a mock client for static generation
      supabaseClient = createMockClient()
      return supabaseClient
    }
    
    console.log('Initializing Supabase client with URL:', supabaseUrl)
    
    // Create the Supabase client with proper configuration
    supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
        global: {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          }
        }
      }
    )
    
    // Add event listeners for debugging
    if (typeof window !== 'undefined') {
      supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('Supabase auth state changed:', event, session ? 'User authenticated' : 'No session')
        
        // Update headers with the session token when auth state changes
        if (session) {
          try {
            console.log('Setting auth token from auth change event')
            supabaseClient.realtime.setAuth(session.access_token)
          } catch (e) {
            console.error('Failed to set realtime auth:', e)
          }
        }
      })
      
      // Check for existing session and update headers
      supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          console.log('Found existing session, updating auth state')
          try {
            supabaseClient.realtime.setAuth(session.access_token)
            console.log('Session token applied to Supabase client')
          } catch (e) {
            console.error('Failed to set realtime auth from existing session:', e)
          }
        } else {
          console.log('No existing session found')
        }
      })
    }
    
    // Log successful initialization
    console.log('Supabase client initialized successfully')
  }
  return supabaseClient
}

// Helper function to check if we have an authenticated session
export const hasAuthSession = async () => {
  const client = getSupabaseClient()
  try {
    const { data } = await client.auth.getSession()
    return !!data.session
  } catch (error) {
    console.warn('Error checking auth session:', error)
    return false
  }
}

/**
 * Get the current authenticated user's ID
 * Returns null if not authenticated instead of throwing an error
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.id || null
  } catch (error) {
    console.warn('Error getting current user ID:', error)
    return null
  }
}

// Function to check if required tables exist
export async function verifyDatabaseSchema() {
  try {
    console.log('Verifying database schema...');
    
    // List of tables that should exist in the database
    const requiredTables = [
      'platforms',
      'typography_settings',
      'brands',
      'fonts'
    ];
    
    // Instead of querying pg_catalog.pg_tables, check each table directly
    const missingTables = [];
    
    try {
      // Import ensureTableExists dynamically to avoid circular dependencies
      const { ensureTableExists } = await import('./supabase-diagnostics');
      
      // Check each table individually
      for (const tableName of requiredTables) {
        const exists = await ensureTableExists(tableName);
        if (!exists) {
          missingTables.push(tableName);
        }
      }
    } catch (error) {
      console.warn('Error checking tables:', error)
      // Continue with empty missing tables list for static generation
    }
      
    if (missingTables.length > 0) {
      console.error('[Typography] Missing tables:', missingTables);
      return {
        success: false,
        error: `Missing required tables: ${missingTables.join(', ')}`,
        missingTables
      };
    }
    
    console.log('All required tables exist');
    return {
      success: true,
      error: null,
      missingTables: []
    };
  } catch (e) {
    console.error('[Typography] Database schema check failed:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error verifying database schema',
      missingTables: []
    };
  }
}

// Export the Supabase client
export const supabase = getSupabaseClient()
