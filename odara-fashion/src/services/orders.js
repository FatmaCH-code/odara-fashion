import { supabase, isSupabaseConfigured } from '../lib/supabase'

function generateOrderNumber() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `ODR-${Date.now().toString().slice(-6)}${rand}`
}

// Called from checkout. Payment isn't wired up yet, so every order is captured
// with status 'pending' — a manual/COD-style flow the admin can process by hand
// until Stripe (or similar) is connected, at which point this same function's
// return value (the order) is what a payment step would attach to.
export async function createOrder({ name, email, phone, address, items, total }) {
  if (!isSupabaseConfigured) {
    // No backend yet — let checkout continue anyway so the demo flow still works;
    // the order simply won't be recorded anywhere.
    return null
  }
  const { data, error } = await supabase
    .from('orders')
    .insert({
      order_number: generateOrderNumber(),
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      shipping_address: address,
      items,
      total_amount: total,
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function adminListOrders() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet — see SETUP.md.')
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function adminUpdateOrderStatus(id, status) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet — see SETUP.md.')
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) throw error
}
