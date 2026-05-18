'use client'

import { useState, useRef, useCallback } from 'react'

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
  const fileInputRef = useRef(null)

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
      setResults(data)
      setCondition(condition)
      setStage('results')
    } catch (err) {
      setError(err.message)
      setStage('preview')
    }
  }, [imageData, condition])

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setStage('capture')
    setImageData(null)
    setImagePreview(null)
    setResults(null)
    setError(null)
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

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-brand-primary text-white px-4 h-14 flex items-center justify-between sticky top-0 z-20 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <LogoIcon />
          </div>
          <span className="font-bold text-lg tracking-tight">ResellSnap</span>
        </div>
        {stage !== 'capture' && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-white/10"
          >
            <RefreshIcon />
            <span>Nueva foto</span>
          </button>
        )}
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col max-w-md mx-auto w-full">

        {/* ════════════════════════════════════════════════════════════
            STAGE 1 — CAPTURE
        ════════════════════════════════════════════════════════════ */}
        {stage === 'capture' && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-8">
            {/* Hero text */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-brand-fg leading-snug">
                ¿Cuánto vale tu artículo?
              </h1>
              <p className="text-brand-subtle text-sm leading-relaxed max-w-xs mx-auto">
                Haz una foto y descubre el precio de reventa en todas las plataformas — al instante.
              </p>
            </div>

            {/* Camera button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-44 h-44 rounded-full bg-brand-primary text-white flex flex-col items-center justify-center gap-3 shadow-2xl shadow-slate-900/30 active:scale-95 transition-all duration-150 cursor-pointer group"
              aria-label="Hacer foto o elegir imagen"
            >
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full bg-brand-primary opacity-30 scale-110 animate-ping pointer-events-none" />
              <CameraIcon size={52} />
              <span className="text-sm font-semibold tracking-wide">Fotografiar</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="sr-only"
              aria-label="Seleccionar imagen"
            />

            {/* Platforms pill row */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs text-brand-subtle font-medium uppercase tracking-wider">Precios en</p>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {PLATFORMS.map((p) => (
                  <span
                    key={p.id}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-brand-border text-brand-secondary"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Feature hints */}
            <div className="grid grid-cols-3 gap-3 w-full text-center">
              {[
                { label: '6 plataformas', sub: 'en un vistazo' },
                { label: 'IA experta', sub: 'en reventa' },
                { label: 'Escala precio', sub: 'por condición' },
              ].map((f) => (
                <div key={f.label} className="bg-white rounded-2xl p-3 border border-brand-border">
                  <p className="font-semibold text-xs text-brand-fg">{f.label}</p>
                  <p className="text-[10px] text-brand-subtle mt-0.5">{f.sub}</p>
                </div>
              ))}
            </div>
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

              {/* Disclaimer */}
              <p className="text-center text-[11px] text-brand-subtle leading-relaxed">
                Los precios son estimaciones orientativas basadas en datos de mercado.
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
    </div>
  )
}
