'use client'

import { useState, useEffect } from 'react'

export default function InstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = window.navigator.standalone === true
    const dismissed = localStorage.getItem('resellsnap_install_dismissed')
    if (isIOS && !isStandalone && !dismissed) {
      // Show after 30s so no interrumpe el onboarding
      const t = setTimeout(() => setShow(true), 30000)
      return () => clearTimeout(t)
    }
  }, [])

  if (!show) return null

  function dismiss() {
    localStorage.setItem('resellsnap_install_dismissed', '1')
    setShow(false)
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto">
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-start gap-3 shadow-2xl border border-white/10">
        <img src="/icon.png" alt="ResellSnap" className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Añadir a inicio</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-snug">
            Toca <span className="inline-flex items-center gap-0.5 text-blue-400 font-medium">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              Compartir
            </span> y luego <strong className="text-white">"Añadir a inicio"</strong>
          </p>
        </div>
        <button onClick={dismiss} className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1 flex-shrink-0" aria-label="Cerrar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
