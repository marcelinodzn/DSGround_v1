import { supabase } from './supabase';

/**
 * Performs a comprehensive Supabase diagnostics check
 * to ensure database connection and schema are valid
 */
export async function runSupabaseDiagnostics() {
  console.log('[Diagnostics] Testing Supabase connection...');
  
  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('platforms').select('count');
    
    if (error) {
      console.error('[Diagnostics] Supabase connection failed:', error);
      return {
        connection: {
          success: false,
          error: error.message
        },
        tables: {
          success: false,
          error: 'Skipped due to connection failure',
          existingTables: [],
          missingTables: []
        }
      };
    }
    
    // If connection works, verify the schema
    console.log('[Diagnostics] Supabase connection successful:', data);
    console.log('[Diagnostics] Checking for required tables...');
    
    // Import verifyDatabaseSchema dynamically to avoid circular dependencies
    const { verifyDatabaseSchema } = await import('./supabase');
    const schemaResult = await verifyDatabaseSchema();
    
    return {
      connection: {
        success: true,
        error: null
      },
      tables: schemaResult
    };
  } catch (e) {
    console.error('[Diagnostics] Unexpected error during diagnostics:', e);
    return {
      connection: {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error during diagnostics'
      },
      tables: {
        success: false,
        error: 'Skipped due to connection failure',
        existingTables: [],
        missingTables: []
      }
    };
  }
}

/**
 * Force a direct check if a table exists to help with 
 * cross-browser synchronization issues
 */
export async function ensureTableExists(tableName: string): Promise<boolean> {
  try {
    console.log(`[Diagnostics] Verifying table exists: ${tableName}`);
    
    // Check if we're using the mock client
    const isMockClient = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // If we're using the mock client, return true for static generation
    if (isMockClient || typeof window === 'undefined') {
      console.log(`[Diagnostics] Using mock client, assuming table ${tableName} exists for static generation`);
      return true;
    }
    
    // Try to query the table directly
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);
      
      if (error) {
        console.error(`[Diagnostics] Error querying table ${tableName}:`, error);
        return false;
      }
      
      console.log(`[Diagnostics] Table ${tableName} exists`);
      return true;
    } catch (e) {
      console.error(`[Diagnostics] Error checking if table ${tableName} exists:`, e);
      
      // For static generation, return true
      if (typeof window === 'undefined') {
        return true;
      }
      
      return false;
    }
  } catch (e) {
    console.error(`[Diagnostics] Error in ensureTableExists for ${tableName}:`, e);
    
    // For static generation, return true
    if (typeof window === 'undefined') {
      return true;
    }
    
    return false;
  }
}

/**
 * Diagnostic utility for checking Supabase connectivity
 */
export const checkSupabaseConnection = async (): Promise<{ 
  connected: boolean; 
  error?: string;
  details?: any;
}> => {
  try {
    console.log('[Diagnostics] Testing Supabase connection...');
    
    // Try to ping the Supabase instance
    const { data, error } = await supabase.from('platforms').select('count').limit(1);
    
    if (error) {
      console.error('[Diagnostics] Supabase connection error:', error);
      return { 
        connected: false, 
        error: error.message,
        details: error
      };
    }
    
    // Check if we got a response
    console.log('[Diagnostics] Supabase connection successful:', data);
    return { connected: true };
  } catch (error) {
    console.error('[Diagnostics] Supabase connection exception:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    };
  }
};

/**
 * Checks if all the required tables exist
 */
export const checkRequiredTables = async (): Promise<{
  success: boolean;
  missingTables: string[];
  error?: string;
}> => {
  const requiredTables = [
    'platforms',
    'type_styles',
    'typography_settings'
  ];
  
  try {
    console.log('[Diagnostics] Checking for required tables...');
    
    // Try to use the list_tables function first
    let { data, error } = await supabase.rpc('list_tables');
    
    // If that fails, fall back to direct query (which might also fail)
    if (error) {
      console.warn('[Diagnostics] list_tables function not available, trying direct query:', error);
      
      const result = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
        
      data = result.data;
      error = result.error;
    }
    
    if (error) {
      console.error('[Diagnostics] Error checking tables:', error);
      
      // As a last resort, just check if we can query each table directly
      console.log('[Diagnostics] Trying direct table existence check...');
      
      const existingTables: string[] = [];
      for (const table of requiredTables) {
        try {
          // Just try to count rows, limit 0 means we don't actually fetch any data
          const { error: tableError } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .limit(0);
            
          if (!tableError) {
            existingTables.push(table);
          }
        } catch (e) {
          // Table doesn't exist or can't be accessed
        }
      }
      
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      
      console.log('[Diagnostics] Direct table check result:', {
        existingTables,
        missingTables
      });
      
      return {
        success: missingTables.length === 0,
        missingTables
      };
    }
    
    // Check which tables exist
    const existingTables: string[] = Array.isArray(data) ? data.map((item: any) => 
      typeof item === 'string' ? item : item.table_name
    ) : [];
    
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    console.log('[Diagnostics] Tables check result:', {
      existingTables,
      missingTables
    });
    
    return {
      success: missingTables.length === 0,
      missingTables
    };
  } catch (error) {
    console.error('[Diagnostics] Error during table check:', error);
    return { 
      success: false, 
      missingTables: requiredTables,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Run all diagnostic checks
 */
export const runAllDiagnostics = async () => {
  const connection = await checkSupabaseConnection();
  const tables = connection.connected 
    ? await checkRequiredTables()
    : { success: false, missingTables: [], error: 'Connection failed' };
  
  console.log('[Diagnostics] All diagnostic results:', {
    connection,
    tables
  });
  
  return {
    connection,
    tables
  };
}; 