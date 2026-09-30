import { supabase, isSupabaseConfigured } from '../lib/supabase'

function generateOrderNumber() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `ODR-${Date.now().toString().slice(-6)}${rand}`
}

// Set VITE_PAYMENTS_ENABLED=true once Stripe + the Edge Functions are
// deployed (see SETUP.md). Until then, checkout falls back to capturing the
// order as "pending" without collecting payment — so the site never breaks.
const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED === 'true'

// Called from checkout. When payments are enabled this creates a Stripe
// Checkout Session (via the create-checkout-session Edge Function) and
// returns a redirect URL. Otherwise it falls back to the old manual-order
// flow: captured as 'pending', no payment collected, you follow up by hand.
export async function createOrder({ name, email, phone, address, items, total }) {
  if (!isSupabaseConfigured) {
    return null
  }

  if (paymentsEnabled) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ name, email, phone, address, items, total }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Could not start checkout.')
    return { redirectUrl: data.url }
  }

  // Goes through the create_order() database function (sql/orders_fix.sql):
  // a plain insert().select() is blocked by row-level security because
  // customers are not allowed to read the orders table back.
  const { data: orderNumber, error } = await supabase.rpc('create_order', {
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_address: address,
    p_items: items,
  })
  if (error) throw error
  return { order_number: orderNumber }
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
