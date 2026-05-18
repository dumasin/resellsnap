'use client'

import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'resellsnap_onboarded'

const SLIDES = [
  {
    emoji: '📷',
    title: 'Fotografía cualquier artículo',
    desc: 'Haz una foto de tu prenda, sneaker o accesorio. La IA lo identifica al instante.',
    bg: 'from-slate-900 to-blue-950',
  },
  {
    emoji: '🤖',
    title: 'La IA analiza el mercado',
    desc: 'Identificamos marca, modelo y condición para buscar el precio real de reventa.',
    bg: 'from-blue-950 to-violet-950',
  },
  {
    emoji: '💶',
    title: 'Precios en 6 plataformas',
    desc: 'StockX, GOAT, Vinted, Depop, Wallapop y eBay. De un vistazo, sin buscar manualmente.',
    bg: 'from-violet-950 to-slate-900',
  },
]

export default function Onboarding() {
  const [visible, setVisible] = useState(false)
  const [slide, setSlide] = useState(0)
  const touchStartX = useRef(null)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  function finish() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  function next() {
    if (slide < SLIDES.length - 1) setSlide(s => s + 1)
    else finish()
  }

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 50) next()
    else if (diff < -50 && slide > 0) setSlide(s => s - 1)
    touchStartX.current = null
  }

  if (!visible) return null

  const s = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between px-6 pt-16 pb-12 bg-gradient-to-b ${s.bg} transition-all duration-500`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Skip */}
      <button
        onClick={finish}
        className="absolute top-5 right-5 text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
      >
        Omitir
      </button>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 max-w-xs">
        <div className="text-7xl">{s.emoji}</div>
        <h2 className="text-2xl font-extrabold text-white leading-tight">{s.title}</h2>
        <p className="text-base text-white/70 leading-relaxed">{s.desc}</p>
      </div>

      {/* Dots + CTA */}
      <div className="flex flex-col items-center gap-6 w-full max-w-xs">
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                i === slide ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/30'
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-full py-4 rounded-2xl font-bold text-base cursor-pointer active:scale-[0.98] transition-transform text-white"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
        >
          {isLast ? 'Empezar' : 'Siguiente'}
        </button>
      </div>
    </div>
  )
}
