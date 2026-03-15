#!/usr/bin/env node

/**
 * 年份驗證工具 — 用 Web Search + LLM 確認每首歌的原始發行年份
 *
 * 流程：
 *   1. 對每首歌，用 DuckDuckGo 搜「歌手 歌名 release year」
 *   2. 取搜尋結果摘要
 *   3. 丟給 Gemini 問：根據這些搜尋結果，年份是？
 *   4. LLM 回傳年份，若和 music.json 不同就更新
 *
 * Usage:
 *   node verify-year.js             # 執行並更新
 *   node verify-year.js --report    # 只印報告，不修改
 */

import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'
import { loadPlaylist, savePlaylist } from './playlist.js'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const args = process.argv.slice(2)
const REPORT_ONLY = args.includes('--report')

function getArgValue(flag, defaultVal) {
  const idx = args.indexOf(flag)
  if (idx === -1 || idx + 1 >= args.length) return defaultVal
  return parseInt(args[idx + 1], 10)
}

const START_FROM = getArgValue('--from', 1)

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Search using DuckDuckGo API with multiple strategies
 */
async function searchYear(title, artist) {
  // Try multiple search queries in order
  const queries = [
    `"${title}" "${artist}"`,           // Exact match
    `${artist} ${title} 歌曲`,          // Chinese keywords
    `${artist} "${title}" 發行`,        // Release in Chinese
    `${artist} ${title} Wikipedia`,     // Try English wiki
    `site:zh.wikipedia.org ${artist} ${title}`, // Chinese wiki
  ]

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`
      )
      const data = await response.json()

      // Try instant answer first
      let result = data.AbstractText || data.Definition || ''

      // If no instant answer, use search results
      if (!result && data.Results && data.Results.length > 0) {
        const resultTexts = data.Results
          .slice(0, 3)
          .map(r => `${r.Text}`)
          .filter(t => t && t.length > 10)
          .join(' | ')
        if (resultTexts) result = resultTexts
      }

      // If we got a result, return it
      if (result && result.length > 5) {
        return result
      }

      // Small delay between retries
      await sleep(100)
    } catch (err) {
      // Continue to next query
    }
  }

  return ''
}

/**
 * Ask LLM to extract year from search results
 */
async function extractYearFromSearch(title, artist, searchResult) {
  if (!searchResult) return null

  const prompt = `根據以下搜尋結果，「${artist}」的歌曲「${title}」最早是哪一年發行的？

搜尋結果：
${searchResult}

請只回傳一個 4 位數的年份數字，不要任何其他文字。
例如：1997`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {}
    })

    const text = response.text?.trim()
    if (!text) return null

    const match = text.match(/\b(19[0-9]{2}|20[0-2][0-9])\b/)
    return match ? parseInt(match[1], 10) : null
  } catch (err) {
    console.error(`  ⚠ LLM error: ${err.message}`)
    return null
  }
}

async function main() {
  console.log('📅 年份驗證工具 — DuckDuckGo Search + LLM\n')

  const playlist = loadPlaylist()
  console.log(`   共 ${playlist.length} 首歌需要驗證`)
  if (START_FROM > 1) {
    console.log(`   從第 ${START_FROM} 首開始`)
  }
  console.log()

  let matchCount = 0
  let updatedCount = 0
  let errorCount = 0

  const startIndex = START_FROM - 1 // --from is 1-based
  for (let i = startIndex; i < playlist.length; i++) {
    const song = playlist[i]
    const label = `[${i + 1}/${playlist.length}]`

    process.stdout.write(`${label} ${song.title} — ${song.artist} (${song.year}) ... `)

    // Search
    process.stdout.write('🔍 ')
    const searchResult = await searchYear(song.title, song.artist)
    await sleep(300)

    if (!searchResult) {
      console.log('⚠ 無搜尋結果')
      errorCount++
      continue
    }

    // Extract year with LLM
    process.stdout.write('🤖 ')
    const correctYear = await extractYearFromSearch(song.title, song.artist, searchResult)
    await sleep(500)

    if (!correctYear) {
      console.log('⚠ 無法判斷')
      errorCount++
      continue
    }

    if (correctYear === song.year) {
      console.log(`✅`)
      matchCount++
    } else {
      console.log(`🔄 ${song.year} → ${correctYear}`)
      if (!REPORT_ONLY) {
        song.year = correctYear
      }
      updatedCount++
    }
  }

  // Save
  if (!REPORT_ONLY && updatedCount > 0) {
    savePlaylist(playlist)
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`🏁 驗證完成`)
  console.log(`   ✅ 年份正確: ${matchCount}`)
  console.log(`   🔄 已更新:   ${updatedCount}`)
  console.log(`   ❌ 查詢失敗: ${errorCount}`)
  if (!REPORT_ONLY && updatedCount > 0) {
    console.log(`\n💾 已存檔 music.json (${playlist.length} 首)`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
