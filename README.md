# ResellSnap

Haz una foto a tu ropa o sneakers y descubre al instante cuánto puedes venderlos en **Vinted, Wallapop, Depop, StockX, GOAT y eBay** — con escala de precio por condición.

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **GPT-4o Vision** (OpenAI)
- Deploy en **Vercel** (gratis)

---

## 🚀 Deploy en Vercel (5 minutos)

### 1. Sube el código a GitHub

```bash
cd "Resell Price"
git init
git add .
git commit -m "Initial commit: ResellSnap"

# Crea un repo en github.com y conecta:
git remote add origin https://github.com/TU_USUARIO/resellsnap.git
git push -u origin main
```

### 2. Despliega en Vercel

1. Ve a [vercel.com](https://vercel.com) → **New Project**
2. Importa tu repositorio de GitHub
3. En **Environment Variables**, añade:
   ```
   OPENAI_API_KEY = sk-tu-clave-aquí
   ```
4. Click **Deploy** ✅

Tu app estará en `https://resellsnap.vercel.app` (o similar).

---

## 💻 Desarrollo local

### Requisitos
- Node.js 18+
- Una API key de OpenAI con acceso a `gpt-4o`

### Setup

```bash
# Instala dependencias
npm install

# Copia el archivo de entorno
cp .env.example .env.local

# Edita .env.local y añade tu API key:
# OPENAI_API_KEY=sk-...

# Arranca el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu móvil (o en el emulador del navegador).

---

## 💡 Cómo funciona

1. **Haz una foto** del artículo (o elige una de la galería)
2. **Selecciona la condición**: Nuevo / Como nuevo / Buen estado / Aceptable
3. **Analizar precio** → GPT-4o Vision identifica el artículo
4. La app muestra:
   - Precios por plataforma ordenados de mayor a menor
   - Escala de precio según condición
   - Consejo de venta personalizado

### Escalado de precios por condición

| Condición | % del precio nuevo |
|-----------|-------------------|
| Nuevo (con caja/etiquetas) | 95–110% |
| Como nuevo (sin uso visible) | 75–90% |
| Buen estado (uso moderado) | 55–70% |
| Aceptable (signos de uso) | 35–50% |

---

## 💰 Coste estimado por uso

GPT-4o Vision cuesta aprox. **~$0.01–0.02 por análisis** (dependiendo del tamaño de imagen).

Para 100 análisis/mes → ~$1–2 de coste en OpenAI.

---

## 🔒 Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `OPENAI_API_KEY` | API key de OpenAI (obligatorio) |

---

## 📱 Optimizado para móvil

- Diseño mobile-first (375px+)
- Compresión automática de imagen (max 1024px, JPEG 80%)
- Touch targets ≥44px (Apple HIG)
- Animación de escáner en la pantalla de análisis
