'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser, SignInButton, UserButton } from '@clerk/nextjs'
import { supabase } from '../lib/supabase'
import Onboarding from './components/Onboarding'

// ─── Usage limit ──────────────────────────────────────────────────────────────
const MONTHLY_LIMIT = 5
const STORAGE_KEY = 'resellsnap_usage'

function getUsage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { count: 0, date: '' }
    return JSON.parse(raw)
  } catch { return { count: 0, date: '' } }
}

function incrementUsage() {
  const month = new Date().toISOString().slice(0, 7)
  const usage = getUsage()
  const count = usage.date === month ? usage.count + 1 : 1
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, date: month }))
  return count
}

function getRemainingUses() {
  const month = new Date().toISOString().slice(0, 7)
  const usage = getUsage()
  if (usage.date !== month) return MONTHLY_LIMIT
  return Math.max(0, MONTHLY_LIMIT - usage.count)
}

// ─── Platform config ─────────────────────────────────────────────────────────
const PLATFORMS_ES = [
  { id: 'stockx',   name: 'StockX',   abbr: 'SX', color: '#00B81D', bg: '#f0fdf4', badge: 'Autenticado' },
  { id: 'goat',     name: 'GOAT',     abbr: 'GT', color: '#1a1a1a', bg: '#f8f8f8', badge: 'Autenticado' },
  { id: 'depop',    name: 'Depop',    abbr: 'DP', color: '#FF2300', bg: '#fff1f0', badge: null },
  { id: 'vinted',   name: 'Vinted',   abbr: 'VT', color: '#09B1BA', bg: '#f0fdfa', badge: 'Sin comisión' },
  { id: 'wallapop', name: 'Wallapop', abbr: 'WP', color: '#13C1AC', bg: '#f0fdf9', badge: null },
  { id: 'ebay',     name: 'eBay',     abbr: 'EB', color: '#3665F3', bg: '#eff6ff', badge: 'Global' },
]

const PLATFORMS_EN = [
  { id: 'stockx',   name: 'StockX',   abbr: 'SX', color: '#00B81D', bg: '#f0fdf4', badge: 'Authenticated' },
  { id: 'goat',     name: 'GOAT',     abbr: 'GT', color: '#1a1a1a', bg: '#f8f8f8', badge: 'Authenticated' },
  { id: 'depop',    name: 'Depop',    abbr: 'DP', color: '#FF2300', bg: '#fff1f0', badge: null },
  { id: 'grailed',  name: 'Grailed',  abbr: 'GR', color: '#FF3366', bg: '#fff0f4', badge: 'Streetwear' },
  { id: 'poshmark', name: 'Poshmark', abbr: 'PM', color: '#E0003B', bg: '#fff0f3', badge: null },
  { id: 'ebay',     name: 'eBay',     abbr: 'EB', color: '#3665F3', bg: '#eff6ff', badge: 'Global' },
]

const CONDITIONS_ES = [
  { id: 'new',      label: 'Nuevo',       desc: 'Sin usar, con caja/etiquetas' },
  { id: 'like_new', label: 'Como nuevo',  desc: 'Sin uso visible' },
  { id: 'good',     label: 'Buen estado', desc: 'Uso moderado' },
  { id: 'fair',     label: 'Aceptable',   desc: 'Signos de uso claros' },
]

const CONDITIONS_EN = [
  { id: 'new',      label: 'New',       desc: 'Unworn, with box/tags' },
  { id: 'like_new', label: 'Like New',  desc: 'No visible wear' },
  { id: 'good',     label: 'Good',      desc: 'Moderate use' },
  { id: 'fair',     label: 'Fair',      desc: 'Visible signs of use' },
]

