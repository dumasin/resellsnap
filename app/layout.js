import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata = {
  title: 'ResellSnap – Precio de reventa al instante',
  description: 'Fotografía tu ropa o sneakers y descubre cuánto puedes ganar en Vinted, Wallapop, StockX, Depop y más.',
  keywords: 'resell, precio reventa, sneakers, ropa segunda mano, vinted, wallapop, stockx, depop',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1E293B',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  )
}
