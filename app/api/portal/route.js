import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  let userId
  try {
    const body = await request.json()
    userId = body.userId
  } catch {
    return NextResponse.json({ error: 'Request inválida.' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No se encontró la suscripción.' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const params = new URLSearchParams({
    customer: profile.stripe_customer_id,
    return_url: appUrl,
  })

  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const session = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: session.error?.message || 'Error de Stripe.' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
