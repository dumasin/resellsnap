export default function manifest() {
  return {
    name: 'ResellSnap',
    short_name: 'ResellSnap',
    description: 'Precio de reventa al instante. Fotografía tu ropa o sneakers y descubre cuánto puedes ganar.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0F172A',
    theme_color: '#1E293B',
    categories: ['shopping', 'utilities'],
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
