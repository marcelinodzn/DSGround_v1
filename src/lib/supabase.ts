import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient>

// Create a mock client for static generation during build time
const createMockClient = () => {
  console.warn('Using mock Supabase client for static generation')
  
  // Load mock data from localStorage if available
  const loadMockDataFromStorage = (): Record<string, Array<Record<string, any>>> => {
    if (typeof window === 'undefined') {
      return {
        brands: [
          {
            id: '1234-sample-brand-id',
            name: 'Sample Brand',
            description: 'This is a sample brand created by the mock client',
            type: 'master',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        platforms: [],
        typography_settings: [],
        fonts: []
      };
    }
    
    try {
      const storedData = localStorage.getItem('dsground_mock_data');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log('[Mock] Loaded data from localStorage:', parsedData);
        
        // If no brands exist, add a sample brand
        if (!parsedData.brands || parsedData.brands.length === 0) {
          parsedData.brands = [
            {
              id: '1234-sample-brand-id',
              name: 'Sample Brand',
              description: 'This is a sample brand created by the mock client',
              type: 'master',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
        }
        
        return parsedData;
      }
    } catch (error) {
      console.warn('[Mock] Error loading data from localStorage:', error);
    }
    
    return {
      brands: [
        {
          id: '1234-sample-brand-id',
          name: 'Sample Brand',
          description: 'This is a sample brand created by the mock client',
          type: 'master',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      platforms: [],
      typography_settings: [],
      fonts: []
    };
  };
  
  // Save mock data to localStorage
  const saveMockDataToStorage = (data: Record<string, Array<Record<string, any>>>) => {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      localStorage.setItem('dsground_mock_data', JSON.stringify(data));
      console.log('[Mock] Saved data to localStorage');
    } catch (error) {
      console.warn('[Mock] Error saving data to localStorage:', error);
    }
  };
  
  // In-memory mock data store for tables
  const mockDataStore = loadMockDataFromStorage();
  
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
    let isDeleteOperation = false;
    
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
      
      delete: () => {
        isDeleteOperation = true;
        return mockQueryBuilder;
      },
      
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
            
            // Save updated data to localStorage
            saveMockDataToStorage(mockDataStore);
            
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
              
              // Save updated data to localStorage
              saveMockDataToStorage(mockDataStore);
              
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
          // DELETE operation
          else if (isDeleteOperation && whereConditions.length > 0) {
            let recordsBefore = mockDataStore[tableName]?.length || 0;
            let matchingRecords = [...(mockDataStore[tableName] || [])];
            
            // Apply where conditions to find records to delete
            whereConditions.forEach(condition => {
              matchingRecords = matchingRecords.filter(record => record[condition.column] === condition.value);
            });
            
            if (matchingRecords.length > 0) {
              // Remove matching records from the store
              mockDataStore[tableName] = (mockDataStore[tableName] || []).filter(record => {
                return !matchingRecords.some(match => match.id === record.id);
              });
              
              // Save updated data to localStorage
              saveMockDataToStorage(mockDataStore);
              
              let recordsAfter = mockDataStore[tableName]?.length || 0;
              result.data = { count: recordsBefore - recordsAfter };
              console.log(`[Mock] Deleted ${recordsBefore - recordsAfter} records from ${tableName}`);
            } else {
              result.data = { count: 0 };
              console.log(`[Mock] No matching records found to delete in ${tableName}`);
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
      } as any;
    },
  };
};

// Initialize the mock client
supabaseClient = createMockClient() as any;

// Function to get the Supabase client
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    // Make sure we have the required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Missing Supabase environment variables, using mock client for static generation')
      // Instead of throwing an error, create a mock client for static generation
      supabaseClient = createMockClient() as any
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

// Export the Supabase client
export const supabase = getSupabaseClient()