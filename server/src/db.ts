import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and service key from environment variables
const supabaseUrl = process.env.DATABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

console.log('🔍 Checking database configuration...')
console.log(`DATABASE_URL: ${supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET'}`)
console.log(`SUPABASE_SERVICE_KEY: ${supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'NOT SET'}`)

if (!supabaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set!')
  throw new Error('DATABASE_URL environment variable is not set. It should be your Supabase project URL (https://[project-ref].supabase.co)')
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is not set!')
  throw new Error('SUPABASE_SERVICE_KEY environment variable is not set. Get it from Supabase Dashboard > Project Settings > API > service_role key')
}

// Validate that DATABASE_URL is a Supabase URL
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error(`❌ Invalid DATABASE_URL format: ${supabaseUrl.substring(0, 50)}...`)
  throw new Error(`DATABASE_URL must be a Supabase project URL (https://[project-ref].supabase.co), got: ${supabaseUrl.substring(0, 50)}...`)
}

// Create Supabase client with service key (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('✅ Supabase client initialized with service key')

// Test database connection
export async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...')
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection test failed:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return false
    }
    
    console.log('✅ Database connection successful!')
    console.log(`📊 Sample query returned ${data?.length || 0} rows`)
    return true
  } catch (e: any) {
    console.error('❌ Database connection test exception:', e)
    console.error('Exception details:', {
      message: e?.message,
      stack: e?.stack
    })
    return false
  }
}
