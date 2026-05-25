import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import InstallBanner from './components/InstallBanner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

const APP_URL = 'https://resellsnap.es'

const TITLE = 'ResellSnap – Precio de reventa de sneakers y ropa con IA'
const DESCRIPTION = 'Descubre cuánto vale tu ropa o sneakers en StockX, GOAT, Vinted, Wallapop, Depop y eBay. Analiza el precio de reventa con IA en segundos. 5 análisis gratis al mes.'

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'precio reventa sneakers, precio reventa ropa, cuánto vale mi sneaker, stockx precio, vinted precio, wallapop precio, depop precio, resell precio, segunda mano precio, resellsnap',
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: APP_URL,
    siteName: 'ResellSnap',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'ResellSnap – Precio de reventa con IA' }],
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/opengraph-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  appleWebApp: {
    capable: true,
    title: 'ResellSnap',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1E293B',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${APP_URL}/#app`,
      name: 'ResellSnap',
      url: APP_URL,
      description: DESCRIPTION,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      inLanguage: ['es', 'en'],
      offers: [
        {
          '@type': 'Offer',
          name: 'Plan Gratuito',
          price: '0',
          priceCurrency: 'EUR',
          description: '5 análisis de precio de reventa al mes',
        },
        {
          '@type': 'Offer',
          name: 'Plan Pro',
          price: '7',
          priceCurrency: 'EUR',
          description: 'Análisis ilimitados e historial de escaneos',
        },
      ],
      featureList: [
        'Estimación de precio de reventa con IA',
        'Precios en StockX, GOAT, Vinted, Wallapop, Depop y eBay',
        'Análisis de sneakers y ropa',
        'Historial de análisis',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Cómo funciona ResellSnap?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Fotografías tu prenda o sneaker, la IA identifica el artículo y te devuelve estimaciones de precio de reventa en 6 plataformas: StockX, GOAT, Vinted, Wallapop, Depop y eBay.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Es gratis ResellSnap?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sí, el plan gratuito incluye 5 análisis al mes sin necesidad de tarjeta. El plan Pro ofrece análisis ilimitados por 7€/mes.',
          },
        },
        {
          '@type': 'Question',
          name: '¿En qué plataformas da precios ResellSnap?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ResellSnap estima precios de reventa en StockX, GOAT, Depop, Vinted, Wallapop y eBay, teniendo en cuenta la condición del artículo.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Funciona para sneakers y para ropa?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sí, ResellSnap analiza tanto sneakers como prendas de ropa y accesorios, adaptando los precios a las plataformas más relevantes para cada tipo de artículo.',
          },
        },
      ],
    },
    {
      '@type': 'Organization',
      '@id': `${APP_URL}/#org`,
      name: 'ResellSnap',
      url: APP_URL,
      logo: `${APP_URL}/icon.png`,
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'soporte@resellsnap.es',
        contactType: 'customer support',
        availableLanguage: ['Spanish', 'English'],
      },
    },
  ],
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className={inter.className}>
          {children}
          <InstallBanner />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
