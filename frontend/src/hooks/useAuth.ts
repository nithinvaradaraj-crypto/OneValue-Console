import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  role: string | null
  isLoading: boolean
  isAllowed: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    isLoading: true,
    isAllowed: false,
    error: null,
  })

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        if (!session?.user) {
          setState(prev => ({ ...prev, isLoading: false }))
          return
        }

        const email = session.user.email

        // Check domain
        if (!email?.endsWith('@oneorigin.us')) {
          setState({
            user: session.user,
            session,
            role: null,
            isLoading: false,
            isAllowed: false,
            error: 'Only @oneorigin.us accounts are allowed',
          })
          return
        }

        // Check allowlist
        const { data } = await supabase
          .from('user_allowlist')
          .select('role, is_active')
          .eq('email', email)
          .maybeSingle()

        if (!mounted) return

        const record = data as { role: string; is_active: boolean } | null
        const isAllowed = record?.is_active === true

        setState({
          user: session.user,
          session,
          role: record?.role || null,
          isLoading: false,
          isAllowed,
          error: isAllowed ? null : 'You are not on the access list.',
        })
      } catch (err) {
        if (mounted) {
          setState(prev => ({ ...prev, isLoading: false, error: 'Auth check failed' }))
        }
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, _session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setState(prev => ({ ...prev, isLoading: true }))
          init()
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            session: null,
            role: null,
            isLoading: false,
            isAllowed: false,
            error: null,
          })
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return state
}
