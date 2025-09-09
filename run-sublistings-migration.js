const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Running sublistings table migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'supabase/migrations/0017_create_sublistings_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    
    // Test basic connection to Supabase
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Error connecting to Supabase:', connectionError);
      console.log('Please check your environment variables and Supabase configuration.');
      return;
    }
    
    console.log('✅ Connected to Supabase successfully');
    
    console.log('\n🔧 Please run this migration manually in your Supabase SQL Editor:');
    console.log('1. Go to your Supabase Dashboard (https://supabase.com/dashboard)');
    console.log('2. Select your project');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Create a new query and paste the following SQL:');
    console.log('\n' + '='.repeat(80));
    console.log(migrationSQL);
    console.log('='.repeat(80) + '\n');
    console.log('5. Execute the query');
    console.log('6. Verify the tables were created successfully by checking the Table Editor');
    console.log('\n✨ After running the migration, your sublisting system will be ready to use!');
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
  }
}

runMigration();
