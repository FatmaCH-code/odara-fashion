// Supabase Edge Function: stripe-webhook
//
// Stripe calls this when a payment succeeds / the checkout expires. It verifies the call
// really came from Stripe, marks the order as paid (the admin dashboard reads that from the
// database), then emails a confirmation to the customer AND to you.
//
// Deploy:  supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
//          RESEND_API_KEY   (resend.com — for the emails)
//          ADMIN_EMAIL      (where YOU receive "new paid order" emails)
//          EMAIL_FROM       (e.g. "Odara Fashion <orders@yourdomain.com>")
//
// NOTE on email: until you verify your own domain in Resend, Resend only lets you send to
// the email address you signed up with. So the "new paid order" email to YOU works straight
// away, but emails to customers need a verified domain + EMAIL_FROM. Meanwhile, switch on
// Stripe's own receipts (Stripe Dashboard → Settings → Customer emails) — those reach customers
// with no extra setup.

import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14'

const esc = (v: unknown): string =>
  String(v ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c])

// Names for the custom-blend recipe (keep in sync with src/data/blendOptions.js)
const BLEND_NAMES: Record<string, Record<string, string>> = {
  base: { '1': 'Oud Pure', '2': 'Sandalwood', '3': 'Amber Musk', '4': 'Floral Blend' },
  topNote: { '101': 'Lemon', '102': 'Bergamot', '103': 'Grapefruit', '104': 'Lavender' },
  middleNote: { '201': 'Rose', '202': 'Jasmine', '203': 'Iris', '204': 'Peach' },
  baseNote: { '301': 'Vanilla', '302': 'Musk', '303': 'Cedar', '304': 'Patchouli' },
}

interface OrderItem {
  name: string
  price: number | string
  quantity: number | string
  blend?: Record<string, string | number | null>
}

interface OrderRow {
  customer_name: string
  customer_email: string
  customer_phone: string | null
  shipping_address: string
  order_number: string
  total_amount: number | string
  discount_code: string | null
  discount_amount: number | string | null
  shipping_amount: number | string | null
  items: OrderItem[]
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key || !to) {
    console.warn('Email skipped (missing RESEND_API_KEY or recipient)')
    return
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: Deno.env.get('EMAIL_FROM') || 'Odara Fashion <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    })
    if (!res.ok) console.error('Resend error', to, res.status, await res.text())
  } catch (err) {
    console.error('Email failed', to, err instanceof Error ? err.message : err)
  }
}

function blendRecipe(item: OrderItem): string {
  if (!item.blend) return ''
  const parts = Object.entries(BLEND_NAMES)
    .map(([slot, names]) => {
      const id = item.blend?.[slot]
      return id != null && names[String(id)] ? `${slot === 'base' ? 'Base oil' : slot.replace('Note', ' note')}: ${names[String(id)]}` : ''
    })
    .filter(Boolean)
  return parts.length ? `<br><span style="color:#777;font-size:12px">${esc(parts.join(' · '))}</span>` : ''
}

function orderTable(order: OrderRow): string {
  const rows = (order.items || [])
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${esc(i.name)} × ${esc(i.quantity)}${blendRecipe(i)}</td><td style="padding:6px 0;text-align:right;vertical-align:top">$${(Number(i.price) * Number(i.quantity)).toFixed(2)}</td></tr>`,
    )
    .join('')
  const discount =
    order.discount_code && Number(order.discount_amount) > 0
      ? `<tr><td style="padding:6px 0;color:#777">Discount (${esc(order.discount_code)})</td><td style="padding:6px 0;text-align:right;color:#777">−$${Number(order.discount_amount).toFixed(2)}</td></tr>`
      : ''
  const shipping = Number(order.shipping_amount) > 0
    ? `<tr><td style="padding:6px 0;color:#777">Shipping</td><td style="padding:6px 0;text-align:right;color:#777">$${Number(order.shipping_amount).toFixed(2)}</td></tr>`
    : ''
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}${discount}${shipping}
    <tr><td style="padding-top:10px;border-top:1px solid #e8d9c4"><b>Total paid</b></td>
    <td style="padding-top:10px;border-top:1px solid #e8d9c4;text-align:right"><b>$${Number(order.total_amount).toFixed(2)}</b></td></tr></table>`
}

const customerEmail = (order: OrderRow): string => `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#2c2c2c">
    <h2 style="font-family:Georgia,serif">Thank you, ${esc(order.customer_name)}!</h2>
    <p>We've received your payment for order <b>${esc(order.order_number)}</b>.</p>
    ${orderTable(order)}
    <p style="margin-top:20px"><b>Shipping to:</b><br>${esc(order.shipping_address)}</p>
    <p style="color:#777;font-size:13px">We'll contact you when your order ships. — Odara Fashion</p></div>`

const adminEmail = (order: OrderRow): string => `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#2c2c2c">
    <h2>New paid order ${esc(order.order_number)}</h2>
    <p><b>${esc(order.customer_name)}</b><br>${esc(order.customer_email)}<br>${esc(order.customer_phone)}</p>
    ${orderTable(order)}
    <p style="margin-top:20px"><b>Ship to:</b><br>${esc(order.shipping_address)}</p>
    <p style="color:#777;font-size:13px">Open the admin dashboard → Orders to process it.</p></div>`

Deno.serve(async (req: Request) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceKey) {
    console.error('Webhook not configured: missing STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / Supabase env')
    return new Response('Webhook not configured', { status: 500 })
  }
  if (!signature) return new Response('Missing Stripe-Signature header', { status: 400 })

  const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Webhook signature verification failed:', message)
    return new Response(`Webhook Error: ${message}`, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id

    if (orderId && session.payment_status === 'paid') {
      const paymentIntent =
        typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null

      // Only rows that were NOT already paid come back — so if Stripe retries this
      // webhook, the emails are not sent twice.
      const { data: updated, error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing',
          stripe_payment_intent: paymentIntent,
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .neq('payment_status', 'paid')
        .select()

      if (error) {
        console.error('Order update failed', error)
        return new Response('DB error', { status: 500 }) // Stripe will retry
      }

      const order = (updated?.[0] ?? null) as OrderRow | null
      if (order) {
        await Promise.all([
          sendEmail(order.customer_email, `Payment confirmed — order ${order.order_number}`, customerEmail(order)),
          sendEmail(
            Deno.env.get('ADMIN_EMAIL') || '',
            `New paid order ${order.order_number} ($${Number(order.total_amount).toFixed(2)})`,
            adminEmail(order),
          ),
        ])
      }
    }
  }

  if (event.type === 'checkout.session.expired') {
    const orderId = (event.data.object as Stripe.Checkout.Session).metadata?.order_id
    if (orderId) {
      await supabase.from('orders').update({ payment_status: 'failed' }).eq('id', orderId).neq('payment_status', 'paid')
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
})
