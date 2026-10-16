import { supabase, isSupabaseConfigured } from '../lib/supabase'

// What the site uses until (or unless) the admin saves their own in Admin → Offers.
export const DEFAULT_SETTINGS = {
  announcement: { enabled: true, text: 'Enjoy 10% off your first order — join our list' },
  welcomeOffer: { enabled: true, percent: 10, code: 'WELCOME10', delaySeconds: 6 },
}

const merge = (v) => ({
  announcement: { ...DEFAULT_SETTINGS.announcement, ...((v && v.announcement) || {}) },
  welcomeOffer: { ...DEFAULT_SETTINGS.welcomeOffer, ...((v && v.welcomeOffer) || {}) },
})

let cached = null

// Never throws and never hangs: any problem just means "use the defaults".
export function loadSiteSettings(force = false) {
  if (!force && cached) return cached
  cached = (async () => {
    if (!isSupabaseConfigured) return merge(null)
    try {
      const request = supabase.from('site_settings').select('value').eq('key', 'storefront').maybeSingle()
      const timeout = new Promise(resolve => setTimeout(() => resolve({ data: null, error: true }), 3000))
      const { data, error } = await Promise.race([request, timeout])
      return error || !data ? merge(null) : merge(data.value)
    } catch {
      return merge(null)
    }
  })()
  return cached
}

export async function adminSaveSiteSettings(settings) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet — see SETUP.md.')
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: 'storefront', value: settings, updated_at: new Date().toISOString() })
  if (error) throw error
  cached = null
}
