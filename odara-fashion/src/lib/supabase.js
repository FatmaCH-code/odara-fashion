import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// A real Supabase anon key is a long JWT (three dot-separated base64 segments).
// The placeholder that ships in .env.local before setup is short and ends in
// "...", so this check safely tells the rest of the app "DB not ready yet"
// instead of trying (and failing) to talk to a fake endpoint.
export const isSupabaseConfigured = Boolean(
  url &&
  anonKey &&
  anonKey.split('.').length === 3 &&
  anonKey.length > 100
)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
