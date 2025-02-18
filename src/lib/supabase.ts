import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Please connect your Supabase project using the "Connect to Supabase" button.'
  )
}

// Create a single Supabase client instance using fallback empty strings to prevent URL construction errors.
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

// Add error handling for auth state changes
supabase.auth.onAuthStateChange((event, _session) => {
  try {
    if (event === 'SIGNED_OUT') {
      // Clear any cached auth token on sign-out
      localStorage.removeItem('supabase.auth.token')
    }
  } catch (error) {
    console.error('Auth state change error:', error)
  }
})
