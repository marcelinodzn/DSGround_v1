import { supabase, getSupabaseClient } from './supabase';

export async function testSupabaseConnection() {
  console.log('--------------------------------------');
  console.log('TESTING SUPABASE CONNECTION');
  console.log('--------------------------------------');
  
  // Log environment variables
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('NEXT_PUBLIC_SUPABASE_URL defined:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY defined:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // Test if we can connect and query data
  try {
    console.log('Attempting to connect to Supabase and query the brands table...');
    const { data, error } = await supabase.from('brands').select('*').limit(5);
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return { success: false, error, client: 'real' };
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Brands found:', data?.length || 0);
    console.log('First brand (if any):', data?.[0] || 'No brands found');
    
    return {
      success: true,
      client: 'real',
      data
    };
  } catch (err) {
    console.error('Exception when connecting to Supabase:', err);
    return { success: false, error: err, client: 'real' };
  }
}

// Test if a localStorage-related property exists to check if this is a mock client
export function isSupabaseMockClient() {
  const client = getSupabaseClient() as any;
  return !!client.__mockClient;
} 