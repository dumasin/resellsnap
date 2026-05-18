import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

// ─── Gemini client ────────────────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert in fashion and sneaker resell markets.
Your job: analyze an image of an item (sneaker, clothing, accessory) and provide realistic resell price estimates in EUR for 6 platforms.

Platform profiles:
- stockx: Authenticated marketplace, premium prices, mainly sneakers/streetwear. No worn clothing.
- goat: Similar to StockX, slightly lower fees. Focus on sneakers, also apparel.
- depop: Trend-focused younger audience. All clothing and sneakers. Mid prices.
- vinted: Mass-market, high volume, lower prices. Great for clothing. Buyers are price-sensitive.
- wallapop: Spanish local market. Price-sensitive. Good for clothing and general items.
- ebay: Global reach, widest audience. Prices vary. Good for rare/niche items.

Condition pricing guidelines (relative to "new" retail price):
- new:      95–110% of retail (pristine, with tags/box, never worn)
- like_new: 75–90%  (worn 1–2 times max, no visible wear)
- good:     55–70%  (regular use, light wear marks)
- fair:     35–50%  (clear wear, still functional and presentable)

IMPORTANT:
- If item is clothing (not sneakers), set stockx and goat to reasonable prices or omit them (return null for their entries if not applicable)
- Make prices realistic and current — consider brand popularity and demand
- Return ONLY raw JSON, no markdown, no code blocks, no explanation`

// ─── User prompt template ─────────────────────────────────────────────────────
const USER_PROMPT = `Identify this item and return a JSON object with this EXACT structure. Return ONLY the JSON:

{
  "item_name": "Full descriptive name (brand + model + colorway if applicable)",
  "brand": "Brand name",
  "category": "Category (e.g. Sneakers, Hoodie, T-Shirt, Jacket, Pants, Accessory, Other)",
  "confidence": "high | medium | low",
  "platforms": {
    "stockx": {
      "new":      {"min": 0, "max": 0},
      "like_new": {"min": 0, "max": 0},
      "good":     {"min": 0, "max": 0},
      "fair":     {"min": 0, "max": 0}
    },
    "goat": {
      "new":      {"min": 0, "max": 0},
      "like_new": {"min": 0, "max": 0},
      "good":     {"min": 0, "max": 0},
      "fair":     {"min": 0, "max": 0}
    },
    "depop": {
      "new":      {"min": 0, "max": 0},
      "like_new": {"min": 0, "max": 0},
      "good":     {"min": 0, "max": 0},
      "fair":     {"min": 0, "max": 0}
    },
    "vinted": {
      "new":      {"min": 0, "max": 0},
      "like_new": {"min": 0, "max": 0},
      "good":     {"min": 0, "max": 0},
      "fair":     {"min": 0, "max": 0}
    },
    "wallapop": {
      "new":      {"min": 0, "max": 0},
      "like_new": {"min": 0, "max": 0},
      "good":     {"min": 0, "max": 0},
      "fair":     {"min": 0, "max": 0}
    },
    "ebay": {
      "new":      {"min": 0, "max": 0},
      "like_new": {"min": 0, "max": 0},
      "good":     {"min": 0, "max": 0},
      "fair":     {"min": 0, "max": 0}
    }
  },
  "tip": "Un consejo práctico en español de máximo 120 caracteres sobre cómo/cuándo vender este artículo",
  "best_platform": "platform_id with highest average return for this item"
}`

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request) {
  // Validate API key
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY no configurada. Añádela en las variables de entorno.' },
      { status: 500 }
    )
  }

  let image
  try {
    const body = await request.json()
    image = body.image
  } catch {
    return NextResponse.json({ error: 'Request inválida.' }, { status: 400 })
  }

  if (!image || typeof image !== 'string') {
    return NextResponse.json({ error: 'No se recibió imagen.' }, { status: 400 })
  }

  // Validate base64 data URL
  if (!image.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Formato de imagen no válido.' }, { status: 400 })
  }

  try {
    // Strip the data URL prefix to get raw base64 + mime type
    const matches = image.match(/^data:(image\/[a-z]+);base64,(.+)$/)
    if (!matches) {
      return NextResponse.json({ error: 'Formato de imagen no válido.' }, { status: 400 })
    }
    const [, mimeType, base64Data] = matches

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
        maxOutputTokens: 1200,
      },
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: USER_PROMPT },
          ],
        },
      ],
    })

    const content = response.text?.trim()

    if (!content) {
      throw new Error('Respuesta vacía de Gemini.')
    }

    // Extract JSON from response (handles cases where model wraps in ```json)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in response:', content)
      throw new Error('No se pudo parsear la respuesta.')
    }

    const data = JSON.parse(jsonMatch[0])

    // Basic validation
    if (!data.item_name || !data.platforms) {
      throw new Error('Respuesta incompleta del modelo.')
    }

    return NextResponse.json(data)

  } catch (err) {
    console.error('[/api/analyze] Error:', err)

    if (err?.status === 429) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones. Espera un momento e inténtalo de nuevo.' },
        { status: 429 }
      )
    }

    if (err?.status === 401 || err?.status === 403) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY inválida. Verifica tu configuración.' },
        { status: 401 }
      )
    }

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Error al procesar la respuesta. Inténtalo de nuevo.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: err.message || 'Error al analizar la imagen.' },
      { status: 500 }
    )
  }
}
