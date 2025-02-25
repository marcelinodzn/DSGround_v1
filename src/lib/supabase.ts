import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient>

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      }
    )
  }
  return supabaseClient
}

export const supabase = getSupabaseClient()
