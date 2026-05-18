'use client'

import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'resellsnap_onboarded'

const SLIDES = [
  {
    image: '/onboarding-1.png',
    title: 'Fotografía cualquier artículo',
    desc: 'Haz una foto de tu prenda, sneaker o accesorio. La IA lo identifica al instante.',
  },
  {
    image: '/onboarding-2.png',
    title: 'La IA analiza el mercado',
    desc: 'Identificamos marca, modelo y condición para buscar el precio real de reventa.',
  },
  {
    image: '/onboarding-3.png',
    title: 'Precios en 6 plataformas',
    desc: 'StockX, GOAT, Vinted, Depop, Wallapop y eBay. De un vistazo, sin buscar manualmente.',
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
      className="fixed inset-0 z-50 flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Preload all images, only show active */}
      {SLIDES.map((sl, i) => (
        <img
          key={sl.image}
          src={sl.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: i === slide ? 1 : 0 }}
        />
      ))}

      {/* Gradient overlay — stronger at bottom for text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />

      {/* Skip */}
      <button
        onClick={finish}
        className="absolute top-5 right-5 text-xs text-white/50 hover:text-white transition-colors cursor-pointer z-10"
      >
        Omitir
      </button>

      {/* Bottom content */}
      <div className="relative z-10 mt-auto px-6 pb-12 flex flex-col items-center gap-6">
        <div className="text-center space-y-3 max-w-xs">
          <h2 className="text-2xl font-extrabold text-white leading-tight">{s.title}</h2>
          <p className="text-base text-white/70 leading-relaxed">{s.desc}</p>
        </div>

        {/* Dots */}
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
          className="w-full max-w-xs py-4 rounded-2xl font-bold text-base cursor-pointer active:scale-[0.98] transition-transform text-white"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
        >
          {isLast ? 'Empezar' : 'Siguiente'}
        </button>
      </div>
    </div>
  )
}
