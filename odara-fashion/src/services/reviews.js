import { supabase, isSupabaseConfigured } from '../lib/supabase'

const need = () => { if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet — see SETUP.md.') }

const fromRow = (r) => ({
  id: r.id,
  productId: r.product_id,
  name: r.name,
  rating: r.rating,
  body: r.body,
  status: r.status,
  source: r.source,
  createdAt: r.created_at,
})

// Public: approved reviews only (the database itself refuses to show anything else).
// Never throws/hangs — no reviews just means the review sections stay hidden.
export async function getApprovedReviews() {
  if (!isSupabaseConfigured) return []
  try {
    const request = supabase.from('reviews').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(500)
    const timeout = new Promise(resolve => setTimeout(() => resolve({ data: null, error: true }), 4000))
    const { data, error } = await Promise.race([request, timeout])
    return error || !data ? [] : data.map(fromRow)
  } catch {
    return []
  }
}

// Public: saved as "pending" — it only appears on the site once an admin approves it.
export async function submitReview({ productId, name, rating, body }) {
  need()
  const { error } = await supabase.from('reviews').insert({
    product_id: productId || null,
    name: String(name || '').trim(),
    rating: Number(rating),
    body: String(body || '').trim(),
    status: 'pending',
    source: 'customer',
  })
  if (error) throw new Error(
    error.code === '23514' ? 'Please check your name, rating and review (3–1000 characters).' : error.message
  )
}

// ---- Admin ----
export async function adminListReviews() {
  need()
  const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data.map(fromRow)
}

export async function adminSetReviewStatus(id, status) {
  need()
  const { error } = await supabase.from('reviews').update({ status }).eq('id', id)
  if (error) throw error
}

export async function adminDeleteReview(id) {
  need()
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw error
}

// A real review the owner received elsewhere (WhatsApp, Instagram…) — published straight away.
export async function adminAddReview({ productId, name, rating, body }) {
  need()
  const { error } = await supabase.from('reviews').insert({
    product_id: productId || null,
    name: String(name || '').trim(),
    rating: Number(rating),
    body: String(body || '').trim(),
    status: 'approved',
    source: 'admin',
  })
  if (error) throw error
}
