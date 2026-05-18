import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ is_pro: false })
  }

  const { data } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('user_id', userId)
    .single()

  return NextResponse.json({ is_pro: data?.is_pro ?? false })
}
