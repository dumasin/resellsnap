import { NextResponse } from 'next/server'

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY no configurada.' }, { status: 500 })
  }

  let userId, email
  try {
    const body = await request.json()
    userId = body.userId
    email = body.email
  } catch {
    return NextResponse.json({ error: 'Request inválida.' }, { status: 400 })
  }

  if (!userId) {
    return NextResponse.json({ error: 'Usuario no autenticado.' }, { status: 401 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const params = new URLSearchParams({
    mode: 'subscription',
    'payment_method_types[]': 'card',
    'line_items[0][price]': process.env.STRIPE_PRICE_ID,
    'line_items[0][quantity]': '1',
    'metadata[userId]': userId,
    success_url: `${appUrl}?pro=success`,
    cancel_url: `${appUrl}?pro=cancel`,
  })
  if (email) params.append('customer_email', email)

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await res.json()

    if (!res.ok) {
      console.error('[/api/checkout] Stripe API error:', session.error?.message)
      return NextResponse.json({ error: session.error?.message || 'Error de Stripe.' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[/api/checkout] Fetch error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
