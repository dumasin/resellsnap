import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

function verifyStripeSignature(payload, sigHeader, secret) {
  const parts = sigHeader.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=')
    acc[k] = v
    return acc
  }, {})

  const timestamp = parts['t']
  const signature = parts['v1']

  if (!timestamp || !signature) return false

  const signedPayload = `${timestamp}.${payload}`
  const expected = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex')

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

function supabaseHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  }
}

const BASE = () => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`

async function upsertProfile({ userId, isPro, customerId, subscriptionId }) {
  // Try update first
  const updateRes = await fetch(
    `${BASE()}/profiles?user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      headers: { ...supabaseHeaders(), 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        is_pro: isPro,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      }),
    }
  )

  // If no rows updated (204 but 0 rows), insert
  const count = updateRes.headers.get('content-range')
  if (count === '*/0' || count === null) {
    const insertRes = await fetch(`${BASE()}/profiles`, {
      method: 'POST',
      headers: { ...supabaseHeaders(), 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        user_id: userId,
        is_pro: isPro,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      }),
    })
    const text = await insertRes.text()
    return { status: insertRes.status, body: text, op: 'insert' }
  }

  return { status: updateRes.status, op: 'update' }
}

export async function POST(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret.' }, { status: 400 })
  }

  if (!verifyStripeSignature(body, sig, process.env.STRIPE_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Webhook signature invalid.' }, { status: 400 })
  }

  let event
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const debug = { eventType: event.type }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.userId
    debug.userId = userId

    if (userId) {
      const result = await upsertProfile({
        userId,
        isPro: true,
        customerId: session.customer,
        subscriptionId: session.subscription,
      })
      debug.result = result
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    const res = await fetch(
      `${BASE()}/profiles?stripe_subscription_id=eq.${encodeURIComponent(sub.id)}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders(), 'Prefer': 'return=minimal' },
        body: JSON.stringify({ is_pro: false }),
      }
    )
    debug.result = { status: res.status }
  }

  return NextResponse.json({ received: true, debug })
}
