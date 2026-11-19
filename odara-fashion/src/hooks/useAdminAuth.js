import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export function useAdminAuth() {
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function checkProfile(currentSession) {
      if (!currentSession) {
        if (!cancelled) { setIsAdmin(false); setLoading(false) }
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', currentSession.user.id)
        .single()
      if (!cancelled) {
        setIsAdmin(!!data?.is_admin)
        setLoading(false)
      }
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      checkProfile(s)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setLoading(true)
      checkProfile(s)
    })

    return () => { cancelled = true; subscription.unsubscribe() }
  }, [])

  return { loading, session, isAdmin, isSupabaseConfigured }
}
