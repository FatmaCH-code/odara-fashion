import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { allProducts as staticAllProducts } from '../data/products'

// Convert a DB row (snake_case) to the shape the rest of the app already uses (camelCase).
function fromRow(row) {
  const images = row.images && row.images.length > 0 ? row.images : (row.image_url ? [row.image_url] : [])
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    category: row.category,
    image: images[0] || row.image_url,
    images,
    colors: row.colors || [],
    sizes: row.sizes || [],
    isNew: row.is_new,
    isSale: row.is_sale,
    stock: row.stock,
  }
}

function toRow(product) {
  const images = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : [])
  return {
    name: product.name,
    description: product.description || '',
    price: product.price,
    original_price: product.originalPrice || null,
    category: product.category,
    image_url: images[0] || '',
    images,
    colors: product.colors || [],
    sizes: product.sizes || [],
    is_new: !!product.isNew,
    is_sale: !!product.isSale,
    stock: product.stock ?? 20,
  }
}

// Used by the public storefront (Home/Shop/Perfumes/ProductPage): returns the
// bundled catalog instantly (so the site always renders, even offline or
// before Supabase is configured), then — if Supabase is configured — fetches
// live data in the background and hands it to `onLive` when it arrives.
export async function getProducts(onLive) {
  if (isSupabaseConfigured && onLive) {
    const { data, error } = await supabase.from('products').select('*').order('id')
    if (!error && data && data.length > 0) {
      onLive(data.map(fromRow))
    }
  }
  return staticAllProducts
}

// ---- Admin CRUD (all require an authenticated admin session; RLS enforces this server-side too) ----

export async function adminListProducts() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet — see SETUP.md.')
  const { data, error } = await supabase.from('products').select('*').order('id')
  if (error) throw error
  return data.map(fromRow)
}

export async function adminCreateProduct(product) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet — see SETUP.md.')
  const { data, error } = await supabase.from('products').insert(toRow(product)).select().single()
  if (error) throw error
  return fromRow(data)
}

export async function adminUpdateProduct(id, product) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet — see SETUP.md.')
  const { data, error } = await supabase.from('products').update(toRow(product)).eq('id', id).select().single()
  if (error) throw error
  return fromRow(data)
}

export async function adminDeleteProduct(id) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet — see SETUP.md.')
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// Uploads a File to the "product-images" storage bucket and returns its public URL.
export async function adminUploadProductImage(file) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet — see SETUP.md.')
  const ext = file.name.split('.').pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('product-images').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

// ---- Team / admin access management ----
// Lets a signed-in admin see every account and grant/revoke admin access to
// others, without ever touching SQL. Only works for accounts that have
// already signed in at least once (so a profiles row exists for them).

export async function adminListProfiles() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet — see SETUP.md.')
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  if (error) throw error
  return data
}

export async function adminSetIsAdmin(id, isAdmin) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet — see SETUP.md.')
  const { error } = await supabase.from('profiles').update({ is_admin: isAdmin }).eq('id', id)
  if (error) throw error
}
