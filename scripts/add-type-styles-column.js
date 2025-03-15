// Script to add type_styles column to typography_settings table
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTypeStylesColumn() {
  console.log('Starting migration to add type_styles column...');
  
  try {
    // First, check if the column already exists
    const { data: columns, error: columnsError } = await supabase
      .from('typography_settings')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      throw new Error(`Error checking table structure: ${columnsError.message}`);
    }
    
    // If we can access the first row and it has type_styles, the column exists
    if (columns && columns.length > 0 && 'type_styles' in columns[0]) {
      console.log('The type_styles column already exists in the typography_settings table.');
      return;
    }
    
    // The column doesn't exist, so we need to add it
    // We'll use a raw SQL query using the rpc function
    console.log('Adding type_styles column to typography_settings table...');
    
    const { error: rpcError } = await supabase.rpc('execute_sql', {
      sql_query: `
        -- Add type_styles column to typography_settings table
        ALTER TABLE typography_settings ADD COLUMN IF NOT EXISTS type_styles JSONB;
        
        -- Update existing rows to have an empty array for type_styles if null
        UPDATE typography_settings SET type_styles = '[]'::jsonb WHERE type_styles IS NULL;
        
        -- Add comment for documentation
        COMMENT ON COLUMN typography_settings.type_styles IS 'JSON array of typography style definitions';
      `
    });
    
    if (rpcError) {
      throw new Error(`Error executing SQL: ${rpcError.message}`);
    }
    
    console.log('Migration completed successfully!');
    
    // Verify the column was added
    const { data: verifyData, error: verifyError } = await supabase
      .from('typography_settings')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      throw new Error(`Error verifying migration: ${verifyError.message}`);
    }
    
    if (verifyData && verifyData.length > 0 && 'type_styles' in verifyData[0]) {
      console.log('Verified: type_styles column now exists in the typography_settings table.');
    } else {
      console.warn('Warning: Could not verify if type_styles column was added successfully.');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
addTypeStylesColumn();
