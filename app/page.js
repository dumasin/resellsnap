'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser, SignInButton, UserButton } from '@clerk/nextjs'
import { supabase } from '../lib/supabase'
import Onboarding from './components/Onboarding'

// ─── Usage limit ──────────────────────────────────────────────────────────────
const DAILY_LIMIT = 5
const STORAGE_KEY = 'resellsnap_usage'

function getUsage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { count: 0, date: '' }
    return JSON.parse(raw)
  } catch { return { count: 0, date: '' } }
}

function incrementUsage() {
  const today = new Date().toISOString().slice(0, 10)
  const usage = getUsage()
  const count = usage.date === today ? usage.count + 1 : 1
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, date: today }))
  return count
}

function getRemainingUses() {
  const today = new Date().toISOString().slice(0, 10)
  const usage = getUsage()
  if (usage.date !== today) return DAILY_LIMIT
  return Math.max(0, DAILY_LIMIT - usage.count)
}

// ─── Platform config ─────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: 'stockx',   name: 'StockX',   abbr: 'SX', color: '#00B81D', bg: '#f0fdf4', badge: 'Autenticado' },
  { id: 'goat',     name: 'GOAT',     abbr: 'GT', color: '#1a1a1a', bg: '#f8f8f8', badge: 'Autenticado' },
  { id: 'depop',    name: 'Depop',    abbr: 'DP', color: '#FF2300', bg: '#fff1f0', badge: null },
  { id: 'vinted',   name: 'Vinted',   abbr: 'VT', color: '#09B1BA', bg: '#f0fdfa', badge: 'Sin comisión' },
  { id: 'wallapop', name: 'Wallapop', abbr: 'WP', color: '#13C1AC', bg: '#f0fdf9', badge: null },
  { id: 'ebay',     name: 'eBay',     abbr: 'EB', color: '#3665F3', bg: '#eff6ff', badge: 'Global' },
]

const CONDITIONS = [
  { id: 'new',      label: 'Nuevo',       desc: 'Sin usar, con caja/etiquetas' },
  { id: 'like_new', label: 'Como nuevo',  desc: 'Sin uso visible' },
  { id: 'good',     label: 'Buen estado', desc: 'Uso moderado' },
  { id: 'fair',     label: 'Aceptable',   desc: 'Signos de uso claros' },
]

