// Supabase Edge Function: create-checkout-session
//
// Called by the storefront's checkout page. It:
//   1. creates the order through the database's own create_order() function — which
//      prices every item from the products table (the browser's prices are ignored) and
//      applies/validates any discount code;
//   2. asks Stripe for a Checkout Session for EXACTLY that order's amount;
//   3. returns the Stripe URL for the browser to redirect to.
// The Stripe SECRET key lives only here, as a Supabase secret — never in the website.
//
// Deploy:  supabase functions deploy create-checkout-session
// Secrets: STRIPE_SECRET_KEY, SITE_URL   (see SETUP.md → "Accepting real payments")

import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

interface OrderItem {
  name: string
  price: number
  quantity: number
}


interface Line {
  name: string
  unit: number // cents per item
  qty: number
}

// Spreads a discount (in cents) across the item lines in proportion to their value, so the
// prices Stripe shows already include it — to the exact cent. Needs no extra Stripe permission
// (no coupons are created). When a line's new total doesn't divide evenly by its quantity it is
// split in two lines that differ by one cent.
function applyDiscount(lines: Line[], discountCents: number): Line[] {
  const totals = lines.map((l) => l.unit * l.qty)
  const sum = totals.reduce((a, b) => a + b, 0)
  if (discountCents <= 0 || sum <= 0) return lines

  const shares = totals.map((t) => Math.floor((discountCents * t) / sum))
  let left = discountCents - shares.reduce((a, b) => a + b, 0)
  const byRemainder = totals
    .map((t, i) => ({ i, rem: (discountCents * t) % sum }))
    .sort((a, b) => b.rem - a.rem || a.i - b.i)
  for (let k = 0; left > 0; k = (k + 1) % byRemainder.length) {
    shares[byRemainder[k].i]++
    left--
  }

  const out: Line[] = []
  lines.forEach((l, i) => {
    const t = totals[i] - shares[i]
    const lo = Math.floor(t / l.qty)
    const r = t % l.qty
    if (r === 0) out.push({ name: l.name, unit: lo, qty: l.qty })
    else {
      out.push({ name: l.name, unit: lo, qty: l.qty - r })
      out.push({ name: l.name, unit: lo + 1, qty: r })
    }
  })
  return out.filter((l) => l.qty > 0 && l.unit > 0)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!stripeKey || !supabaseUrl || !serviceKey) {
    console.error('Missing STRIPE_SECRET_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
    return json({ error: 'Online payment is not set up yet. Please try again later.' }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  let orderId: number | null = null

  try {
    const { name, email, phone, address, items, promoCode } = await req.json()

    if (!Array.isArray(items) || items.length === 0) return json({ error: 'Your cart is empty.' }, 400)

    // 1) Create the order. All pricing + discount rules live in the database function.
    const { data: orderNumber, error: orderError } = await supabase.rpc('create_order', {
      p_name: name,
      p_email: email,
      p_phone: phone || '',
      p_address: address,
      p_items: items,
      p_promo_code: promoCode ? String(promoCode) : null,
    })
    if (orderError) return json({ error: orderError.message }, 400) // e.g. "Only 2 of … left in stock."

    const { data: order, error: loadError } = await supabase
      .from('orders')
      .select('id, order_number, items, total_amount, discount_amount, discount_code, shipping_amount, customer_email')
      .eq('order_number', orderNumber)
      .single()
    if (loadError || !order) throw new Error('Could not load the new order.')
    orderId = order.id

    // 2) Stripe line items come from the SERVER-priced order, in whole cents.
    const orderItems = order.items as OrderItem[]
    const discountCents = Math.round(Number(order.discount_amount || 0) * 100)
    const shippingCents = Math.round(Number(order.shipping_amount || 0) * 100)
    const itemLines: Line[] = orderItems.map((item) => ({
      name: String(item.name).slice(0, 250),
      unit: Math.round(Number(item.price) * 100),
      qty: Number(item.quantity),
    }))
    const itemsCents = itemLines.reduce((sum, l) => sum + l.unit * l.qty, 0)

    // The discount is built into the prices Stripe charges (see applyDiscount); shipping is its own line.
    const discountNote = discountCents > 0 ? `${order.discount_code || 'Discount'} applied` : undefined
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = applyDiscount(itemLines, discountCents).map((l) => ({
      price_data: {
        currency: 'usd',
        product_data: discountNote ? { name: l.name, description: discountNote } : { name: l.name },
        unit_amount: l.unit,
      },
      quantity: l.qty,
    }))
    if (shippingCents > 0) {
      lineItems.push({
        price_data: { currency: 'usd', product_data: { name: 'Shipping' }, unit_amount: shippingCents },
        quantity: 1,
      })
    }

    // Safety net: what Stripe will charge must equal what the order says, to the cent.
    const stripeCents = lineItems.reduce((sum, l) => sum + (l.price_data?.unit_amount ?? 0) * (l.quantity ?? 0), 0)
    const orderCents = Math.round(Number(order.total_amount) * 100)
    if (stripeCents !== orderCents || itemsCents + shippingCents - discountCents !== orderCents) {
      throw new Error('Order total mismatch — payment not started.')
    }

    const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() })

    // Where to send the customer back to: the SITE_URL secret, else the site they came from.
    const siteUrl = (Deno.env.get('SITE_URL') || req.headers.get('origin') || 'http://localhost:5173').replace(/\/+$/, '')

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'], // cards + Apple Pay + Google Pay
      customer_email: String(email).trim(),
      client_reference_id: order.order_number,
      line_items: lineItems,
      metadata: { order_id: String(order.id), order_number: order.order_number },
      payment_intent_data: {
        description: `Odara order ${order.order_number}`,
        metadata: { order_number: order.order_number },
      },
      success_url: `${siteUrl}/order-success?order=${order.order_number}`,
      cancel_url: `${siteUrl}/checkout`,
      // Abandoned checkouts are marked "failed" ~35 minutes later (Stripe's minimum is 30).
      expires_at: Math.floor(Date.now() / 1000) + 35 * 60,
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    await supabase.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id)

    return json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('create-checkout-session failed:', message)
    // Don't leave a dead "unpaid" order lying around if Stripe never got the request.
    if (orderId !== null) {
      await supabase.from('orders').update({ payment_status: 'failed' }).eq('id', orderId)
    }
    return json({ error: 'We could not start the payment. Please try again in a moment.' }, 500)
  }
})
