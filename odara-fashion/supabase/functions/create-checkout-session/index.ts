// Supabase Edge Function: create-checkout-session
// Called by the storefront's checkout page. Creates the order row (unpaid)
// and a Stripe Checkout Session, and returns the URL to redirect the
// customer to. The Stripe SECRET key lives only here, as a Supabase secret —
// it is never sent to the browser.
//
// Deploy: supabase functions deploy create-checkout-session
// Requires these secrets to be set first (see SETUP.md):
//   supabase secrets set STRIPE_SECRET_KEY=sk_...
//   supabase secrets set SITE_URL=https://yoursite.com

import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, phone, address, items, promoCode } = await req.json()

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Service role client — bypasses RLS, only ever runs server-side here.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    const orderNumber = `ODR-${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 7).toUpperCase()}`

    // Totals are calculated here from the items — never trusted from the browser.
    const subtotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0)

    // Optional discount code (e.g. the welcome popup's 10%). Validated by the same
    // database function the checkout page uses, so the rules live in one place.
    let discount: { code: string; percent: number } | null = null
    if (promoCode && String(promoCode).trim()) {
      const { data: promo, error: promoError } = await supabase.rpc('validate_promo', {
        p_code: promoCode,
        p_email: email,
      })
      if (promoError) throw promoError
      if (!promo?.valid) {
        return new Response(JSON.stringify({ error: promo?.message || 'That discount code is not valid.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      discount = { code: promo.code, percent: Number(promo.percent) }
    }
    const discountAmount = discount ? Math.round(subtotal * discount.percent) / 100 : 0

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        shipping_address: address,
        items,
        total_amount: Math.round((subtotal - discountAmount) * 100) / 100,
        status: 'pending',
        payment_status: 'unpaid',
        discount_code: discount ? discount.code : null,
        discount_amount: discountAmount,
      })
      .select()
      .single()

    if (orderError) throw orderError

    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'

    const sessionParams: Record<string, unknown> = {
      mode: 'payment',
      // No payment_method_types: Stripe shows the methods the owner turned on in
      // Dashboard > Settings > Payment methods (cards, Apple Pay, Google Pay, PayPal...).
      customer_email: email,
      line_items: items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      metadata: { order_id: order.id, order_number: orderNumber },
      success_url: `${siteUrl}/order-success?order=${orderNumber}`,
      cancel_url: `${siteUrl}/checkout`,
      // Stripe can auto-email a receipt on success if enabled in
      // Dashboard → Settings → Customer emails → "Successful payments".
    }

    if (discount) {
      const coupon = await stripe.coupons.create({
        percent_off: discount.percent,
        duration: 'once',
        name: `${discount.code} (${discount.percent}% off)`,
      })
      sessionParams.discounts = [{ coupon: coupon.id }]
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    await supabase.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id)

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})