// ─── Icons ────────────────────────────────────────────────────────────────────
function CameraIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function LogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Home() {
  const [stage, setStage] = useState('capture')
  const [imageData, setImageData] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [results, setResults] = useState(null)
  const [condition, setCondition] = useState('like_new')
  const [error, setError] = useState(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistState, setWaitlistState] = useState('idle') // idle | loading | done | error
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [checkoutError, setCheckoutError] = useState(null)
  const fileInputRef = useRef(null)
  const { isSignedIn, user } = useUser()

  // ── Image handling ──────────────────────────────────────────────────────────
  const handleImageSelect = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Compress: max 1024px, JPEG 80%
        const canvas = document.createElement('canvas')
        const MAX = 1024
        let { width, height } = img
        if (width > height && width > MAX) { height = Math.round((height * MAX) / width); width = MAX }
        else if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX }
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', 0.8)
        setImageData(compressed)
        setImagePreview(compressed)
        setStage('preview')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }, [])

  // ── Analyze ─────────────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!isPro && getRemainingUses() <= 0) {
      setShowPaywall(true)
      return
    }
    setStage('analyzing')
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData, condition }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error al analizar. Inténtalo de nuevo.')
      }
      const data = await res.json()
      incrementUsage()
      setResults(data)
      setCondition(condition)
      setStage('results')
      saveScan(data, condition)
    } catch (err) {
      setError(err.message)
      setStage('preview')
    }
  }, [imageData, condition])

  // ── Cargar estado Pro ────────────────────────────────────────────────────────
  const loadProStatus = useCallback(async () => {
    if (!user?.id) return
    const res = await fetch(`/api/profile?userId=${user.id}`)
    const data = await res.json()
    setIsPro(data?.is_pro ?? false)
  }, [user])

  // Detectar vuelta de Stripe con ?pro=success → guardar flag en localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('pro') === 'success') {
      window.history.replaceState({}, '', '/')
      localStorage.setItem('resellsnap_sync_pro', '1')
    }
  }, [])

  // Cuando el usuario está logueado, sincronizar Pro si hay flag pendiente
  useEffect(() => {
    if (!isSignedIn || !user?.id) return
    loadProStatus()
    const needsSync = localStorage.getItem('resellsnap_sync_pro')
    if (needsSync) {
      localStorage.removeItem('resellsnap_sync_pro')
      const email = user.primaryEmailAddress?.emailAddress
      fetch('/api/sync-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email }),
      })
        .then(r => r.json())
        .then(data => { if (data.is_pro) setIsPro(true) })
        .catch(() => {})
    }
  }, [isSignedIn, user, loadProStatus])

  // ── Checkout Stripe ──────────────────────────────────────────────────────────
  const handlePortal = useCallback(async () => {
    if (!user?.id) return
    const res = await fetch('/api/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
  }, [user])

  const handleCheckout = useCallback(async () => {
    if (!isSignedIn) return
    setCheckoutError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.primaryEmailAddress?.emailAddress }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError(data.error || 'Error al iniciar el pago.')
      }
    } catch {
      setCheckoutError('Error de conexión. Inténtalo de nuevo.')
    }
  }, [isSignedIn, user])

  // ── Supabase: guardar scan ───────────────────────────────────────────────────
  const saveScan = useCallback(async (data, cond) => {
    if (!user?.id) return
    await supabase.from('scans').insert({
      user_id: user.id,
      item_name: data.item_name,
      brand: data.brand,
      category: data.category,
      confidence: data.confidence,
      condition: cond,
      platforms: data.platforms,
      best_platform: data.best_platform,
      tip: data.tip,
    })
  }, [user])

  // ── Supabase: cargar historial ───────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    if (data) setHistory(data)
  }, [user])

  // ── Waitlist ────────────────────────────────────────────────────────────────
  const handleWaitlist = useCallback(async (e) => {
    e.preventDefault()
    if (!waitlistEmail) return
    setWaitlistState('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail }),
      })
      setWaitlistState(res.ok ? 'done' : 'error')
    } catch {
      setWaitlistState('error')
    }
  }, [waitlistEmail])

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setStage('capture')
    setImageData(null)
    setImagePreview(null)
    setResults(null)
    setError(null)
    setShowPaywall(false)
    setCondition('like_new')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getPricesForCondition = useCallback(() => {
    if (!results?.platforms) return []
    return PLATFORMS
      .map((p) => {
        const prices = results.platforms[p.id]?.[condition]
        if (!prices || !prices.min || !prices.max) return null
        return { ...p, min: prices.min, max: prices.max, mid: Math.round((prices.min + prices.max) / 2) }
      })
      .filter(Boolean)
      .sort((a, b) => b.max - a.max)
  }, [results, condition])

  const getScaleForPlatform = useCallback((platform) => {
    if (!results?.platforms?.[platform]) return []
    return CONDITIONS.map((c) => {
      const prices = results.platforms[platform][c.id]
      return prices ? { ...c, mid: Math.round((prices.min + prices.max) / 2) } : null
    }).filter(Boolean)
  }, [results])

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-brand-bg flex flex-col">

      <Onboarding />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="text-white px-4 h-14 flex items-center justify-between sticky top-0 z-20 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="ResellSnap" className="w-8 h-8 rounded-lg flex-shrink-0" />
          <span className="font-extrabold text-lg tracking-tight">ResellSnap</span>
          {isPro && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: 'white' }}>
              ✦ Pro
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {stage !== 'capture' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-white/10"
            >
              <RefreshIcon />
              <span>Nueva foto</span>
            </button>
          )}
          {isSignedIn && (
            <button
              onClick={() => { loadHistory(); setShowHistory(true) }}
              className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
            >
              Historial
            </button>
          )}
          {isPro && (
            <button
              onClick={handlePortal}
              className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
            >
              Suscripción
            </button>
          )}
          {!isPro && (
            <button
              onClick={() => setShowPricing(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: 'white' }}
            >
              ✦ Pro
            </button>
          )}
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <SignInButton mode="modal">
              <button className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition-all cursor-pointer">
                Iniciar sesión
              </button>
            </SignInButton>
          )}
        </div>
      </header>

      {/* ── Paywall modal ──────────────────────────────────────────────────── */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 flex flex-col gap-5 animate-fade-up">
            <div className="w-12 h-1.5 bg-brand-muted rounded-full mx-auto" />
            <div className="text-center space-y-1">
              <p className="text-2xl">🔒</p>
              <h2 className="text-xl font-bold text-brand-fg">Límite diario alcanzado</h2>
              <p className="text-sm text-brand-subtle leading-relaxed">
                Has usado tus {DAILY_LIMIT} análisis gratuitos de hoy.<br />
                Vuelve mañana o hazte Pro para análisis ilimitados.
              </p>
            </div>

            <div className="bg-brand-fg rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ResellSnap Pro</p>
              <ul className="text-sm text-slate-200 space-y-1.5">
                {['Análisis ilimitados', 'Historial de escaneos', 'Acceso prioritario a nuevas funciones'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>

              {waitlistState === 'done' ? (
                <div className="bg-green-500/20 rounded-xl p-3 text-center text-sm text-green-300 font-medium">
                  ✓ Apuntado. Te avisaremos cuando Pro esté disponible.
                </div>
              ) : (
                <form onSubmit={handleWaitlist} className="flex flex-col gap-2 mt-1">
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-white/10 text-white placeholder-slate-400 text-sm border border-white/10 focus:outline-none focus:border-blue-400"
                  />
                  {isSignedIn ? (
                    <button
                      type="button"
                      onClick={handleCheckout}
                      className="w-full py-3 bg-brand-accent text-white rounded-xl font-semibold text-sm cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      Hazte Pro — 7€/mes
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={waitlistState === 'loading'}
                      className="w-full py-3 bg-brand-accent text-white rounded-xl font-semibold text-sm cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-60"
                    >
                      {waitlistState === 'loading' ? 'Enviando…' : 'Únete a la lista de espera'}
                    </button>
                  )}
                  {waitlistState === 'error' && (
                    <p className="text-xs text-red-400 text-center">Error al registrar. Inténtalo de nuevo.</p>
                  )}
                </form>
              )}
            </div>

            {!isSignedIn && (
              <div className="text-center">
                <p className="text-xs text-brand-subtle mb-2">¿Ya tienes cuenta?</p>
                <SignInButton mode="modal">
                  <button className="text-sm font-semibold text-brand-accent cursor-pointer hover:underline">
                    Inicia sesión para gestionar tus análisis
                  </button>
                </SignInButton>
              </div>
            )}

            <button
              onClick={() => setShowPaywall(false)}
              className="text-sm text-brand-subtle text-center py-1 cursor-pointer hover:text-brand-fg transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      )}

      {/* ── Pricing modal ──────────────────────────────────────────────────── */}
      {showPricing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 flex flex-col gap-5 animate-fade-up">
            <div className="w-12 h-1.5 bg-brand-muted rounded-full mx-auto" />

            <div className="text-center">
              <h2 className="text-xl font-extrabold text-brand-fg">Elige tu plan</h2>
              <p className="text-sm text-brand-subtle mt-1">Sin permanencia. Cancela cuando quieras.</p>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Free */}
              <div className="rounded-2xl border-2 border-brand-border p-4 flex flex-col gap-2">
                <p className="text-xs font-bold text-brand-subtle uppercase tracking-wider">Free</p>
                <p className="text-2xl font-extrabold text-brand-fg">0€</p>
                <p className="text-[11px] text-brand-subtle">para siempre</p>
                <div className="border-t border-brand-border my-1" />
                <ul className="text-xs text-brand-secondary space-y-1.5">
                  <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> 5 análisis/día</li>
                  <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> 6 plataformas</li>
                  <li className="flex items-center gap-1.5"><span className="text-slate-300">✗</span> Historial</li>
                  <li className="flex items-center gap-1.5"><span className="text-slate-300">✗</span> Sin límites</li>
                </ul>
              </div>

              {/* Pro */}
              <div className="rounded-2xl border-2 p-4 flex flex-col gap-2 relative overflow-hidden" style={{ borderColor: '#2563EB', background: 'linear-gradient(145deg, #EFF6FF, #F5F3FF)' }}>
                <div className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>✦ PRO</div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2563EB' }}>Pro</p>
                <p className="text-2xl font-extrabold text-brand-fg">7€</p>
                <p className="text-[11px] text-brand-subtle">al mes</p>
                <div className="border-t border-blue-100 my-1" />
                <ul className="text-xs text-brand-secondary space-y-1.5">
                  <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Ilimitados</li>
                  <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> 6 plataformas</li>
                  <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Historial</li>
                  <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Sin límites</li>
                </ul>
              </div>
            </div>

            {isSignedIn ? (
              <>
                <button
                  onClick={handleCheckout}
                  className="w-full py-4 text-white font-bold rounded-2xl text-base cursor-pointer active:scale-[0.98] transition-transform"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', boxShadow: '0 8px 24px -6px rgba(37,99,235,0.5)' }}
                >
                  Hazte Pro — 7€/mes
                </button>
                {checkoutError && <p className="text-xs text-red-500 text-center -mt-2">{checkoutError}</p>}
              </>
            ) : (
              <SignInButton mode="modal">
                <button className="w-full py-4 text-white font-bold rounded-2xl text-base cursor-pointer active:scale-[0.98] transition-transform" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                  Inicia sesión para suscribirte
                </button>
              </SignInButton>
            )}

            <button
              onClick={() => setShowPricing(false)}
              className="text-sm text-brand-subtle text-center py-1 cursor-pointer hover:text-brand-fg transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
      )}

      {/* ── History modal ──────────────────────────────────────────────────── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex flex-col bg-brand-bg max-w-md mx-auto">
          <div className="flex items-center justify-between px-4 h-14 border-b border-brand-border bg-white flex-shrink-0">
            <h2 className="font-bold text-brand-fg text-base">Mis análisis</h2>
            <button onClick={() => setShowHistory(false)} className="text-sm text-brand-subtle hover:text-brand-fg cursor-pointer px-2 py-1">
              Cerrar
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-20">
                <p className="text-4xl">📷</p>
                <p className="font-semibold text-brand-fg">Sin análisis todavía</p>
                <p className="text-sm text-brand-subtle">Tus próximos scans aparecerán aquí</p>
              </div>
            ) : history.map((scan) => {
              const condPrices = scan.platforms?.[scan.best_platform]?.[scan.condition]
              const mid = condPrices ? Math.round((condPrices.min + condPrices.max) / 2) : null
              const platform = PLATFORMS.find(p => p.id === scan.best_platform)
              return (
                <div key={scan.id} className="bg-white rounded-2xl border border-brand-border p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                    style={{ backgroundColor: platform?.color || '#64748B' }}>
                    {platform?.abbr || '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-brand-fg truncate">{scan.item_name}</p>
                    <p className="text-xs text-brand-subtle">{scan.category} · {CONDITIONS.find(c => c.id === scan.condition)?.label}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {mid ? <p className="font-bold text-sm text-brand-fg">~€{mid}</p> : null}
                    <p className="text-[10px] text-brand-subtle">{new Date(scan.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col max-w-md mx-auto w-full">

        {/* ════════════════════════════════════════════════════════════
            STAGE 1 — CAPTURE
        ════════════════════════════════════════════════════════════ */}
        {stage === 'capture' && (
          <div className="flex-1 flex flex-col px-5 pt-8 pb-10 gap-8 overflow-y-auto">

            {/* Hero */}
            <div className="text-center space-y-3 animate-fade-up">
              <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-semibold text-blue-700">IA en tiempo real</span>
              </div>
              <h1 className="text-[28px] font-extrabold text-brand-fg leading-tight tracking-tight">
                ¿Cuánto vale<br />
                <span className="gradient-text">tu artículo?</span>
              </h1>
              <p className="text-brand-subtle text-sm leading-relaxed max-w-xs mx-auto">
                Fotografía cualquier prenda o sneaker y obtén precios de reventa reales en 6 plataformas al instante.
              </p>
            </div>

            {/* Camera button */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative w-40 h-40 rounded-full flex flex-col items-center justify-center gap-3 active:scale-95 transition-all duration-150 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #1E293B 0%, #2563EB 100%)', boxShadow: '0 20px 60px -10px rgba(37,99,235,0.5)' }}
                aria-label="Hacer foto o elegir imagen"
              >
                <span className="btn-camera-ring" />
                <span className="btn-camera-ring-2" />
                <CameraIcon size={44} />
                <span className="text-sm font-bold tracking-wide text-white">Fotografiar</span>
              </button>
              <p className="text-xs text-brand-subtle">Toca para elegir foto de tu galería</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="sr-only"
              aria-label="Seleccionar imagen"
            />

            {/* Platform grid */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-[11px] text-brand-subtle font-semibold uppercase tracking-widest">Precios en 6 plataformas</p>
              <div className="flex flex-wrap justify-center gap-2">
                {PLATFORMS.map((p) => (
                  <span
                    key={p.id}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-brand-border text-brand-secondary shadow-sm"
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white rounded-3xl border border-brand-border p-5 space-y-4">
              <p className="text-xs font-bold text-brand-subtle uppercase tracking-widest">Cómo funciona</p>
              {[
                { step: '1', icon: '📷', title: 'Fotografía', desc: 'Haz una foto clara del artículo' },
                { step: '2', icon: '🤖', title: 'La IA analiza', desc: 'Identifica marca, modelo y valor de mercado' },
                { step: '3', icon: '💶', title: 'Obtén precios', desc: 'Precios reales en StockX, Vinted, Depop y más' },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-fg flex items-center justify-center flex-shrink-0 text-sm">{icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-brand-fg">{title}</p>
                    <p className="text-xs text-brand-subtle leading-snug mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Free uses badge */}
            <p className="text-center text-xs text-brand-subtle">
              {isPro
                ? <span className="font-semibold" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✦ Análisis ilimitados · Plan Pro activo</span>
                : <><span className="font-semibold text-brand-fg">{DAILY_LIMIT} análisis gratis</span> al día · Sin tarjeta</>
              }
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STAGE 2 — PREVIEW
        ════════════════════════════════════════════════════════════ */}
        {stage === 'preview' && imagePreview && (
          <div className="flex-1 flex flex-col">
            {/* Image preview */}
            <div className="relative bg-black">
              <img
                src={imagePreview}
                alt="Vista previa"
                className="w-full aspect-square object-cover opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Form */}
            <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto">
              {error && (
                <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl p-3.5 text-sm text-red-700 font-medium">
                  {error}
                </div>
              )}

              {/* Condition picker */}
              <div>
                <p className="text-xs font-semibold text-brand-subtle uppercase tracking-wider mb-3">
                  Condición del artículo
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCondition(c.id)}
                      className={`p-3.5 rounded-2xl text-left transition-all duration-150 cursor-pointer ${
                        condition === c.id
                          ? 'bg-brand-primary text-white shadow-md shadow-slate-900/20'
                          : 'bg-white border border-brand-border text-brand-fg hover:border-brand-secondary'
                      }`}
                    >
                      <div className="font-semibold text-sm">{c.label}</div>
                      <div className={`text-xs mt-0.5 leading-tight ${condition === c.id ? 'text-slate-300' : 'text-brand-subtle'}`}>
                        {c.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Analyze CTA */}
              <button
                onClick={handleAnalyze}
                className="w-full py-4 bg-brand-accent text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md shadow-blue-600/25 cursor-pointer"
              >
                <span>Analizar precio</span>
                <ArrowIcon />
              </button>

              {/* Usage indicator */}
              <p className="text-center text-[11px] text-brand-subtle leading-relaxed">
                {getRemainingUses()} de {DAILY_LIMIT} análisis gratuitos restantes hoy.
              </p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STAGE 3 — ANALYZING
        ════════════════════════════════════════════════════════════ */}
        {stage === 'analyzing' && imagePreview && (
          <div className="flex-1 flex flex-col">
            <div className="relative scan-container bg-black">
              <img
                src={imagePreview}
                alt="Analizando"
                className="w-full aspect-square object-cover opacity-40"
              />
              {/* Scan overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Viewfinder corners */}
                <div className="relative w-48 h-48">
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-400 rounded-tl-sm" />
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-400 rounded-tr-sm" />
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-400 rounded-bl-sm" />
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-400 rounded-br-sm" />
                  <div className="scan-line" />
                </div>
                {/* Text */}
                <div className="mt-8 text-center">
                  <p className="text-white font-semibold text-lg">Identificando artículo…</p>
                  <p className="text-white/60 text-sm mt-1">Consultando precios de mercado</p>
                </div>
              </div>
            </div>

            {/* Skeleton placeholders */}
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-brand-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl shimmer flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded shimmer" />
                    <div className="h-4 w-32 rounded shimmer" />
                    <div className="h-1.5 w-full rounded-full shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STAGE 4 — RESULTS
        ════════════════════════════════════════════════════════════ */}
        {stage === 'results' && results && (() => {
          const prices = getPricesForCondition()
          const bestPlatform = results.best_platform || prices[0]?.id
          const scaleData = getScaleForPlatform(bestPlatform)
          const maxMid = Math.max(...(scaleData.map((s) => s.mid) || [1]))
          const maxMax = prices.length > 0 ? Math.max(...prices.map((p) => p.max)) : 1

          return (
            <div className="flex-1 flex flex-col pb-8">
              {/* Item hero */}
              <div className="relative bg-black">
                <img src={imagePreview} alt={results.item_name} className="w-full aspect-video object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-fg via-brand-fg/30 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
                    {results.category || 'Artículo'}
                  </p>
                  <h2 className="text-white font-bold text-xl leading-snug">
                    {results.item_name}
                  </h2>
                  {results.confidence === 'high' && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <StarIcon />
                      <span className="text-yellow-300 text-xs font-medium">Alta confianza</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 flex flex-col gap-5">

                {/* ── Condition selector ─────────────────────────────────── */}
                <div>
                  <p className="text-xs font-semibold text-brand-subtle uppercase tracking-wider mb-2">Condición</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                    {CONDITIONS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCondition(c.id)}
                        className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                          condition === c.id
                            ? 'bg-brand-primary text-white shadow-sm'
                            : 'bg-white border border-brand-border text-brand-secondary hover:border-slate-400'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Platform price cards ───────────────────────────────── */}
                <div>
                  <p className="text-xs font-semibold text-brand-subtle uppercase tracking-wider mb-2">Precios de reventa</p>
                  <div className="flex flex-col gap-2">
                    {prices.length === 0 ? (
                      <p className="text-sm text-brand-subtle text-center py-4">No hay datos para esta condición.</p>
                    ) : prices.map((p, i) => (
                      <div
                        key={p.id}
                        className={`bg-white rounded-2xl p-4 flex items-center gap-3 animate-fade-up ${
                          i === 0 ? 'ring-2 ring-brand-accent' : 'border border-brand-border'
                        }`}
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        {/* Platform badge */}
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: p.color }}
                          aria-label={p.name}
                        >
                          {p.abbr}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-sm text-brand-fg truncate">{p.name}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {p.badge && (
                                <span
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                                  style={{ backgroundColor: p.bg, color: p.color }}
                                >
                                  {p.badge}
                                </span>
                              )}
                              {i === 0 && (
                                <span className="text-[10px] bg-blue-50 text-brand-accent font-semibold px-1.5 py-0.5 rounded-md">
                                  Top precio
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-brand-fg font-bold text-base">
                              €{p.min} – €{p.max}
                            </span>
                            <span className="text-brand-subtle text-xs">
                              ~€{p.mid}
                            </span>
                          </div>

                          {/* Price bar */}
                          <div className="mt-2 h-1.5 bg-brand-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 ease-out"
                              style={{
                                width: `${Math.max(10, (p.max / maxMax) * 100)}%`,
                                backgroundColor: p.color,
                              }}
                            />
                          </div>
                        </div>

                        <ChevronIcon />
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Pricing scale (condition impact) ──────────────────── */}
                {scaleData.length > 1 && (() => {
                  const bestP = PLATFORMS.find((p) => p.id === bestPlatform)
                  return (
                    <div className="bg-white rounded-2xl p-4 border border-brand-border">
                      <p className="text-xs font-semibold text-brand-subtle uppercase tracking-wider mb-1">
                        Escala de precio — {bestP?.name || 'Mejor plataforma'}
                      </p>
                      <p className="text-xs text-brand-subtle mb-3">Cómo afecta la condición al precio</p>
                      <div className="space-y-2.5">
                        {scaleData.map((s) => (
                          <div key={s.id} className="flex items-center gap-3">
                            <span className={`text-xs font-medium w-24 flex-shrink-0 ${
                              s.id === condition ? 'text-brand-accent font-semibold' : 'text-brand-secondary'
                            }`}>
                              {s.label}
                            </span>
                            <div className="flex-1 h-2 bg-brand-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${Math.max(5, (s.mid / maxMid) * 100)}%`,
                                  backgroundColor: s.id === condition ? '#2563EB' : '#CBD5E1',
                                }}
                              />
                            </div>
                            <span className={`text-sm font-bold w-14 text-right flex-shrink-0 ${
                              s.id === condition ? 'text-brand-accent' : 'text-brand-secondary'
                            }`}>
                              ~€{s.mid}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* ── AI Tip ────────────────────────────────────────────── */}
                {results.tip && (
                  <div className="bg-brand-fg rounded-2xl p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Consejo de la IA
                    </p>
                    <p className="text-sm text-slate-200 leading-relaxed">{results.tip}</p>
                  </div>
                )}

                {/* ── Reset CTA ─────────────────────────────────────────── */}
                <button
                  onClick={handleReset}
                  className="w-full py-4 bg-brand-primary text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <RefreshIcon />
                  <span>Analizar otro artículo</span>
                </button>

                <p className="text-center text-[11px] text-brand-subtle leading-relaxed">
                  Precios estimados con IA. Pueden variar según demanda y temporada.
                </p>
              </div>
            </div>
          )
        })()}

      </main>
      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="flex-shrink-0 py-4 px-5 flex justify-center gap-5 border-t border-brand-border">
        <a href="/privacidad" className="text-xs text-brand-subtle hover:text-brand-fg transition-colors">Privacidad</a>
        <a href="/terminos" className="text-xs text-brand-subtle hover:text-brand-fg transition-colors">Términos</a>
        <a href="mailto:soporte@resellsnap.app" className="text-xs text-brand-subtle hover:text-brand-fg transition-colors">Contacto</a>
      </footer>

    </div>
  )
}
