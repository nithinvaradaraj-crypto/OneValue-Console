import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Auth helpers
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        hd: 'oneorigin.us', // Restrict to domain
        prompt: 'select_account',
      },
    },
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

export async function checkAllowlist(email: string): Promise<{allowed: boolean, role: string | null}> {
  const { data, error } = await supabase
    .from('user_allowlist')
    .select('role, is_active')
    .eq('email', email)
    .single()

  if (error || !data) {
    return { allowed: false, role: null }
  }

  const record = data as { role: string; is_active: boolean }

  if (!record.is_active) {
    return { allowed: false, role: null }
  }

  return { allowed: true, role: record.role }
}
