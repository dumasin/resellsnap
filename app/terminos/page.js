export const metadata = {
  title: 'Términos de Uso – ResellSnap',
}

export default function Terminos() {
  return (
    <div className="min-h-screen bg-white max-w-2xl mx-auto px-5 py-12">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Términos de Uso</h1>
      <p className="text-sm text-slate-500 mb-8">Última actualización: 18 de mayo de 2026</p>

      <section className="space-y-8 text-sm text-slate-700 leading-relaxed">

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">1. Aceptación</h2>
          <p>Al acceder o usar ResellSnap (<strong>resellsnap.vercel.app</strong>), aceptas estos Términos. Si no estás de acuerdo, no uses el servicio. El servicio es operado por Tomás Barril Ríos.</p>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">2. Descripción del servicio</h2>
          <p>ResellSnap es una aplicación web que utiliza inteligencia artificial para estimar precios de reventa de prendas y calzado en distintas plataformas (StockX, GOAT, Vinted, Depop, Wallapop, eBay). Los precios son <strong>estimaciones orientativas</strong> y pueden diferir de los precios reales de mercado.</p>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">3. Plan gratuito y plan Pro</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Plan gratuito:</strong> 5 análisis diarios sin coste.</li>
            <li><strong>Plan Pro:</strong> análisis ilimitados e historial por 7 € al mes. El cobro es recurrente mensual a través de Stripe.</li>
            <li>Puedes cancelar tu suscripción en cualquier momento desde el portal de cliente. El acceso Pro se mantiene hasta el final del período ya pagado.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">4. Política de reembolso</h2>
          <p>Ofrecemos reembolso completo dentro de los <strong>7 días</strong> siguientes al primer cargo si el servicio no funciona correctamente. Fuera de ese plazo, no se realizan reembolsos por períodos ya consumidos. Para solicitar un reembolso escríbenos a <a href="mailto:soporte@resellsnap.app" className="text-blue-600 hover:underline">soporte@resellsnap.app</a>.</p>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">5. Uso aceptable</h2>
          <p>El servicio es para uso personal. Queda prohibido:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Uso automatizado o masivo de la API (bots, scrapers).</li>
            <li>Revender o redistribuir el servicio.</li>
            <li>Subir imágenes con contenido ilegal o que infrinjan derechos de terceros.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">6. Exactitud de los precios</h2>
          <p>Los precios generados por IA son <strong>estimaciones</strong>. ResellSnap no garantiza su exactitud ni se responsabiliza de decisiones de compra, venta o inversión tomadas a partir de ellos.</p>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">7. Disponibilidad del servicio</h2>
          <p>ResellSnap se presta "tal cual". No garantizamos disponibilidad ininterrumpida. Podemos modificar o interrumpir el servicio con un preaviso razonable.</p>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">8. Propiedad intelectual</h2>
          <p>El código, diseño y marca de ResellSnap son propiedad de Tomás Barril Ríos. Las imágenes que subes son tuyas — no reclamamos ningún derecho sobre ellas.</p>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">9. Legislación aplicable</h2>
          <p>Estos términos se rigen por la legislación española. Para cualquier disputa, las partes se someten a los juzgados y tribunales del domicilio del usuario, salvo que la ley disponga otro fuero.</p>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">10. Contacto</h2>
          <p><a href="mailto:soporte@resellsnap.app" className="text-blue-600 hover:underline">soporte@resellsnap.app</a></p>
        </div>

      </section>

      <div className="mt-12 pt-6 border-t border-slate-200">
        <a href="/" className="text-sm text-blue-600 hover:underline">← Volver a ResellSnap</a>
      </div>
    </div>
  )
}
