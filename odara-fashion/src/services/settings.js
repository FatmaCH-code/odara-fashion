import { supabase, isSupabaseConfigured } from '../lib/supabase'

// What the site uses until (or unless) the admin saves their own in Admin → Offers.
export const DEFAULT_SETTINGS = {
  // The bar shows your real offers automatically (free shipping over $X, the welcome discount); `text` is an optional extra message.
  announcement: { enabled: true, text: '' },
  welcomeOffer: { enabled: true, percent: 10, code: 'WELCOME10', delaySeconds: 6 },
  // Flat fee per order; orders at/above `freeOver` ship free (0 = never free). Fee 0 = free shipping for everyone.
  // byZone: price by distance from Ohio (zones[0..4] = Zone 1..5, `international` = outside the US); off = the flat fee for everyone.
  shipping: { flatFee: 10, freeOver: 0, byZone: true, zones: [5.99, 7.99, 9.99, 12.99, 15.99], international: 29.99 },
}

const merge = (v) => ({
  announcement: { ...DEFAULT_SETTINGS.announcement, ...((v && v.announcement) || {}) },
  welcomeOffer: { ...DEFAULT_SETTINGS.welcomeOffer, ...((v && v.welcomeOffer) || {}) },
  shipping: { ...DEFAULT_SETTINGS.shipping, ...((v && v.shipping) || {}) },
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
