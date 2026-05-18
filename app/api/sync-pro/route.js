import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  let userId, email
  try {
    const body = await request.json()
    userId = body.userId
    email = body.email
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId.' }, { status: 400 })
  }

  // Search for Stripe customer by email
  const searchRes = await fetch(
    `https://api.stripe.com/v1/customers/search?query=email:'${encodeURIComponent(email)}'&limit=5`,
    {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    }
  )
  const searchData = await searchRes.json()
  const customers = searchData.data || []

  for (const customer of customers) {
    // Check if customer has an active subscription
    const subsRes = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${customer.id}&status=active&limit=1`,
      {
        headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
      }
    )
    const subsData = await subsRes.json()
    const sub = subsData.data?.[0]

    if (sub) {
      const { error } = await supabase.from('profiles').upsert({
        user_id: userId,
        is_pro: true,
        stripe_customer_id: customer.id,
        stripe_subscription_id: sub.id,
      })
      if (error) {
        console.error('[/api/sync-pro] Supabase error:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      console.log('[/api/sync-pro] Pro synced for userId:', userId)
      return NextResponse.json({ is_pro: true })
    }
  }

  return NextResponse.json({ is_pro: false })
}
