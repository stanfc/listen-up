/**
 * LLM client — uses Gemini with Google Search grounding to find and judge songs
 */

import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

/**
 * Ask Gemini (with Google Search grounding) to find popular Chinese songs for a given year.
 * Returns a structured list of { title, artist, why }.
 */
export async function findSongsForYear(year, existingSongs, targetCount) {
  // Build diversity awareness context
  const artistCounts = {}
  for (const s of existingSongs) {
    const a = s.artist.split(/[/／&、]/)[0].trim()
    artistCounts[a] = (artistCounts[a] || 0) + 1
  }
  const existingTitles = existingSongs
    .filter(s => s.year === year)
    .map(s => `${s.title} — ${s.artist}`)

  const existingArtistSummary = Object.entries(artistCounts)
    .filter(([, count]) => count >= 2)
    .map(([name, count]) => `${name}(${count}首)`)
    .join('、')

  const prompt = `請幫我找 ${year} 年發行的華語歌曲（國語、台語、粵語皆可，不限曲風），要找最經典、最熱門的歌。

我需要 ${targetCount} 首歌，請回傳 JSON 陣列，格式：
[
  { "title": "歌名", "artist": "歌手名", "why": "為什麼選這首（一句話）" }
]

選歌規則：
1. 必須是 ${year} 年首次發行的歌（不是翻唱、不是重新發行）
2. 優先選擇大眾耳熟能詳的經典金曲
3. 注意多樣性：男歌手、女歌手、樂團都要有
4. 避免重複歌手，一位歌手最多選 1 首
${existingTitles.length > 0 ? `5. 以下歌曲已在歌單中，請勿重複：\n${existingTitles.join('\n')}` : ''}
${existingArtistSummary ? `6. 以下歌手已有較多歌，請盡量避免：${existingArtistSummary}` : ''}

請只回傳 JSON，不要其他文字。如果這一年找不到足夠的華語經典歌曲，有幾首回幾首即可（可以是空陣列）。`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
    }
  })

  const text = response.text?.trim()
  if (!text) return []

  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = text
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) jsonStr = jsonMatch[1].trim()

  try {
    const songs = JSON.parse(jsonStr)
    if (!Array.isArray(songs)) return []
    return songs.filter(s => s.title && s.artist)
  } catch {
    console.error(`  ⚠ Failed to parse LLM response for ${year}:`, jsonStr.substring(0, 200))
    return []
  }
}
