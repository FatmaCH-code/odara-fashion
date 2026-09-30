// One API for the whole app. Two interchangeable backends:
//   • "supabase" — real PostgreSQL database (used when VITE_SUPABASE_* env vars are valid)
//   • "local"    — demo mode stored in this browser only (used until the database is connected)
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { seedProducts } from '../data/seedProducts'
import { SHIPPING_FEE } from '../config'
import { compressImage, isSale } from '../lib/utils'

export const backendMode = isSupabaseConfigured ? 'supabase' : 'local'
export const DEMO_ADMIN = { email: 'admin@odara.com', password: 'odara123' }

// ---------- mapping between Postgres rows and app objects ----------
const decorate = (p) => ({ ...p, image: p.images?.[0] || '', isSale: isSale(p) })

const productFromRow = (r) => decorate({
  id: r.id, name: r.name, section: r.section, category: r.category,
  price: Number(r.price), originalPrice: r.original_price == null ? null : Number(r.original_price),
  description: r.description || '', images: r.images || [], colors: r.colors || [],
  isNew: !!r.is_new, stock: r.stock ?? 0, active: !!r.active, createdAt: r.created_at,
})

const productToRow = (p) => ({
  name: p.name.trim(), section: p.section, category: p.category.trim(),
  price: Number(p.price), original_price: p.originalPrice ? Number(p.originalPrice) : null,
  description: p.description || '', images: p.images || [], colors: p.colors || [],
  is_new: !!p.isNew, stock: parseInt(p.stock, 10) || 0, active: p.active !== false,
})

const orderFromRow = (r) => ({
  id: r.id, customerName: r.customer_name, email: r.email, phone: r.phone || '',
  address: r.address, city: r.city, postalCode: r.postal_code || '',
  items: (r.items || []).map((i) => ({ productId: i.product_id, name: i.name, category: i.category, price: Number(i.price), quantity: i.quantity, image: i.image, color: i.color || '' })),
  subtotal: Number(r.subtotal), shipping: Number(r.shipping), total: Number(r.total),
  status: r.status, createdAt: r.created_at, sample: !!r.sample,
})

const fail = (error, fallback = 'Something went wrong') => { throw new Error(error?.message || fallback) }

// ---------- local demo storage ----------
const LS = { products: 'odara-local-products', orders: 'odara-local-orders', admin: 'odara-local-admin' }
const readLS = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const writeLS = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)) }
  catch { throw new Error('Browser storage is full — remove a large photo or click "Reset demo data".') }
}

function localProducts() {
  let list = readLS(LS.products, null)
  if (!list) { list = seedProducts; writeLS(LS.products, list) }
  return list
}

