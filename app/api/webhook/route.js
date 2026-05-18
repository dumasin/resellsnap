import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Use service role key for webhook (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[/api/webhook] Signature error:', err.message)
    return NextResponse.json({ error: 'Webhook signature invalid.' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.userId
    if (userId) {
      await supabase.from('profiles').upsert({
        user_id: userId,
        is_pro: true,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
      })
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    await supabase
      .from('profiles')
      .update({ is_pro: false })
      .eq('stripe_subscription_id', sub.id)
  }

  return NextResponse.json({ received: true })
}
