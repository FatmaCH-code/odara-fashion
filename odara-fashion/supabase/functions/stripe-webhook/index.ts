// Supabase Edge Function: stripe-webhook
// Stripe calls this when a payment succeeds / expires. It verifies the call
// really came from Stripe, marks the order as paid (the admin dashboard reads
// that from the database), then emails a confirmation to the customer AND
// to the admin.
//
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets needed:
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
//   RESEND_API_KEY   (resend.com)
//   ADMIN_EMAIL      (where YOU receive "new paid order" emails)
//   EMAIL_FROM       (optional, e.g. "Odara Fashion <orders@yourdomain.com>")

import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14'

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

async function sendEmail(to: string, subject: string, html: string) {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key || !to) { console.warn('Email skipped (missing RESEND_API_KEY or recipient)'); return }
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
}

function orderTable(order: any) {
  const rows = (order.items || []).map((i: any) =>
    `<tr><td style="padding:6px 0">${esc(i.name)} × ${esc(i.quantity)}</td><td style="padding:6px 0;text-align:right">$${(Number(i.price) * Number(i.quantity)).toFixed(2)}</td></tr>`
  ).join('')
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
    <tr><td style="padding-top:10px;border-top:1px solid #e8d9c4"><b>Total paid</b></td>
    <td style="padding-top:10px;border-top:1px solid #e8d9c4;text-align:right"><b>$${Number(order.total_amount).toFixed(2)}</b></td></tr></table>`
}

function customerEmail(order: any) {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#2c2c2c">
    <h2 style="font-family:Georgia,serif">Thank you, ${esc(order.customer_name)}!</h2>
    <p>We've received your payment for order <b>${esc(order.order_number)}</b>.</p>
    ${orderTable(order)}
    <p style="margin-top:20px"><b>Shipping to:</b><br>${esc(order.shipping_address)}</p>
    <p style="color:#777;font-size:13px">We'll contact you when your order ships. — Odara Fashion</p></div>`
}

function adminEmail(order: any) {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#2c2c2c">
    <h2>New paid order ${esc(order.order_number)}</h2>
    <p><b>${esc(order.customer_name)}</b><br>${esc(order.customer_email)}<br>${esc(order.customer_phone)}</p>
    ${orderTable(order)}
    <p style="margin-top:20px"><b>Ship to:</b><br>${esc(order.shipping_address)}</p>
    <p style="color:#777;font-size:13px">Open the admin dashboard → Orders to process it.</p></div>`
}

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  })

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
  } catch (err) {
    console.error('Webhook signature verification failed:', (err as Error).message)
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 })
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id

    if (orderId && session.payment_status === 'paid') {
      // Only rows that were NOT already paid come back — so if Stripe retries
      // the webhook, emails are not sent twice.
      const { data: updated, error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing',
          stripe_payment_intent: session.payment_intent as string,
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .neq('payment_status', 'paid')
        .select()

      if (error) {
        console.error('Order update failed', error)
        return new Response('DB error', { status: 500 }) // Stripe will retry
      }

      const order = updated?.[0]
      if (order) {
        await Promise.all([
          sendEmail(order.customer_email, `Payment confirmed — order ${order.order_number}`, customerEmail(order)),
          sendEmail(Deno.env.get('ADMIN_EMAIL') || '', `New paid order ${order.order_number} ($${Number(order.total_amount).toFixed(2)})`, adminEmail(order)),
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
