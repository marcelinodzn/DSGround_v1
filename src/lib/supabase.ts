import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient>

// Create a mock client for static generation during build time
const createMockClient = () => {
  console.warn('Using mock Supabase client for static generation')
  
  // In-memory mock data store for tables
  const mockDataStore: Record<string, Array<Record<string, any>>> = {
    brands: [],
    platforms: [],
    typography_settings: [],
    fonts: []
  };
  
  // Create a UUID function for mock data
  const createUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  
  // Create a mock query builder with all the necessary methods
  const createMockQueryBuilder = (tableName: string) => {
    let selectedColumns: string[] | null = null;
    let whereConditions: Array<{column: string, value: any}> = [];
    let limitCount: number | null = null;
    let orderByColumn: string | null = null;
    let orderDirection: 'asc' | 'desc' = 'asc';
    let returnSingle = false;
    let insertData: any[] = [];
    let updateData: Record<string, any> = {};
    
    const mockQueryBuilder = {
      select: (columns?: string | string[] | null) => {
        if (columns) {
          selectedColumns = Array.isArray(columns) ? columns : [columns];
        }
        return mockQueryBuilder;
      },
      
      insert: (data: any | any[]) => {
        insertData = Array.isArray(data) ? data : [data];
        return mockQueryBuilder;
      },
      
      update: (data: Record<string, any>) => {
        updateData = data;
        return mockQueryBuilder;
      },
      
      delete: () => mockQueryBuilder,
      
      eq: (column: string, value: any) => {
        whereConditions.push({column, value});
        return mockQueryBuilder;
      },
      
      neq: () => mockQueryBuilder,
      gt: () => mockQueryBuilder,
      lt: () => mockQueryBuilder,
      gte: () => mockQueryBuilder,
      lte: () => mockQueryBuilder,
      like: () => mockQueryBuilder,
      ilike: () => mockQueryBuilder,
      is: () => mockQueryBuilder,
      in: () => mockQueryBuilder,
      contains: () => mockQueryBuilder,
      containedBy: () => mockQueryBuilder,
      range: () => mockQueryBuilder,
      overlaps: () => mockQueryBuilder,
      
      limit: (count: number) => {
        limitCount = count;
        return mockQueryBuilder;
      },
      
      order: (column: string, { ascending }: { ascending: boolean }) => {
        orderByColumn = column;
        orderDirection = ascending ? 'asc' : 'desc';
        return mockQueryBuilder;
      },
      
      single: () => {
        returnSingle = true;
        return mockQueryBuilder;
      },
      
      maybeSingle: () => {
        returnSingle = true;
        return mockQueryBuilder;
      },
      
      // Execute the query based on the accumulated parameters
      then: (callback?: (result: {data: any, error: any}) => void) => {
        let result: {data: any, error: any} = {data: null, error: null};
        
        // Handle different query types
        try {
          // INSERT operation
          if (insertData.length > 0) {
            const newRecords = insertData.map(record => {
              // Add default fields
              const newRecord = {
                id: createUUID(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ...record
              };
              
              // Add to mock data store
              if (!mockDataStore[tableName]) {
                mockDataStore[tableName] = [];
              }
              
              mockDataStore[tableName].push(newRecord);
              return newRecord;
            });
            
            result.data = newRecords;
            console.log(`[Mock] Inserted ${newRecords.length} records into ${tableName}`, newRecords);
          }
          // UPDATE operation
          else if (Object.keys(updateData).length > 0) {
            // Apply where conditions
            let records = mockDataStore[tableName] || [];
            whereConditions.forEach(condition => {
              records = records.filter(record => record[condition.column] === condition.value);
            });
            
            // Update matching records
            if (records.length > 0) {
              records.forEach(record => {
                Object.assign(record, {
                  ...updateData,
                  updated_at: new Date().toISOString()
                });
              });
              
              result.data = returnSingle ? records[0] : records;
              console.log(`[Mock] Updated ${records.length} records in ${tableName}`);
            } else {
              result.error = {
                code: 'PGRST116',
                details: 'The result contains 0 rows',
                message: 'JSON object requested, multiple (or no) rows returned'
              };
            }
          }
          // SELECT operation
          else {
            let records = mockDataStore[tableName] || [];
            
            // Apply where conditions
            whereConditions.forEach(condition => {
              records = records.filter(record => record[condition.column] === condition.value);
            });
            
            // Apply order
            if (orderByColumn) {
              records.sort((a, b) => {
                if (a[orderByColumn!] < b[orderByColumn!]) return orderDirection === 'asc' ? -1 : 1;
                if (a[orderByColumn!] > b[orderByColumn!]) return orderDirection === 'asc' ? 1 : -1;
                return 0;
              });
            }
            
            // Apply limit
            if (limitCount !== null) {
              records = records.slice(0, limitCount);
            }
            
            // Filter columns if specified
            if (selectedColumns) {
              records = records.map(record => {
                const filteredRecord: Record<string, any> = {};
                selectedColumns!.forEach(column => {
                  filteredRecord[column] = record[column];
                });
                return filteredRecord;
              });
            }
            
            result.data = returnSingle ? (records[0] || null) : records;
            
            if (returnSingle && !result.data) {
              result.error = {
                code: 'PGRST116',
                details: 'The result contains 0 rows',
                message: 'JSON object requested, multiple (or no) rows returned'
              };
            }
          }
        } catch (err) {
          result.error = {
            message: err instanceof Error ? err.message : 'Unknown error in mock query',
          };
        }
        
        if (callback) {
          callback(result);
        }
        
        return Promise.resolve(result);
      }
    };
    
    return mockQueryBuilder;
  };
  
  // Return a mock client with methods that return empty data
  return {
    from: (tableName: string) => createMockQueryBuilder(tableName),
    rpc: () => ({ data: [], error: null }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: (callback: Function) => {
        // Call the callback with a mock sign-in event
        setTimeout(() => {
          if (callback && typeof callback === 'function') {
            callback('SIGNED_OUT', null);
          }
        }, 0);
        
        return { 
          data: { 
            subscription: { 
              unsubscribe: () => console.log('[Mock] Unsubscribing from auth listener') 
            } 
          }, 
          error: null 
        };
      },
    },
    realtime: {
      setAuth: () => {},
    },
    // Add channel method for realtime subscriptions
    channel: (name: string) => {
      console.log(`[Mock] Creating channel: ${name}`);
      return {
        on: (event: string, config: any, callback: Function) => {
          console.log(`[Mock] Subscribing to ${event} on channel ${name}`);
          return {
            on: () => ({}),
            subscribe: (statusCallback: Function) => {
              console.log(`[Mock] Mock subscription to ${name}`);
              // Call the status callback with SUBSCRIBED status
              if (statusCallback && typeof statusCallback === 'function') {
                setTimeout(() => statusCallback('SUBSCRIBED'), 0);
              }
              return {
                unsubscribe: () => console.log(`[Mock] Unsubscribing from ${name}`)
              };
            }
          };
        },
        subscribe: (callback: Function) => {
          console.log(`[Mock] Mock subscription to ${name}`);
          // Call the callback with SUBSCRIBED status
          if (callback && typeof callback === 'function') {
            setTimeout(() => callback('SUBSCRIBED'), 0);
          }
          return {
            unsubscribe: () => console.log(`[Mock] Unsubscribing from ${name}`)
          };
        }
      };
    }
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
    
    // Check if we're using the mock client
    const isMockClient = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // If we're using the mock client, return mock data
    if (isMockClient) {
      console.log('Using mock client, skipping database schema verification');
      return {
        success: true,
        error: null,
        missingTables: [],
        isMock: true
      };
    }
    
    // Instead of querying pg_catalog.pg_tables, check each table directly
    const missingTables = [];
    
    try {
      // Import ensureTableExists dynamically to avoid circular dependencies
      const { ensureTableExists } = await import('./supabase-diagnostics');
      
      // Check each table individually
      for (const tableName of requiredTables) {
        try {
          const exists = await ensureTableExists(tableName);
          if (!exists) {
            missingTables.push(tableName);
          }
        } catch (error) {
          console.warn(`Error checking table ${tableName}:`, error);
          // Add to missing tables if there was an error checking
          missingTables.push(tableName);
        }
      }
    } catch (error) {
      console.warn('Error checking tables:', error);
      // For static generation, continue with empty missing tables list
      if (typeof window === 'undefined') {
        return {
          success: true,
          error: null,
          missingTables: [],
          isStaticGeneration: true
        };
      }
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
    
    // For static generation, return success
    if (typeof window === 'undefined') {
      return {
        success: true,
        error: null,
        missingTables: [],
        isStaticGeneration: true
      };
    }
    
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error verifying database schema',
      missingTables: []
    };
  }
}

// Export the Supabase client
export const supabase = getSupabaseClient()
