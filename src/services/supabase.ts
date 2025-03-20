
import { createClient } from '@supabase/supabase-js'

// Use environment variables or public keys for Supabase connection
const supabaseUrl = 'https://your-project-url.supabase.co'
const supabaseAnonKey = 'your-public-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
