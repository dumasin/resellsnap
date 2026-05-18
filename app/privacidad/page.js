export const metadata = {
  title: 'Política de Privacidad – ResellSnap',
}

export default function Privacidad() {
  return (
    <div className="min-h-screen bg-white max-w-2xl mx-auto px-5 py-12">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Política de Privacidad</h1>
      <p className="text-sm text-slate-500 mb-8">Última actualización: 18 de mayo de 2026</p>

      <section className="space-y-8 text-sm text-slate-700 leading-relaxed">

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">1. Responsable del tratamiento</h2>
          <p>Tomás Barril Ríos, en adelante "ResellSnap", es el responsable del tratamiento de los datos personales recogidos a través de la aplicación <strong>resellsnap.vercel.app</strong>.</p>
          <p className="mt-2">Contacto: <a href="mailto:privacidad@resellsnap.app" className="text-blue-600 hover:underline">privacidad@resellsnap.app</a></p>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">2. Datos que recogemos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Datos de cuenta:</strong> nombre, dirección de correo electrónico y datos de autenticación, gestionados por Clerk.</li>
            <li><strong>Imágenes:</strong> las fotografías que subes para el análisis de precios. Las imágenes se envían a la API de Anthropic para su procesamiento y <strong>no se almacenan</strong> en nuestros servidores.</li>
            <li><strong>Historial de análisis:</strong> resultados de tus escaneos (nombre del artículo, categoría, precios estimados). Almacenados en Supabase asociados a tu cuenta.</li>
            <li><strong>Datos de pago:</strong> gestionados íntegramente por Stripe. ResellSnap no almacena datos de tarjeta.</li>
            <li><strong>Datos de uso:</strong> contador de análisis diarios, guardado localmente en tu dispositivo (localStorage).</li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">3. Finalidad y base legal</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Prestación del servicio</strong> (ejecución de contrato): análisis de precios, historial y gestión de tu suscripción.</li>
            <li><strong>Cumplimiento legal</strong>: conservación de registros de facturación exigidos por ley.</li>
            <li><strong>Interés legítimo</strong>: mejora del servicio y detección de usos fraudulentos.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">4. Terceros proveedores</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Clerk</strong> (autenticación) — <a href="https://clerk.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener">política de privacidad</a></li>
            <li><strong>Supabase</strong> (base de datos) — <a href="https://supabase.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener">política de privacidad</a></li>
            <li><strong>Stripe</strong> (pagos) — <a href="https://stripe.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener">política de privacidad</a></li>
            <li><strong>Anthropic</strong> (análisis IA de imágenes) — <a href="https://www.anthropic.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener">política de privacidad</a></li>
            <li><strong>Vercel</strong> (alojamiento) — <a href="https://vercel.com/legal/privacy-policy" className="text-blue-600 hover:underline" target="_blank" rel="noopener">política de privacidad</a></li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">5. Conservación de datos</h2>
          <p>Los datos de cuenta e historial se conservan mientras mantengas una cuenta activa. Al eliminar tu cuenta, tus datos se borran en un plazo máximo de 30 días. Los registros de facturación se conservan 5 años por obligación legal.</p>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">6. Tus derechos (RGPD)</h2>
          <p>Tienes derecho a acceder, rectificar, suprimir, limitar y portar tus datos, así como a oponerte a su tratamiento. Para ejercer estos derechos escríbenos a <a href="mailto:privacidad@resellsnap.app" className="text-blue-600 hover:underline">privacidad@resellsnap.app</a>. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos (aepd.es).</p>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">7. Cookies y almacenamiento local</h2>
          <p>ResellSnap utiliza <strong>localStorage</strong> únicamente para guardar el contador de usos diarios gratuitos. No utilizamos cookies de seguimiento ni publicidad.</p>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-base mb-2">8. Cambios en esta política</h2>
          <p>Notificaremos cambios relevantes por correo electrónico o mediante aviso en la app con al menos 15 días de antelación.</p>
        </div>

      </section>

      <div className="mt-12 pt-6 border-t border-slate-200">
        <a href="/" className="text-sm text-blue-600 hover:underline">← Volver a ResellSnap</a>
      </div>
    </div>
  )
}
