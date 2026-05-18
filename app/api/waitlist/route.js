import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  let email
  try {
    const body = await request.json()
    email = body.email?.trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: 'Request inválida.' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido.' }, { status: 400 })
  }

  try {
    await resend.emails.send({
      from: 'ResellSnap <onboarding@resend.dev>',
      to: 'tomas.barril.14@gmail.com',
      subject: '🔔 Nueva inscripción en lista de espera Pro',
      html: `<p><strong>${email}</strong> se ha apuntado a la lista de espera de ResellSnap Pro.</p>`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/waitlist] Error:', err)
    return NextResponse.json({ error: 'Error al registrar. Inténtalo de nuevo.' }, { status: 500 })
  }
}
