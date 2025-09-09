const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables - check multiple locations
const envFiles = ['.env.local', '.env']
let envLoaded = false

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    require('dotenv').config({ path: envFile })
    console.log(`📄 Loaded environment variables from ${envFile}`)
    envLoaded = true
    break
  }
}

if (!envLoaded) {
  console.log('⚠️  No .env file found, trying system environment variables')
  require('dotenv').config()
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Environment variable check:')
console.log(`- NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Found' : '❌ Missing'}`)
console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Found' : '❌ Missing'}`)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing required environment variables')
  console.error('\n💡 Please run the migration manually in your Supabase SQL editor:')
  console.error('1. Go to your Supabase dashboard')
  console.error('2. Navigate to SQL Editor')
  console.error('3. Copy and paste the contents of: supabase/migrations/0016_add_sublisting_session_management.sql')
  console.error('4. Click "Run"')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
  try {
    console.log('🚀 Testing Supabase connection...')

    // Test basic connection
    const { data, error } = await supabase.from('users').select('id').limit(1)
    
    if (error) {
      console.error('❌ Connection test failed:', error)
      console.error('\n💡 Please run the migration manually in your Supabase SQL editor:')
      console.error('1. Go to your Supabase dashboard')
      console.error('2. Navigate to SQL Editor')
      console.error('3. Copy and paste the contents of: supabase/migrations/0016_add_sublisting_session_management.sql')
      console.error('4. Click "Run"')
      return
    }

    console.log('✅ Supabase connection successful!')
    
    // Check if migration is already applied
    console.log('\n🔍 Checking if sublisting tables already exist...')
    
    const { data: existingTable, error: tableError } = await supabase
      .from('sublisting_sessions')
      .select('id')
      .limit(0)
    
    if (!tableError) {
      console.log('✅ Sublisting tables already exist! Migration appears to be complete.')
      console.log('\n🎉 You can now use the sublisting session management system!')
      return
    }

    console.log('📋 Sublisting tables do not exist yet.')
    console.log('\n📝 To run the migration:')
    console.log('1. Go to your Supabase dashboard: ' + supabaseUrl.replace('/rest/v1', ''))
    console.log('2. Navigate to SQL Editor')
    console.log('3. Create a new query')
    console.log('4. Copy and paste the contents of: supabase/migrations/0016_add_sublisting_session_management.sql')
    console.log('5. Click "Run"')
    
    // Show the migration file path
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '0016_add_sublisting_session_management.sql')
    if (fs.existsSync(migrationPath)) {
      console.log('\n📄 Migration file location: ' + migrationPath)
      console.log('📏 Migration file size: ' + fs.statSync(migrationPath).size + ' bytes')
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    console.error('\n💡 Please run the migration manually in your Supabase SQL editor')
  }
}

// Run the connection test
testConnection()
