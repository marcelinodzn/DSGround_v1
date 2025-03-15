// Script to check the typography_settings table structure
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

async function checkTypographyTable() {
  console.log('Checking typography_settings table structure...');
  
  try {
    // First, check if the table exists and get its structure
    const { data, error } = await supabase
      .from('typography_settings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing typography_settings table:', error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('No records found in typography_settings table.');
      
      // Try to insert a test record to see if the table exists
      const { error: insertError } = await supabase
        .from('typography_settings')
        .insert({
          platform_id: 'test_platform',
          scale_method: 'modular',
          scale_config: { baseSize: 16, ratio: 1.2, stepsUp: 3, stepsDown: 2 },
          distance_scale: { viewingDistance: 400, visualAcuity: 1 }
        });
      
      if (insertError) {
        console.error('Error inserting test record:', insertError.message);
        if (insertError.message.includes('type_styles')) {
          console.log('The error is related to the type_styles column.');
        }
      } else {
        console.log('Successfully inserted test record. Table exists but was empty.');
        
        // Clean up the test record
        await supabase
          .from('typography_settings')
          .delete()
          .eq('platform_id', 'test_platform');
      }
      
      return;
    }
    
    // Check if the type_styles column exists
    const firstRecord = data[0];
    console.log('Table structure:', Object.keys(firstRecord));
    
    if ('type_styles' in firstRecord) {
      console.log('The type_styles column exists in the typography_settings table.');
    } else {
      console.log('The type_styles column DOES NOT exist in the typography_settings table.');
      console.log('This is likely causing the synchronization issues.');
    }
    
    // Print the first record for debugging
    console.log('Sample record:', firstRecord);
    
  } catch (error) {
    console.error('Error checking typography_settings table:', error);
  }
}

// Run the check
checkTypographyTable();
