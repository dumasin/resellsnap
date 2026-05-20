import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

function getSystemPrompt(lang) {
  const isEN = lang === 'en'
  const currency = isEN ? 'USD' : 'EUR'
  const p4 = isEN
    ? '- grailed: Designer and streetwear resale platform. Strong in premium/luxury/streetwear. US-focused.'
    : '- vinted: Mass-market, high volume, lower prices. Great for clothing. Buyers are price-sensitive.'
  const p5 = isEN
    ? '- poshmark: Mass-market clothing resale. High volume, lower prices. Great for everyday clothing. US-focused.'
    : '- wallapop: Spanish local market. Price-sensitive. Good for clothing and general items.'

  return `You are an expert in fashion and sneaker resell markets.
Your job: analyze an image of an item (sneaker, clothing, accessory) and provide realistic resell price estimates in ${currency} for 6 platforms.

Platform profiles:
- stockx: Authenticated marketplace, premium prices, mainly sneakers/streetwear. No worn clothing.
- goat: Similar to StockX, slightly lower fees. Focus on sneakers, also apparel.
- depop: Trend-focused younger audience. All clothing and sneakers. Mid prices.
${p4}
${p5}
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
}

function getUserPrompt(lang) {
  const isEN = lang === 'en'
  const p4key = isEN ? 'grailed' : 'vinted'
  const p5key = isEN ? 'poshmark' : 'wallapop'
  const tipInstruction = isEN
    ? '"tip": "A practical tip in English, max 120 characters, on how/when to sell this item"'
    : '"tip": "Un consejo práctico en español de máximo 120 caracteres sobre cómo/cuándo vender este artículo"'

  return `Identify this item and return a JSON object with this EXACT structure. Return ONLY the JSON:

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
    "${p4key}": {
      "new":      {"min": 0, "max": 0},
      "like_new": {"min": 0, "max": 0},
      "good":     {"min": 0, "max": 0},
      "fair":     {"min": 0, "max": 0}
    },
    "${p5key}": {
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
  ${tipInstruction},
  "best_platform": "platform_id with highest average return for this item"
}`
}

export async function POST(request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not configured.' },
      { status: 500 }
    )
  }

  let image, lang
  try {
    const body = await request.json()
    image = body.image
    lang = body.lang === 'en' ? 'en' : 'es'
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!image || typeof image !== 'string') {
    return NextResponse.json({ error: 'No image received.' }, { status: 400 })
  }

  if (!image.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Invalid image format.' }, { status: 400 })
  }

  try {
    const matches = image.match(/^data:(image\/[a-z]+);base64,(.+)$/)
    if (!matches) {
      return NextResponse.json({ error: 'Invalid image format.' }, { status: 400 })
    }
    const [, mimeType, base64Data] = matches

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: getSystemPrompt(lang),
        temperature: 0.2,
        maxOutputTokens: 4000,
      },
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: getUserPrompt(lang) },
          ],
        },
      ],
    })

    const raw = typeof response.text === 'function'
      ? response.text()
      : (response.text ?? response.candidates?.[0]?.content?.parts?.[0]?.text ?? '')
    const content = raw?.trim()

    console.log('[/api/analyze] Gemini raw response:', content?.slice(0, 300))

    if (!content) throw new Error('Empty response from Gemini.')

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in response:', content)
      throw new Error(`Could not parse response: ${content.slice(0, 200)}`)
    }

    const data = JSON.parse(jsonMatch[0])

    if (!data.item_name || !data.platforms) {
      throw new Error('Incomplete model response.')
    }

    return NextResponse.json(data)

  } catch (err) {
    console.error('[/api/analyze] Error:', err)

    if (err?.status === 429) {
      return NextResponse.json(
        { error: lang === 'en' ? 'Too many requests. Please wait a moment.' : 'Demasiadas peticiones. Espera un momento.' },
        { status: 429 }
      )
    }

    if (err?.status === 401 || err?.status === 403) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY invalid.' },
        { status: 401 }
      )
    }

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: lang === 'en' ? 'Error processing response. Please try again.' : 'Error al procesar la respuesta. Inténtalo de nuevo.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: err.message || (lang === 'en' ? 'Error analyzing image.' : 'Error al analizar la imagen.') },
      { status: 500 }
    )
  }
}
