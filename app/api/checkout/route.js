import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
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

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: email,
      metadata: { userId },
      success_url: `${appUrl}?pro=success`,
      cancel_url: `${appUrl}?pro=cancel`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[/api/checkout] Error:', err)
    return NextResponse.json({ error: 'Error al crear sesión de pago.' }, { status: 500 })
  }
}
