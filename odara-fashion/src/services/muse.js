import { supabase, isSupabaseConfigured } from '../lib/supabase'

const SELECT = 'id, image_url, tag, sort_order, is_active, product_id, product:products(id, name, price, original_price, category)'

function fromRow(r) {
  const p = r.product
  return {
    id: r.id,
    image: r.image_url,
    tag: r.tag || '',
    sortOrder: r.sort_order ?? 0,
    isActive: r.is_active,
    productId: r.product_id,
    product: p ? {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      originalPrice: p.original_price != null ? Number(p.original_price) : undefined,
      category: p.category,
    } : null,
  }
}

// Public storefront: active entries only, in the admin's chosen order.
// Returns null when Supabase isn't set up (or the table doesn't exist yet) so
// the site quietly falls back to showing the newest products instead.
export async function getMuseItems() {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('muse_items')
    .select(SELECT)
    .eq('is_active', true)
    .order('sort_order')
    .order('id')
  if (error) return null
  return data.map(fromRow).filter(i => i.product)
}

// ---- Admin (RLS makes these admin-only on the server too) ----
const needDb = () => {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet — see SETUP.md.')
}

export async function adminListMuse() {
  needDb()
  const { data, error } = await supabase.from('muse_items').select(SELECT).order('sort_order').order('id')
  if (error) throw error
  return data.map(fromRow)
}

export async function adminSaveMuse(form, id) {
  needDb()
  const payload = {
    product_id: form.productId,
    image_url: form.image,
    tag: form.tag || null,
    is_active: form.isActive !== false,
  }
  if (id) {
    const { error } = await supabase.from('muse_items').update(payload).eq('id', id)
    if (error) throw error
    return
  }
  const { data: last } = await supabase.from('muse_items').select('sort_order').order('sort_order', { ascending: false }).limit(1)
  const next = ((last && last[0] && last[0].sort_order) || 0) + 1
  const { error } = await supabase.from('muse_items').insert({ ...payload, sort_order: next })
  if (error) throw error
}

export async function adminDeleteMuse(id) {
  needDb()
  const { error } = await supabase.from('muse_items').delete().eq('id', id)
  if (error) throw error
}

// Re-numbers every entry 1..n in the given order (so moving up/down always works).
export async function adminReorderMuse(orderedIds) {
  needDb()
  const results = await Promise.all(
    orderedIds.map((id, i) => supabase.from('muse_items').update({ sort_order: i + 1 }).eq('id', id))
  )
  const failed = results.find(r => r.error)
  if (failed) throw failed.error
}
