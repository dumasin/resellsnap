'use client'

import { createClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'
import { useMemo } from 'react'

// Cliente de Supabase que envía el token de Clerk en cada petición.
// Así las políticas RLS (auth.jwt() ->> 'sub') pueden identificar al usuario.
export function useSupabase() {
  const { session } = useSession()

  return useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          accessToken: async () => (await session?.getToken()) ?? null,
        }
      ),
    [session]
  )
}
