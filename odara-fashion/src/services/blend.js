import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { baseOils, topNotes, middleNotes, baseNotes } from '../data/blendOptions'

// What "Create Your Signature Scent" offers until the admin saves their own in Admin → Signature.
// (Must match the default inside sql/signature_builder.sql.)
const withDefaults = (list) => list.map(o => ({ id: String(o.id), name: o.name, price: o.price, image: '', active: true }))

export const DEFAULT_BLEND = {
  bases: withDefaults(baseOils).map(o => ({ ...o, price: 0 })),  // base oils carry no price
  topNotes: withDefaults(topNotes),
  middleNotes: withDefaults(middleNotes),
  baseNotes: withDefaults(baseNotes),
  sizes: [
    { id: 'small', label: '30ml', price: 34.99, active: true },
    { id: 'medium', label: '50ml', price: 44.99, active: true },
    { id: 'large', label: '100ml', price: 54.99, active: true },
  ],
}

const merge = (v) => ({
  bases: (v && Array.isArray(v.bases)) ? v.bases : DEFAULT_BLEND.bases,
  topNotes: (v && Array.isArray(v.topNotes)) ? v.topNotes : DEFAULT_BLEND.topNotes,
  middleNotes: (v && Array.isArray(v.middleNotes)) ? v.middleNotes : DEFAULT_BLEND.middleNotes,
  baseNotes: (v && Array.isArray(v.baseNotes)) ? v.baseNotes : DEFAULT_BLEND.baseNotes,
  sizes: (v && Array.isArray(v.sizes)) ? v.sizes : DEFAULT_BLEND.sizes,
})

let cached = null

// Never throws and never hangs: any problem just means "use the defaults".
export function loadBlendConfig(force = false) {
  if (!force && cached) return cached
  cached = (async () => {
    if (!isSupabaseConfigured) return merge(null)
    try {
      const request = supabase.from('site_settings').select('value').eq('key', 'blend').maybeSingle()
      const timeout = new Promise(resolve => setTimeout(() => resolve({ data: null, error: true }), 3000))
      const { data, error } = await Promise.race([request, timeout])
      return error || !data ? merge(null) : merge(data.value)
    } catch {
      return merge(null)
    }
  })()
  return cached
}

export async function adminSaveBlendConfig(config) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet — see SETUP.md.')
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: 'blend', value: config, updated_at: new Date().toISOString() })
  if (error) throw error
  cached = null
}
