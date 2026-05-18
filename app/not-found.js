import Link from 'next/link'

export const metadata = {
  title: 'Página no encontrada – ResellSnap',
}

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-brand-bg flex flex-col items-center justify-center px-5 text-center gap-6">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
        style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
      >
        📷
      </div>

      <div className="space-y-2">
        <h1 className="text-6xl font-extrabold text-brand-fg">404</h1>
        <p className="text-lg font-semibold text-brand-fg">Página no encontrada</p>
        <p className="text-sm text-brand-subtle max-w-xs">
          Esta página no existe o ha sido movida. Vuelve al inicio para seguir analizando precios.
        </p>
      </div>

      <Link
        href="/"
        className="px-6 py-3 rounded-2xl text-white font-semibold text-sm cursor-pointer active:scale-[0.98] transition-transform"
        style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
      >
        Volver al inicio
      </Link>
    </div>
  )
}
