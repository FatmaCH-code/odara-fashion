import { useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export function useAdminAuth() {
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  // The person whose admin rights we have ALREADY confirmed. Supabase fires a "signed in" event every
  // time the browser tab regains focus (and again whenever the login token refreshes). For the same
  // person there is nothing to re-check — and showing "Loading…" would throw away whatever the admin
  // was in the middle of typing, because the whole dashboard would be replaced by the loading box.
  const verifiedFor = useRef(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function checkProfile(currentSession) {
      if (!currentSession) {
        verifiedFor.current = null
        if (!cancelled) { setIsAdmin(false); setLoading(false) }
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', currentSession.user.id)
        .single()
      if (!cancelled) {
        verifiedFor.current = data?.is_admin ? currentSession.user.id : null
        setIsAdmin(!!data?.is_admin)
        setLoading(false)
      }
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      checkProfile(s)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      const id = s && s.user ? s.user.id : null

      // Signed out (or the login ended): leave straight away.
      if (event === 'SIGNED_OUT' || !s) {
        verifiedFor.current = null
        setSession(null)
        setIsAdmin(false)
        setLoading(false)
        return
      }

      // Same, already-confirmed admin (tab refocus, token refresh): change nothing, re-render nothing.
      if (verifiedFor.current && verifiedFor.current === id) return

      // A different person signed in: confirm they are an admin.
      setSession(s)
      setLoading(true)
      checkProfile(s)
    })

    return () => { cancelled = true; subscription.unsubscribe() }
  }, [])

  return { loading, session, isAdmin, isSupabaseConfigured }
}
