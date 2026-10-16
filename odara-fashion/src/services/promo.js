import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { loadSiteSettings } from './settings'

// Asks the database whether a discount code is valid (and not already used by this email).
// The order itself is re-checked on the server when it's placed, so this is only for showing the saving.
export async function validatePromo(code, email) {
  const c = (code || '').trim()
  if (!c) return { valid: false, message: 'Enter a discount code.' }

  if (isSupabaseConfigured) {
    try {
      const request = supabase.rpc('validate_promo', { p_code: c, p_email: email || null })
      const timeout = new Promise(resolve => setTimeout(() => resolve({ data: null, error: true }), 4000))
      const { data, error } = await Promise.race([request, timeout])
      if (!error && data) return data
    } catch { /* fall through to the local check */ }
  }

  // Database function not installed yet → check against the saved/default settings instead.
  const { welcomeOffer: o } = await loadSiteSettings()
  if (o.enabled && c.toUpperCase() === String(o.code).toUpperCase()) {
    return { valid: true, percent: o.percent, code: String(o.code).toUpperCase() }
  }
  return { valid: false, message: 'That discount code is not valid.' }
}