// deterministic sample orders so the dashboard has something to show in demo mode
function localOrders() {
  let list = readLS(LS.orders, null)
  if (list) return list
  let s = 20260927
  const rnd = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const names = ['Sara Ahmed', 'Layla Hassan', 'Mariam Khalil', 'Nour Saleh', 'Huda Farouk', 'Amal Nasser', 'Rania Youssef', 'Dina Mansour', 'Salma Idris', 'Yasmin Aziz']
  const cities = ['Columbus', 'Dublin', 'Westerville', 'Cleveland', 'Cincinnati', 'Dayton']
  const pool = seedProducts.filter((p) => p.section === 'fashion' || rnd() > 0.5)
  const statuses = ['delivered', 'delivered', 'delivered', 'shipped', 'confirmed', 'pending', 'cancelled']
  list = Array.from({ length: 38 }, (_, i) => {
    const n = 1 + Math.floor(rnd() * 3)
    const items = Array.from({ length: n }, () => {
      const p = pool[Math.floor(rnd() * pool.length)]
      return { productId: p.id, name: p.name, category: p.category, price: p.price, quantity: 1 + Math.floor(rnd() * 2), image: p.images[0] }
    })
    const subtotal = items.reduce((t, x) => t + x.price * x.quantity, 0)
    const daysAgo = Math.floor(Math.pow(rnd(), 1.4) * 30)
    const nm = names[Math.floor(rnd() * names.length)]
    return {
      id: 1000 + i, customerName: nm, email: nm.toLowerCase().replace(' ', '.') + '@example.com', phone: '(614) 555-01' + String(10 + i),
      address: `${100 + Math.floor(rnd() * 900)} Sample St`, city: cities[Math.floor(rnd() * cities.length)], postalCode: '432' + String(10 + Math.floor(rnd() * 80)),
      items, subtotal, shipping: SHIPPING_FEE, total: subtotal + SHIPPING_FEE,
      status: daysAgo < 2 ? 'pending' : statuses[Math.floor(rnd() * statuses.length)],
      createdAt: new Date(Date.now() - daysAgo * 864e5 - Math.floor(rnd() * 864e5)).toISOString(), sample: true,
    }
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  writeLS(LS.orders, list)
  return list
}

// =====================================================================
//  PRODUCTS
// =====================================================================
export async function listProducts() {
  if (backendMode === 'supabase') {
    const { data, error } = await supabase.from('products').select('*').order('id')
    if (error) fail(error, 'Could not load products')
    return data.map(productFromRow)
  }
  return localProducts().map(decorate)
}

export async function createProduct(p) {
  if (backendMode === 'supabase') {
    const { data, error } = await supabase.from('products').insert(productToRow(p)).select().single()
    if (error) fail(error, 'Could not add the product (are you logged in as a manager?)')
    return productFromRow(data)
  }
  const list = localProducts()
  const id = Math.max(300, ...list.map((x) => x.id)) + 1
  const row = { ...p, id, name: p.name.trim(), category: p.category.trim(), price: Number(p.price), originalPrice: p.originalPrice ? Number(p.originalPrice) : null, stock: parseInt(p.stock, 10) || 0 }
  writeLS(LS.products, [...list, row])
  return decorate(row)
}

export async function updateProduct(id, p) {
  if (backendMode === 'supabase') {
    const { data, error } = await supabase.from('products').update(productToRow(p)).eq('id', id).select().single()
    if (error) fail(error, 'Could not save (are you logged in as a manager?)')
    return productFromRow(data)
  }
  const list = localProducts()
  const row = { ...p, id, name: p.name.trim(), category: p.category.trim(), price: Number(p.price), originalPrice: p.originalPrice ? Number(p.originalPrice) : null, stock: parseInt(p.stock, 10) || 0 }
  writeLS(LS.products, list.map((x) => (x.id === id ? row : x)))
  return decorate(row)
}

export async function deleteProduct(id) {
  if (backendMode === 'supabase') {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) fail(error, 'Could not delete')
    return
  }
  writeLS(LS.products, localProducts().filter((x) => x.id !== id))
}

export async function uploadProductImage(file) {
  const blob = await compressImage(file)
  if (backendMode === 'supabase') {
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
    const { error } = await supabase.storage.from('product-images').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
    if (error) fail(error, 'Upload failed — did you run sql/setup.sql (storage bucket)?')
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
  }
  return new Promise((resolve, reject) => { // demo mode: keep as a small data-URL
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(new Error('Could not read file'))
    r.readAsDataURL(blob)
  })
}

// =====================================================================
//  ORDERS
// =====================================================================
export async function placeOrder({ customer, items }) {
  const payload = items.map((i) => ({ id: i.id, quantity: i.quantity, color: i.color || '' }))
  if (backendMode === 'supabase') {
    const { data, error } = await supabase.rpc('place_order', {
      p_name: customer.name, p_email: customer.email, p_phone: customer.phone || '',
      p_address: customer.address, p_city: customer.city, p_postal: customer.postal || '', p_items: payload,
    })
    if (error) fail(error, 'Could not place your order')
    return { id: data }
  }
  const products = localProducts()
  const lines = payload.map((i) => {
    const p = products.find((x) => x.id === i.id && x.active !== false)
    if (!p || p.stock < i.quantity) throw new Error('Sorry, an item in your cart is out of stock or no longer available')
    return { productId: p.id, name: p.name, category: p.category, price: p.price, quantity: i.quantity, image: p.images?.[0], color: i.color || '' }
  })
  const subtotal = lines.reduce((t, x) => t + x.price * x.quantity, 0)
  const orders = localOrders()
  const id = Math.max(1000, ...orders.map((o) => o.id)) + 1
  const order = {
    id, customerName: customer.name, email: customer.email, phone: customer.phone || '', address: customer.address,
    city: customer.city, postalCode: customer.postal || '', items: lines, subtotal, shipping: SHIPPING_FEE,
    total: subtotal + SHIPPING_FEE, status: 'pending', createdAt: new Date().toISOString(),
  }
  writeLS(LS.orders, [order, ...orders])
  writeLS(LS.products, products.map((p) => { const used = lines.filter((x) => x.productId === p.id).reduce((n, x) => n + x.quantity, 0); return used ? { ...p, stock: p.stock - used } : p }))
  return { id }
}

export async function listOrders() {
  if (backendMode === 'supabase') {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(1000)
    if (error) fail(error, 'Could not load orders')
    return data.map(orderFromRow)
  }
  return localOrders()
}

export async function updateOrderStatus(id, status) {
  if (backendMode === 'supabase') {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) fail(error, 'Could not update the order')
    return
  }
  writeLS(LS.orders, localOrders().map((o) => (o.id === id ? { ...o, status } : o)))
}

// =====================================================================
//  MANAGER AUTH
// =====================================================================
export async function getAdmin() {
  if (backendMode === 'supabase') {
    const { data } = await supabase.auth.getSession()
    const email = data.session?.user?.email
    if (!email) return null
    const { data: ok } = await supabase.rpc('is_admin')
    return ok ? { email } : null
  }
  return readLS(LS.admin, null)
}

export async function adminSignIn(email, password) {
  if (backendMode === 'supabase') {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw new Error('Wrong email or password')
    const { data: ok } = await supabase.rpc('is_admin')
    if (!ok) { await supabase.auth.signOut(); throw new Error('This account is not authorized as a manager') }
    return { email: data.user.email }
  }
  if (email.trim().toLowerCase() !== DEMO_ADMIN.email || password !== DEMO_ADMIN.password) throw new Error('Wrong email or password')
  const admin = { email: DEMO_ADMIN.email }
  writeLS(LS.admin, admin)
  return admin
}

export async function adminSignOut() {
  if (backendMode === 'supabase') await supabase.auth.signOut()
  else localStorage.removeItem(LS.admin)
}

export function resetDemoData() {
  if (backendMode === 'local') { localStorage.removeItem(LS.products); localStorage.removeItem(LS.orders) }
}