// ─── Translations ─────────────────────────────────────────────────────────────
const STRINGS = {
  es: {
    newPhoto: 'Nueva foto',
    history: 'Historial',
    subscription: 'Suscripción',
    signIn: 'Iniciar sesión',
    paywallTitle: 'Límite mensual alcanzado',
    paywallDesc1: `Has usado tus ${MONTHLY_LIMIT} análisis gratuitos del mes.`,
    paywallDesc2: 'Vuelve el próximo mes o hazte Pro para análisis ilimitados.',
    proFeatures: ['Análisis ilimitados', 'Historial de escaneos', 'Acceso prioritario a nuevas funciones'],
    addedToWaitlist: '✓ Apuntado. Te avisaremos cuando Pro esté disponible.',
    emailPlaceholder: 'tu@email.com',
    goPro: 'Hazte Pro — 7€/mes',
    joinWaitlist: 'Únete a la lista de espera',
    sending: 'Enviando…',
    waitlistError: 'Error al registrar. Inténtalo de nuevo.',
    alreadyAccount: '¿Ya tienes cuenta?',
    signInManage: 'Inicia sesión para gestionar tus análisis',
    back: 'Volver',
    choosePlan: 'Elige tu plan',
    noCommitment: 'Sin permanencia. Cancela cuando quieras.',
    freePrice: '0€',
    forever: 'para siempre',
    analysesPerMonth: '5 análisis/mes',
    sixPlatforms: '6 plataformas',
    historyLabel: 'Historial',
    noLimitsLabel: 'Sin límites',
    proPrice: '7€',
    perMonth: 'al mes',
    unlimited: 'Ilimitados',
    goProBtn: 'Hazte Pro — 7€/mes',
    signInSubscribe: 'Inicia sesión para suscribirte',
    notNow: 'Ahora no',
    myAnalyses: 'Mis análisis',
    close: 'Cerrar',
    noAnalyses: 'Sin análisis todavía',
    noAnalysesDesc: 'Tus próximos scans aparecerán aquí',
    realtimeAI: 'IA en tiempo real',
    heroLine1: '¿Cuánto vale',
    heroLine2: 'tu artículo?',
    heroDesc: 'Fotografía cualquier prenda o sneaker y obtén precios de reventa reales en 6 plataformas al instante.',
    photograph: 'Fotografiar',
    tapGallery: 'Toca para elegir foto de tu galería',
    pricesOn6: 'Precios en 6 plataformas',
    howItWorks: 'Cómo funciona',
    steps: [
      { icon: '📷', title: 'Fotografía', desc: 'Haz una foto clara del artículo' },
      { icon: '🤖', title: 'La IA analiza', desc: 'Identifica marca, modelo y valor de mercado' },
      { icon: '💶', title: 'Obtén precios', desc: 'Precios reales en StockX, Vinted, Depop y más' },
    ],
    freeAnalyses: `${MONTHLY_LIMIT} análisis gratis`,
    freePerPeriod: 'al mes · Sin tarjeta',
    proBadge: '✦ Análisis ilimitados · Plan Pro activo',
    conditionLabel: 'Condición del artículo',
    analyzeBtn: 'Analizar precio',
    remainingPre: 'de',
    remainingPost: 'análisis gratuitos restantes este mes.',
    identifying: 'Identificando artículo…',
    checkingPrices: 'Consultando precios de mercado',
    highConfidence: 'Alta confianza',
    conditionLabelResults: 'Condición',
    resalePrices: 'Precios de reventa',
    noData: 'No hay datos para esta condición.',
    topPrice: 'Top precio',
    priceScaleLabel: 'Escala de precio',
    conditionImpact: 'Cómo afecta la condición al precio',
    aiTip: 'Consejo de la IA',
    analyzeAnother: 'Analizar otro artículo',
    disclaimer: 'Precios estimados con IA. Pueden variar según demanda y temporada.',
    privacy: 'Privacidad',
    terms: 'Términos',
    contact: 'Contacto',
    errorDefault: 'Error al analizar. Inténtalo de nuevo.',
    connectionError: 'Error de conexión. Inténtalo de nuevo.',
    checkoutError: 'Error al iniciar el pago.',
  },
  en: {
    newPhoto: 'New photo',
    history: 'History',
    subscription: 'Subscription',
    signIn: 'Sign in',
    paywallTitle: 'Monthly limit reached',
    paywallDesc1: `You've used your ${MONTHLY_LIMIT} free analyses this month.`,
    paywallDesc2: 'Come back next month or go Pro for unlimited analyses.',
    proFeatures: ['Unlimited analyses', 'Scan history', 'Priority access to new features'],
    addedToWaitlist: "✓ Added. We'll notify you when Pro is available.",
    emailPlaceholder: 'your@email.com',
    goPro: 'Go Pro — $7/mo',
    joinWaitlist: 'Join the waitlist',
    sending: 'Sending…',
    waitlistError: 'Registration error. Please try again.',
    alreadyAccount: 'Already have an account?',
    signInManage: 'Sign in to manage your analyses',
    back: 'Back',
    choosePlan: 'Choose your plan',
    noCommitment: 'No commitment. Cancel anytime.',
    freePrice: '$0',
    forever: 'forever',
    analysesPerMonth: '5 analyses/month',
    sixPlatforms: '6 platforms',
    historyLabel: 'History',
    noLimitsLabel: 'Unlimited',
    proPrice: '$7',
    perMonth: 'per month',
    unlimited: 'Unlimited',
    goProBtn: 'Go Pro — $7/mo',
    signInSubscribe: 'Sign in to subscribe',
    notNow: 'Not now',
    myAnalyses: 'My analyses',
    close: 'Close',
    noAnalyses: 'No analyses yet',
    noAnalysesDesc: 'Your upcoming scans will appear here',
    realtimeAI: 'Real-time AI',
    heroLine1: 'How much is',
    heroLine2: 'your item worth?',
    heroDesc: 'Photograph any clothing or sneaker and get real resale prices across 6 platforms instantly.',
    photograph: 'Photograph',
    tapGallery: 'Tap to choose a photo from your gallery',
    pricesOn6: 'Prices on 6 platforms',
    howItWorks: 'How it works',
    steps: [
      { icon: '📷', title: 'Photograph', desc: 'Take a clear photo of the item' },
      { icon: '🤖', title: 'AI analysis', desc: 'Identifies brand, model, and market value' },
      { icon: '💵', title: 'Get prices', desc: 'Real prices on StockX, Grailed, Depop and more' },
    ],
    freeAnalyses: `${MONTHLY_LIMIT} free analyses`,
    freePerPeriod: 'per month · No card',
    proBadge: '✦ Unlimited analyses · Pro plan active',
    conditionLabel: 'Item condition',
    analyzeBtn: 'Analyze price',
    remainingPre: 'of',
    remainingPost: 'free analyses remaining this month.',
    identifying: 'Identifying item…',
    checkingPrices: 'Checking market prices',
    highConfidence: 'High confidence',
    conditionLabelResults: 'Condition',
    resalePrices: 'Resale prices',
    noData: 'No data for this condition.',
    topPrice: 'Top price',
    priceScaleLabel: 'Price scale',
    conditionImpact: 'How condition affects price',
    aiTip: 'AI Tip',
    analyzeAnother: 'Analyze another item',
    disclaimer: 'AI-estimated prices. May vary based on demand and season.',
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    errorDefault: 'Error analyzing. Please try again.',
    connectionError: 'Connection error. Please try again.',
    checkoutError: 'Error starting payment.',
  },
}

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
  const [lang, setLang] = useState('es')
  const [stage, setStage] = useState('capture')
  const [imageData, setImageData] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [results, setResults] = useState(null)
  const [condition, setCondition] = useState('like_new')
  const [error, setError] = useState(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistState, setWaitlistState] = useState('idle')
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [checkoutError, setCheckoutError] = useState(null)
  const fileInputRef = useRef(null)
  const { isSignedIn, user } = useUser()

  // ── Language detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('resellsnap_lang')
    if (stored === 'en' || stored === 'es') {
      setLang(stored)
    } else {
      const detected = navigator.language?.startsWith('en') ? 'en' : 'es'
      setLang(detected)
      localStorage.setItem('resellsnap_lang', detected)
    }
  }, [])

  // ── Derived from lang ───────────────────────────────────────────────────────
  const platforms = lang === 'en' ? PLATFORMS_EN : PLATFORMS_ES
  const conditions = lang === 'en' ? CONDITIONS_EN : CONDITIONS_ES
  const curr = lang === 'en' ? '$' : '€'
  const s = STRINGS[lang]

  // ── Image handling ──────────────────────────────────────────────────────────
  const handleImageSelect = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
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
        body: JSON.stringify({ image: imageData, condition, lang }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || s.errorDefault)
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
  }, [imageData, condition, lang, s])

  // ── Pro status ───────────────────────────────────────────────────────────────
  const loadProStatus = useCallback(async () => {
    if (!user?.id) return
    const res = await fetch(`/api/profile?userId=${user.id}`)
    const data = await res.json()
    setIsPro(data?.is_pro ?? false)
  }, [user])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('pro') === 'success') {
      window.history.replaceState({}, '', '/')
      localStorage.setItem('resellsnap_sync_pro', '1')
    }
  }, [])

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

  // ── Checkout / Portal ────────────────────────────────────────────────────────
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
        setCheckoutError(data.error || s.checkoutError)
      }
    } catch {
      setCheckoutError(s.connectionError)
    }
  }, [isSignedIn, user, s])

  // ── Supabase ─────────────────────────────────────────────────────────────────
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
    return platforms
      .map((p) => {
        const prices = results.platforms[p.id]?.[condition]
        if (!prices || !prices.min || !prices.max) return null
        return { ...p, min: prices.min, max: prices.max, mid: Math.round((prices.min + prices.max) / 2) }
      })
      .filter(Boolean)
      .sort((a, b) => b.max - a.max)
  }, [results, condition, platforms])

  const getScaleForPlatform = useCallback((platform) => {
    if (!results?.platforms?.[platform]) return []
    return conditions.map((c) => {
      const prices = results.platforms[platform][c.id]
      return prices ? { ...c, mid: Math.round((prices.min + prices.max) / 2) } : null
    }).filter(Boolean)
  }, [results, conditions])

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-brand-bg flex flex-col">

      <Onboarding />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="text-white px-4 h-14 flex items-center justify-between sticky top-0 z-20 flex-shrink-0" style={{ background: '#0F172A', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="ResellSnap" className="w-8 h-8 rounded-lg flex-shrink-0" />
          <span className="font-extrabold text-lg tracking-tight">ResellSnap</span>
          {isPro && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: '#2563EB', color: 'white' }}>
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
              <span>{s.newPhoto}</span>
            </button>
          )}
          {isSignedIn && (
            <button
              onClick={() => { loadHistory(); setShowHistory(true) }}
              className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
            >
              {s.history}
            </button>
          )}
          {isPro && (
            <button
              onClick={handlePortal}
              className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
            >
              {s.subscription}
            </button>
          )}
          {!isPro && (
            <button
              onClick={() => setShowPricing(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95"
              style={{ background: '#2563EB', color: 'white' }}
            >
              ✦ Pro
            </button>
          )}
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <SignInButton mode="modal">
              <button className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition-all cursor-pointer">
                {s.signIn}
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
              <h2 className="text-xl font-bold text-brand-fg">{s.paywallTitle}</h2>
              <p className="text-sm text-brand-subtle leading-relaxed">
                {s.paywallDesc1}<br />
                {s.paywallDesc2}
              </p>
            </div>

            <div className="bg-brand-fg rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ResellSnap Pro</p>
              <ul className="text-sm text-slate-200 space-y-1.5">
                {s.proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>

              {waitlistState === 'done' ? (
                <div className="bg-green-500/20 rounded-xl p-3 text-center text-sm text-green-300 font-medium">
                  {s.addedToWaitlist}
                </div>
              ) : (
                <form onSubmit={handleWaitlist} className="flex flex-col gap-2 mt-1">
                  <input
                    type="email"
                    placeholder={s.emailPlaceholder}
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
                      {s.goPro}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={waitlistState === 'loading'}
                      className="w-full py-3 bg-brand-accent text-white rounded-xl font-semibold text-sm cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-60"
                    >
                      {waitlistState === 'loading' ? s.sending : s.joinWaitlist}
                    </button>
                  )}
                  {waitlistState === 'error' && (
                    <p className="text-xs text-red-400 text-center">{s.waitlistError}</p>
                  )}
                </form>
              )}
            </div>

            {!isSignedIn && (
              <div className="text-center">
                <p className="text-xs text-brand-subtle mb-2">{s.alreadyAccount}</p>
                <SignInButton mode="modal">
                  <button className="text-sm font-semibold text-brand-accent cursor-pointer hover:underline">
                    {s.signInManage}
                  </button>
                </SignInButton>
              </div>
            )}

            <button
              onClick={() => setShowPaywall(false)}
              className="text-sm text-brand-subtle text-center py-1 cursor-pointer hover:text-brand-fg transition-colors"
            >
              {s.back}
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
              <h2 className="text-xl font-extrabold text-brand-fg">{s.choosePlan}</h2>
              <p className="text-sm text-brand-subtle mt-1">{s.noCommitment}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Free */}
              <div className="rounded-2xl border-2 border-brand-border p-4 flex flex-col gap-2">
                <p className="text-xs font-bold text-brand-subtle uppercase tracking-wider">Free</p>
                <p className="text-2xl font-extrabold text-brand-fg">{s.freePrice}</p>
                <p className="text-[11px] text-brand-subtle">{s.forever}</p>
                <div className="border-t border-brand-border my-1" />
                <ul className="text-xs text-brand-secondary space-y-1.5">
                  <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> {s.analysesPerMonth}</li>
                  <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> {s.sixPlatforms}</li>
                  <li className="flex items-center gap-1.5"><span className="text-slate-300">✗</span> {s.historyLabel}</li>
                  <li className="flex items-center gap-1.5"><span className="text-slate-300">✗</span> {s.noLimitsLabel}</li>
                </ul>
              </div>

              {/* Pro */}
              <div className="rounded-2xl border-2 p-4 flex flex-col gap-2 relative overflow-hidden" style={{ borderColor: '#2563EB', background: '#F0F6FF' }}>
                <div className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#2563EB' }}>✦ PRO</div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2563EB' }}>Pro</p>
                <p className="text-2xl font-extrabold text-brand-fg">{s.proPrice}</p>
                <p className="text-[11px] text-brand-subtle">{s.perMonth}</p>
                <div className="border-t border-blue-100 my-1" />
                <ul className="text-xs text-brand-secondary space-y-1.5">
                  <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> {s.unlimited}</li>
                  <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> {s.sixPlatforms}</li>
                  <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> {s.historyLabel}</li>
                  <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> {s.noLimitsLabel}</li>
                </ul>
              </div>
            </div>

            {isSignedIn ? (
              <>
                <button
                  onClick={handleCheckout}
                  className="w-full py-4 text-white font-bold rounded-2xl text-base cursor-pointer active:scale-[0.98] transition-transform"
                  style={{ background: '#2563EB', boxShadow: 'none' }}
                >
                  {s.goProBtn}
                </button>
                {checkoutError && <p className="text-xs text-red-500 text-center -mt-2">{checkoutError}</p>}
              </>
            ) : (
              <SignInButton mode="modal">
                <button className="w-full py-4 text-white font-bold rounded-2xl text-base cursor-pointer active:scale-[0.98] transition-transform" style={{ background: '#2563EB' }}>
                  {s.signInSubscribe}
                </button>
              </SignInButton>
            )}

            <button
              onClick={() => setShowPricing(false)}
              className="text-sm text-brand-subtle text-center py-1 cursor-pointer hover:text-brand-fg transition-colors"
            >
              {s.notNow}
            </button>
          </div>
        </div>
      )}

      {/* ── History modal ──────────────────────────────────────────────────── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex flex-col bg-brand-bg max-w-md mx-auto">
          <div className="flex items-center justify-between px-4 h-14 border-b border-brand-border bg-white flex-shrink-0">
            <h2 className="font-bold text-brand-fg text-base">{s.myAnalyses}</h2>
            <button onClick={() => setShowHistory(false)} className="text-sm text-brand-subtle hover:text-brand-fg cursor-pointer px-2 py-1">
              {s.close}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-20">
                <p className="text-4xl">📷</p>
                <p className="font-semibold text-brand-fg">{s.noAnalyses}</p>
                <p className="text-sm text-brand-subtle">{s.noAnalysesDesc}</p>
              </div>
            ) : history.map((scan) => {
              const condPrices = scan.platforms?.[scan.best_platform]?.[scan.condition]
              const mid = condPrices ? Math.round((condPrices.min + condPrices.max) / 2) : null
              const platform = platforms.find(p => p.id === scan.best_platform)
              return (
                <div key={scan.id} className="bg-white rounded-2xl border border-brand-border p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                    style={{ backgroundColor: platform?.color || '#64748B' }}>
                    {platform?.abbr || '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-brand-fg truncate">{scan.item_name}</p>
                    <p className="text-xs text-brand-subtle">{scan.category} · {conditions.find(c => c.id === scan.condition)?.label ?? scan.condition}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {mid ? <p className="font-bold text-sm text-brand-fg">~{curr}{mid}</p> : null}
                    <p className="text-[10px] text-brand-subtle">{new Date(scan.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' })}</p>
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
                <span className="text-xs font-semibold text-blue-700">{s.realtimeAI}</span>
              </div>
              <h1 className="text-[28px] font-extrabold text-brand-fg leading-tight tracking-tight">
                {s.heroLine1}<br />
                <span className="gradient-text">{s.heroLine2}</span>
              </h1>
              <p className="text-brand-subtle text-sm leading-relaxed max-w-xs mx-auto">
                {s.heroDesc}
              </p>
            </div>

            {/* Camera button */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative w-40 h-40 rounded-full flex flex-col items-center justify-center gap-3 active:scale-95 transition-all duration-150 cursor-pointer"
                style={{ background: '#0F172A' }}
                aria-label={s.photograph}
              >
                <span className="btn-camera-ring" />
                <span className="btn-camera-ring-2" />
                <CameraIcon size={44} />
                <span className="text-sm font-bold tracking-wide text-white">{s.photograph}</span>
              </button>
              <p className="text-xs text-brand-subtle">{s.tapGallery}</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="sr-only"
              aria-label={s.photograph}
            />

            {/* Platform grid */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-[11px] text-brand-subtle font-semibold uppercase tracking-widest">{s.pricesOn6}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {platforms.map((p) => (
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
              <p className="text-xs font-bold text-brand-subtle uppercase tracking-widest">{s.howItWorks}</p>
              {s.steps.map(({ step, icon, title, desc }, i) => (
                <div key={i} className="flex items-start gap-3">
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
                ? <span className="font-semibold text-brand-accent">{s.proBadge}</span>
                : <><span className="font-semibold text-brand-fg">{s.freeAnalyses}</span> {s.freePerPeriod}</>
              }
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STAGE 2 — PREVIEW
        ════════════════════════════════════════════════════════════ */}
        {stage === 'preview' && imagePreview && (
          <div className="flex-1 flex flex-col">
            <div className="relative bg-black">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full aspect-square object-cover opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>

            <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto">
              {error && (
                <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl p-3.5 text-sm text-red-700 font-medium">
                  {error}
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-brand-subtle uppercase tracking-wider mb-3">
                  {s.conditionLabel}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {conditions.map((c) => (
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

              <button
                onClick={handleAnalyze}
                className="w-full py-4 bg-brand-accent text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md shadow-blue-600/25 cursor-pointer"
              >
                <span>{s.analyzeBtn}</span>
                <ArrowIcon />
              </button>

              <p className="text-center text-[11px] text-brand-subtle leading-relaxed">
                {getRemainingUses()} {s.remainingPre} {MONTHLY_LIMIT} {s.remainingPost}
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
                alt="Analyzing"
                className="w-full aspect-square object-cover opacity-40"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative w-48 h-48">
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-400 rounded-tl-sm" />
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-400 rounded-tr-sm" />
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-400 rounded-bl-sm" />
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-400 rounded-br-sm" />
                  <div className="scan-line" />
                </div>
                <div className="mt-8 text-center">
                  <p className="text-white font-semibold text-lg">{s.identifying}</p>
                  <p className="text-white/60 text-sm mt-1">{s.checkingPrices}</p>
                </div>
              </div>
            </div>

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
          const maxMid = Math.max(...(scaleData.map((sc) => sc.mid) || [1]))
          const maxMax = prices.length > 0 ? Math.max(...prices.map((p) => p.max)) : 1

          return (
            <div className="flex-1 flex flex-col pb-8">
              {/* Item hero */}
              <div className="relative bg-black">
                <img src={imagePreview} alt={results.item_name} className="w-full aspect-video object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-fg via-brand-fg/30 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
                    {results.category || 'Item'}
                  </p>
                  <h2 className="text-white font-bold text-xl leading-snug">
                    {results.item_name}
                  </h2>
                  {results.confidence === 'high' && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <StarIcon />
                      <span className="text-yellow-300 text-xs font-medium">{s.highConfidence}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 flex flex-col gap-5">

                {/* ── Condition selector ─────────────────────────────────── */}
                <div>
                  <p className="text-xs font-semibold text-brand-subtle uppercase tracking-wider mb-2">{s.conditionLabelResults}</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                    {conditions.map((c) => (
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
                  <p className="text-xs font-semibold text-brand-subtle uppercase tracking-wider mb-2">{s.resalePrices}</p>
                  <div className="flex flex-col gap-2">
                    {prices.length === 0 ? (
                      <p className="text-sm text-brand-subtle text-center py-4">{s.noData}</p>
                    ) : prices.map((p, i) => (
                      <div
                        key={p.id}
                        className={`bg-white rounded-2xl p-4 flex items-center gap-3 animate-fade-up ${
                          i === 0 ? 'ring-2 ring-brand-accent' : 'border border-brand-border'
                        }`}
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: p.color }}
                          aria-label={p.name}
                        >
                          {p.abbr}
                        </div>

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
                                  {s.topPrice}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-brand-fg font-bold text-base">
                              {curr}{p.min} – {curr}{p.max}
                            </span>
                            <span className="text-brand-subtle text-xs">
                              ~{curr}{p.mid}
                            </span>
                          </div>

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

                {/* ── Pricing scale ──────────────────────────────────────── */}
                {scaleData.length > 1 && (() => {
                  const bestP = platforms.find((p) => p.id === bestPlatform)
                  return (
                    <div className="bg-white rounded-2xl p-4 border border-brand-border">
                      <p className="text-xs font-semibold text-brand-subtle uppercase tracking-wider mb-1">
                        {s.priceScaleLabel} — {bestP?.name || bestPlatform}
                      </p>
                      <p className="text-xs text-brand-subtle mb-3">{s.conditionImpact}</p>
                      <div className="space-y-2.5">
                        {scaleData.map((sc) => (
                          <div key={sc.id} className="flex items-center gap-3">
                            <span className={`text-xs font-medium w-24 flex-shrink-0 ${
                              sc.id === condition ? 'text-brand-accent font-semibold' : 'text-brand-secondary'
                            }`}>
                              {sc.label}
                            </span>
                            <div className="flex-1 h-2 bg-brand-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${Math.max(5, (sc.mid / maxMid) * 100)}%`,
                                  backgroundColor: sc.id === condition ? '#2563EB' : '#CBD5E1',
                                }}
                              />
                            </div>
                            <span className={`text-sm font-bold w-14 text-right flex-shrink-0 ${
                              sc.id === condition ? 'text-brand-accent' : 'text-brand-secondary'
                            }`}>
                              ~{curr}{sc.mid}
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
                      {s.aiTip}
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
                  <span>{s.analyzeAnother}</span>
                </button>

                <p className="text-center text-[11px] text-brand-subtle leading-relaxed">
                  {s.disclaimer}
                </p>
              </div>
            </div>
          )
        })()}

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="flex-shrink-0 py-4 px-5 flex justify-center gap-5 border-t border-brand-border">
        <a href="/privacidad" className="text-xs text-brand-subtle hover:text-brand-fg transition-colors">{s.privacy}</a>
        <a href="/terminos" className="text-xs text-brand-subtle hover:text-brand-fg transition-colors">{s.terms}</a>
        <a href="mailto:soporte@resellsnap.es" className="text-xs text-brand-subtle hover:text-brand-fg transition-colors">{s.contact}</a>
      </footer>

    </div>
  )
}
