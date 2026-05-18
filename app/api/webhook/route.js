import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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

export async function POST(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret.' }, { status: 400 })
  }

  if (!verifyStripeSignature(body, sig, process.env.STRIPE_WEBHOOK_SECRET)) {
    console.error('[/api/webhook] Signature verification failed')
    return NextResponse.json({ error: 'Webhook signature invalid.' }, { status: 400 })
  }

  let event
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const debug = {
    eventType: event.type,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40),
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.userId
    debug.userId = userId
    debug.customer = session.customer
    debug.metadata = session.metadata

    if (userId) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()

      let error
      if (existing) {
        ;({ error } = await supabase.from('profiles').update({
          is_pro: true,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        }).eq('user_id', userId))
      } else {
        ;({ error } = await supabase.from('profiles').insert({
          user_id: userId,
          is_pro: true,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        }))
      }
      debug.supabaseError = error ? JSON.stringify(error) : null
      debug.existed = !!existing
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    const { error } = await supabase
      .from('profiles')
      .update({ is_pro: false })
      .eq('stripe_subscription_id', sub.id)
    debug.supabaseError = error ? JSON.stringify(error) : null
  }

  return NextResponse.json({ received: true, debug })
}
