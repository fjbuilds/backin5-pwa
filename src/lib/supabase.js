import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const SITE_URL = typeof window !== 'undefined'
  ? window.location.origin + window.location.pathname.replace(/\/$/, '') + '/'
  : (import.meta.env.VITE_SITE_URL || 'http://localhost:5173')

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[BackIn5] Missing Supabase env vars. Copy .env.example to .env and fill in values.')
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
