import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and service key from environment variables
const supabaseUrl = process.env.DATABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

if (!supabaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set. It should be your Supabase project URL (https://[project-ref].supabase.co)')
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_KEY environment variable is not set. Get it from Supabase Dashboard > Project Settings > API > service_role key')
}

// Validate that DATABASE_URL is a Supabase URL
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
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
