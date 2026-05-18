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

  console.log('[/api/webhook] Event received:', event.type)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.userId
    console.log('[/api/webhook] checkout.session.completed — userId:', userId, 'customer:', session.customer)
    if (userId) {
      const { error } = await supabase.from('profiles').upsert({
        user_id: userId,
        is_pro: true,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
      })
      if (error) console.error('[/api/webhook] Supabase upsert error:', error.message)
      else console.log('[/api/webhook] Profile updated to Pro for userId:', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    console.log('[/api/webhook] subscription.deleted — sub.id:', sub.id)
    const { error } = await supabase
      .from('profiles')
      .update({ is_pro: false })
      .eq('stripe_subscription_id', sub.id)
    if (error) console.error('[/api/webhook] Supabase update error:', error.message)
  }

  return NextResponse.json({ received: true })
}
