import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient>

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    // Make sure we have the required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      throw new Error('Missing Supabase environment variables')
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
  const { data } = await client.auth.getSession()
  return !!data.session
}

/**
 * Get the current authenticated user's ID
 * Throws an error if not authenticated
 */
export const getCurrentUserId = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Authentication required')
  }
  return session.user.id
}

// Export the Supabase client
export const supabase = getSupabaseClient()
