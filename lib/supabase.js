'use client'

import { createClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'
import { useMemo } from 'react'

// Limpiamos las variables por si en Vercel se colaron espacios o saltos de
// línea: la anon key va en la cabecera HTTP 'apikey' y cualquier carácter de
// control la invalida (TypeError: Header 'apikey' has invalid value).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/\s+/g, '')

// Cliente de Supabase que envía el token de Clerk en cada petición.
// Así las políticas RLS (auth.jwt() ->> 'sub') pueden identificar al usuario.
export function useSupabase() {
  const { session } = useSession()

  return useMemo(
    () =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        accessToken: async () => (await session?.getToken()) ?? null,
      }),
    [session]
  )
}
