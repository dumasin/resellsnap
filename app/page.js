'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser, SignInButton, UserButton } from '@clerk/nextjs'
import { useSupabase } from '../lib/supabase'
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
    signIn: 'Entrar',
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
    heroLabel: 'Reventa inteligente',
    heroLine1: 'Precio de reventa',
    heroLine2: 'al instante.',
    heroDesc: 'Fotografía cualquier sneaker o prenda y obtén precios reales en 6 plataformas.',
    uploadTitle: 'Subir foto',
    uploadDesc: 'Sneakers, ropa, accesorios',
    pricesOn6: 'Precios en 6 plataformas',
    howItWorks: 'Cómo funciona',
    steps: [
      { title: 'Fotografía el artículo', desc: 'Una foto clara desde cualquier ángulo' },
      { title: 'La IA lo identifica', desc: 'Marca, modelo y valor de mercado actual' },
      { title: 'Obtén los precios', desc: 'Estimaciones en StockX, Vinted, Depop y más' },
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
    statPlatforms: 'plataformas',
    statAnalysis: 'análisis IA',
    statFree: 'gratis',
    statFreeSub: '5 al mes',
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
    heroLabel: 'Smart reselling',
    heroLine1: 'Resale price',
    heroLine2: 'in seconds.',
    heroDesc: 'Photograph any sneaker or clothing and get real prices across 6 platforms.',
    uploadTitle: 'Upload photo',
    uploadDesc: 'Sneakers, clothing, accessories',
    pricesOn6: 'Prices on 6 platforms',
    howItWorks: 'How it works',
    steps: [
      { title: 'Photograph the item', desc: 'A clear photo from any angle' },
      { title: 'AI identifies it', desc: 'Brand, model and current market value' },
      { title: 'Get the prices', desc: 'Estimates on StockX, Grailed, Depop and more' },
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
    statPlatforms: 'platforms',
    statAnalysis: 'AI analysis',
    statFree: 'free',
    statFreeSub: '5 per month',
  },
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconCamera({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function IconRefresh({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  )
}

function IconArrow({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function IconChevron({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function IconStar({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function IconPhoto({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function IconSpark({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
    </svg>
  )
}

function IconTag({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
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
  const supabase = useSupabase()

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
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', 0.8)
        setImageData(compressed); setImagePreview(compressed); setStage('preview')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }, [])

  // ── Analyze ─────────────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!isPro && getRemainingUses() <= 0) { setShowPaywall(true); return }
    setStage('analyzing'); setError(null)
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
      incrementUsage(); setResults(data); setCondition(condition); setStage('results'); saveScan(data, condition)
    } catch (err) {
      setError(err.message); setStage('preview')
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email }),
      }).then(r => r.json()).then(data => { if (data.is_pro) setIsPro(true) }).catch(() => {})
    }
  }, [isSignedIn, user, loadProStatus])

  // ── Checkout / Portal ────────────────────────────────────────────────────────
  const handlePortal = useCallback(async () => {
    if (!user?.id) return
    const res = await fetch('/api/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) })
    const { url } = await res.json()
    if (url) window.location.href = url
  }, [user])

  const handleCheckout = useCallback(async () => {
    if (!isSignedIn) return
    setCheckoutError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.primaryEmailAddress?.emailAddress }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url }
      else { setCheckoutError(data.error || s.checkoutError) }
    } catch { setCheckoutError(s.connectionError) }
  }, [isSignedIn, user, s])

  // ── Supabase ─────────────────────────────────────────────────────────────────
  const saveScan = useCallback(async (data, cond) => {
    if (!user?.id) return
    const { error } = await supabase.from('scans').insert({
      user_id: user.id, item_name: data.item_name, brand: data.brand,
      category: data.category, confidence: data.confidence, condition: cond,
      platforms: data.platforms, best_platform: data.best_platform, tip: data.tip,
    })
    if (error) console.error('[saveScan] insert failed:', error)
  }, [user, supabase])

  const loadHistory = useCallback(async () => {
    if (!user?.id) return
    const { data, error } = await supabase.from('scans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30)
    if (error) console.error('[loadHistory] select failed:', error)
    if (data) setHistory(data)
  }, [user, supabase])

  // ── Waitlist ────────────────────────────────────────────────────────────────
  const handleWaitlist = useCallback(async (e) => {
    e.preventDefault()
    if (!waitlistEmail) return
    setWaitlistState('loading')
    try {
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: waitlistEmail }) })
      setWaitlistState(res.ok ? 'done' : 'error')
    } catch { setWaitlistState('error') }
  }, [waitlistEmail])

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setStage('capture'); setImageData(null); setImagePreview(null)
    setResults(null); setError(null); setShowPaywall(false); setCondition('like_new')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getPricesForCondition = useCallback(() => {
    if (!results?.platforms) return []
    return platforms.map((p) => {
      const prices = results.platforms[p.id]?.[condition]
      if (!prices || !prices.min || !prices.max) return null
      return { ...p, min: prices.min, max: prices.max, mid: Math.round((prices.min + prices.max) / 2) }
    }).filter(Boolean).sort((a, b) => b.max - a.max)
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
    <div className="min-h-dvh bg-[#F8FAFC] flex flex-col">

      <Onboarding />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 z-20 flex-shrink-0 bg-[#0F172A]">
        <div className="flex items-center gap-2.5">
          <img src="/icon.png" alt="ResellSnap" className="w-7 h-7 rounded-lg flex-shrink-0" />
          <span className="font-bold text-white text-[15px] tracking-tight">ResellSnap</span>
          {isPro && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/20">
              Pro
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {stage !== 'capture' && (
            <button onClick={handleReset} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-white/8">
              <IconRefresh size={14} />
              <span>{s.newPhoto}</span>
            </button>
          )}
          {isSignedIn && (
            <button onClick={() => { loadHistory(); setShowHistory(true) }} className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/8 transition-all cursor-pointer">
              {s.history}
            </button>
          )}
          {isPro && (
            <button onClick={handlePortal} className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/8 transition-all cursor-pointer">
              {s.subscription}
            </button>
          )}
          {!isPro && (
            <button onClick={() => setShowPricing(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95 bg-blue-600 text-white hover:bg-blue-500">
              Pro
            </button>
          )}
          {isSignedIn ? (
            <div className="ml-1"><UserButton afterSignOutUrl="/" /></div>
          ) : (
            <SignInButton mode="modal">
              <button className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/8 transition-all cursor-pointer ml-1">
                {s.signIn}
              </button>
            </SignInButton>
          )}
        </div>
      </header>

      {/* ── Paywall modal ──────────────────────────────────────────────────── */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 flex flex-col gap-5 animate-fade-up">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{s.paywallTitle}</h2>
              <p className="text-sm text-slate-500 leading-relaxed">{s.paywallDesc1}<br />{s.paywallDesc2}</p>
            </div>
            <div className="bg-slate-900 rounded-2xl p-5 flex flex-col gap-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">ResellSnap Pro</p>
              <ul className="space-y-2">
                {s.proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-200">
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              {waitlistState === 'done' ? (
                <div className="bg-green-500/15 rounded-xl p-3 text-center text-sm text-green-400 font-medium">{s.addedToWaitlist}</div>
              ) : (
                <form onSubmit={handleWaitlist} className="flex flex-col gap-2 mt-1">
                  <input type="email" placeholder={s.emailPlaceholder} value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)} required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/8 text-white placeholder-slate-500 text-sm border border-white/10 focus:outline-none focus:border-blue-500/50" />
                  {isSignedIn ? (
                    <button type="button" onClick={handleCheckout} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm cursor-pointer active:scale-[0.98] transition-all">
                      {s.goPro}
                    </button>
                  ) : (
                    <button type="submit" disabled={waitlistState === 'loading'} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-50">
                      {waitlistState === 'loading' ? s.sending : s.joinWaitlist}
                    </button>
                  )}
                  {waitlistState === 'error' && <p className="text-xs text-red-400 text-center">{s.waitlistError}</p>}
                </form>
              )}
            </div>
            {!isSignedIn && (
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1.5">{s.alreadyAccount}</p>
                <SignInButton mode="modal">
                  <button className="text-sm font-semibold text-blue-600 cursor-pointer hover:underline">{s.signInManage}</button>
                </SignInButton>
              </div>
            )}
            <button onClick={() => setShowPaywall(false)} className="text-sm text-slate-400 text-center py-1 cursor-pointer hover:text-slate-700 transition-colors">{s.back}</button>
          </div>
        </div>
      )}

      {/* ── Pricing modal ──────────────────────────────────────────────────── */}
      {showPricing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 flex flex-col gap-5 animate-fade-up">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900">{s.choosePlan}</h2>
              <p className="text-sm text-slate-400 mt-1">{s.noCommitment}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex flex-col gap-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Free</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{s.freePrice}</p>
                <p className="text-[11px] text-slate-400">{s.forever}</p>
                <div className="border-t border-slate-100 my-1" />
                <ul className="text-xs text-slate-500 space-y-1.5">
                  <li className="flex items-center gap-1.5"><span className="text-slate-300">—</span> {s.analysesPerMonth}</li>
                  <li className="flex items-center gap-1.5"><span className="text-slate-300">—</span> {s.sixPlatforms}</li>
                  <li className="flex items-center gap-1.5 line-through opacity-40"><span>—</span> {s.historyLabel}</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-3 right-3 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white tracking-wide">PRO</div>
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">Pro</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{s.proPrice}</p>
                <p className="text-[11px] text-slate-400">{s.perMonth}</p>
                <div className="border-t border-blue-100 my-1" />
                <ul className="text-xs text-slate-700 space-y-1.5">
                  <li className="flex items-center gap-1.5"><span className="text-blue-500">✓</span> {s.unlimited}</li>
                  <li className="flex items-center gap-1.5"><span className="text-blue-500">✓</span> {s.sixPlatforms}</li>
                  <li className="flex items-center gap-1.5"><span className="text-blue-500">✓</span> {s.historyLabel}</li>
                </ul>
              </div>
            </div>
            {isSignedIn ? (
              <>
                <button onClick={handleCheckout} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-base cursor-pointer active:scale-[0.98] transition-all">
                  {s.goProBtn}
                </button>
                {checkoutError && <p className="text-xs text-red-500 text-center -mt-2">{checkoutError}</p>}
              </>
            ) : (
              <SignInButton mode="modal">
                <button className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl text-base cursor-pointer active:scale-[0.98] transition-transform">
                  {s.signInSubscribe}
                </button>
              </SignInButton>
            )}
            <button onClick={() => setShowPricing(false)} className="text-sm text-slate-400 text-center py-1 cursor-pointer hover:text-slate-700 transition-colors">{s.notNow}</button>
          </div>
        </div>
      )}

      {/* ── History modal ──────────────────────────────────────────────────── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F8FAFC] max-w-md mx-auto">
          <div className="flex items-center justify-between px-4 h-14 border-b border-slate-100 bg-white flex-shrink-0">
            <h2 className="font-bold text-slate-900 text-base">{s.myAnalyses}</h2>
            <button onClick={() => setShowHistory(false)} className="text-sm text-slate-400 hover:text-slate-700 cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">{s.close}</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-20">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <IconCamera size={24} className="text-slate-300" />
                </div>
                <p className="font-semibold text-slate-700">{s.noAnalyses}</p>
                <p className="text-sm text-slate-400">{s.noAnalysesDesc}</p>
              </div>
            ) : history.map((scan) => {
              const condPrices = scan.platforms?.[scan.best_platform]?.[scan.condition]
              const mid = condPrices ? Math.round((condPrices.min + condPrices.max) / 2) : null
              const platform = platforms.find(p => p.id === scan.best_platform)
              return (
                <div key={scan.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ backgroundColor: platform?.color || '#64748B' }}>
                    {platform?.abbr || '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">{scan.item_name}</p>
                    <p className="text-xs text-slate-400">{scan.category} · {conditions.find(c => c.id === scan.condition)?.label ?? scan.condition}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {mid ? <p className="font-bold text-sm text-slate-900">~{curr}{mid}</p> : null}
                    <p className="text-[10px] text-slate-400">{new Date(scan.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' })}</p>
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
          <div className="flex-1 flex flex-col overflow-y-auto">

            {/* ── Hero ────────────────────────────────────────────────── */}
            <div className="px-5 pt-8 pb-2">
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-400 mb-4">{s.heroLabel}</p>
              <h1 className="text-[42px] font-black tracking-tighter leading-[1.0] text-slate-900 mb-3">
                {s.heroLine1}<br />
                <span className="text-blue-600">{s.heroLine2}</span>
              </h1>
              <p className="text-[14px] text-slate-400 leading-relaxed max-w-[30ch]">{s.heroDesc}</p>
            </div>

            {/* ── Platform strip ──────────────────────────────────────── */}
            <div className="flex gap-2 px-5 py-4 overflow-x-auto scrollbar-none">
              {platforms.map((p) => (
                <div key={p.id} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-xs font-medium text-slate-600">{p.name}</span>
                </div>
              ))}
            </div>

            {/* ── Upload zone ─────────────────────────────────────────── */}
            <div className="px-5 pb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-3xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center gap-3 py-12 active:scale-[0.98] transition-all duration-200 cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 group"
                aria-label={s.uploadTitle}
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-200">
                  <IconCamera size={26} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-800 text-[15px]">{s.uploadTitle}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.uploadDesc}</p>
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="sr-only" />
            </div>

            {/* ── Stats bar ───────────────────────────────────────────── */}
            <div className="mx-5 mb-6 rounded-2xl bg-slate-900 px-5 py-4 grid grid-cols-3 divide-x divide-white/8">
              <div className="flex flex-col items-center gap-0.5 pr-4">
                <span className="text-2xl font-black text-white tracking-tighter">6</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">{s.statPlatforms}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 px-4">
                <span className="text-2xl font-black text-white tracking-tighter">IA</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">{s.statAnalysis}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 pl-4">
                <span className="text-2xl font-black text-white tracking-tighter">{s.statFree}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">{s.statFreeSub}</span>
              </div>
            </div>

            {/* ── How it works ────────────────────────────────────────── */}
            <div className="px-5 pb-10">
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-400 mb-4">{s.howItWorks}</p>
              <div className="space-y-px">
                {s.steps.map(({ title, desc }, i) => {
                  const icons = [<IconPhoto size={18} />, <IconSpark size={18} />, <IconTag size={18} />]
                  return (
                    <div key={i} className="flex items-start gap-4 bg-white px-4 py-4 first:rounded-t-2xl last:rounded-b-2xl border-x border-t last:border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0 text-white mt-0.5">
                        {icons[i]}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">{title}</p>
                        <p className="text-xs text-slate-400 leading-snug mt-0.5">{desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Free badge */}
              <p className="text-center text-xs text-slate-400 mt-6">
                {isPro
                  ? <span className="font-semibold text-blue-600">{s.proBadge}</span>
                  : <><span className="font-semibold text-slate-700">{s.freeAnalyses}</span> {s.freePerPeriod}</>
                }
              </p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STAGE 2 — PREVIEW
        ════════════════════════════════════════════════════════════ */}
        {stage === 'preview' && imagePreview && (
          <div className="flex-1 flex flex-col">
            <div className="relative bg-slate-900">
              <img src={imagePreview} alt="Preview" className="w-full aspect-square object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
            </div>
            <div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto">
              {error && (
                <div role="alert" className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600 font-medium">{error}</div>
              )}
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-400 mb-3">{s.conditionLabel}</p>
                <div className="grid grid-cols-2 gap-2">
                  {conditions.map((c) => (
                    <button key={c.id} onClick={() => setCondition(c.id)}
                      className={`p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                        condition === c.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-100 text-slate-700 hover:border-slate-300'
                      }`}>
                      <div className="font-semibold text-[13px]">{c.label}</div>
                      <div className={`text-xs mt-0.5 leading-tight ${condition === c.id ? 'text-slate-400' : 'text-slate-400'}`}>{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleAnalyze}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all cursor-pointer">
                <span>{s.analyzeBtn}</span>
                <IconArrow size={18} />
              </button>
              <p className="text-center text-[11px] text-slate-400">
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
            <div className="relative scan-container bg-slate-900">
              <img src={imagePreview} alt="Analyzing" className="w-full aspect-square object-cover opacity-30" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative w-44 h-44">
                  <span className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-blue-400 rounded-tl" />
                  <span className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-blue-400 rounded-tr" />
                  <span className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-blue-400 rounded-bl" />
                  <span className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-blue-400 rounded-br" />
                  <div className="scan-line" />
                </div>
                <div className="mt-8 text-center">
                  <p className="text-white font-bold text-lg tracking-tight">{s.identifying}</p>
                  <p className="text-white/40 text-sm mt-1">{s.checkingPrices}</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl shimmer flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-20 rounded-lg shimmer" />
                    <div className="h-4 w-28 rounded-lg shimmer" />
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
              <div className="relative bg-slate-900">
                <img src={imagePreview} alt={results.item_name} className="w-full aspect-video object-cover opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-1">{results.category || 'Item'}</p>
                  <h2 className="text-white font-black text-xl tracking-tight leading-snug">{results.item_name}</h2>
                  {results.confidence === 'high' && (
                    <div className="flex items-center gap-1 mt-2">
                      <IconStar size={10} />
                      <span className="text-yellow-400 text-xs font-semibold">{s.highConfidence}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 flex flex-col gap-6">

                {/* ── Condition selector ─────────────────────────────────── */}
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-400 mb-2">{s.conditionLabelResults}</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-none">
                    {conditions.map((c) => (
                      <button key={c.id} onClick={() => setCondition(c.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                          condition === c.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-100 text-slate-500 hover:border-slate-300'
                        }`}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Platform price cards ───────────────────────────────── */}
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-400 mb-3">{s.resalePrices}</p>
                  <div className="space-y-2">
                    {prices.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">{s.noData}</p>
                    ) : prices.map((p, i) => (
                      <div key={p.id}
                        className={`bg-white rounded-2xl p-4 flex items-center gap-3 animate-fade-up transition-all ${i === 0 ? 'ring-2 ring-blue-500' : 'border border-slate-100'}`}
                        style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ backgroundColor: p.color }}>
                          {p.abbr}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="font-semibold text-[13px] text-slate-900 truncate">{p.name}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {p.badge && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: p.bg, color: p.color }}>{p.badge}</span>
                              )}
                              {i === 0 && <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-1.5 py-0.5 rounded">{s.topPrice}</span>}
                            </div>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-slate-900 font-black text-lg tracking-tight">{curr}{p.min}–{curr}{p.max}</span>
                            <span className="text-slate-400 text-xs">~{curr}{p.mid}</span>
                          </div>
                          <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.max(8, (p.max / maxMax) * 100)}%`, backgroundColor: p.color }} />
                          </div>
                        </div>
                        <IconChevron size={14} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Price scale ─────────────────────────────────────────── */}
                {scaleData.length > 1 && (() => {
                  const bestP = platforms.find((p) => p.id === bestPlatform)
                  return (
                    <div className="bg-white rounded-2xl p-4 border border-slate-100">
                      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-400 mb-0.5">{s.priceScaleLabel} — {bestP?.name || bestPlatform}</p>
                      <p className="text-xs text-slate-400 mb-4">{s.conditionImpact}</p>
                      <div className="space-y-3">
                        {scaleData.map((sc) => (
                          <div key={sc.id} className="flex items-center gap-3">
                            <span className={`text-xs font-medium w-20 flex-shrink-0 ${sc.id === condition ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>{sc.label}</span>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(5, (sc.mid / maxMid) * 100)}%`, backgroundColor: sc.id === condition ? '#2563EB' : '#CBD5E1' }} />
                            </div>
                            <span className={`text-sm font-bold w-14 text-right flex-shrink-0 ${sc.id === condition ? 'text-blue-600' : 'text-slate-400'}`}>~{curr}{sc.mid}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* ── AI Tip ──────────────────────────────────────────────── */}
                {results.tip && (
                  <div className="bg-slate-900 rounded-2xl p-4">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">{s.aiTip}</p>
                    <p className="text-sm text-slate-200 leading-relaxed">{results.tip}</p>
                  </div>
                )}

                {/* ── Reset CTA ───────────────────────────────────────────── */}
                <button onClick={handleReset}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all cursor-pointer">
                  <IconRefresh size={16} />
                  <span>{s.analyzeAnother}</span>
                </button>

                <p className="text-center text-[11px] text-slate-400 leading-relaxed">{s.disclaimer}</p>
              </div>
            </div>
          )
        })()}

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="flex-shrink-0 py-4 px-5 flex justify-center gap-6 border-t border-slate-100">
        <a href="/privacidad" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">{s.privacy}</a>
        <a href="/terminos" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">{s.terms}</a>
        <a href="mailto:soporte@resellsnap.es" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">{s.contact}</a>
      </footer>

    </div>
  )
}
