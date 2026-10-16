import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Categories live on each product (products.category). On top of that the admin
// can keep a list of EXTRA categories that don't have any product yet, so a
// category can be created first and filled later. That extra list is stored in
// site_settings under its own key ("categories"), separate from the storefront
// settings, so saving one can never overwrite the other.

const KEY = 'categories'
const need = () => { if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet — see SETUP.md.') }

export async function adminGetExtraCategories() {
  need()
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', KEY).maybeSingle()
  if (error) throw error
  const list = data && data.value && Array.isArray(data.value.list) ? data.value.list : []
  return list.filter(Boolean)
}

export async function adminSaveExtraCategories(list) {
  need()
  const clean = [...new Set(list.map(c => (c || '').trim()).filter(Boolean))]
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: KEY, value: { list: clean }, updated_at: new Date().toISOString() })
  if (error) throw error
  return clean
}

// Renames a category on every product that uses it. Renaming to a name that
// already exists simply merges the two categories.
export async function adminRenameCategory(oldName, newName) {
  need()
  const { error } = await supabase.from('products').update({ category: newName.trim() }).eq('category', oldName)
  if (error) throw error
}

export async function adminMoveProductCategory(productId, category) {
  need()
  const { error } = await supabase.from('products').update({ category }).eq('id', productId)
  if (error) throw error
}
