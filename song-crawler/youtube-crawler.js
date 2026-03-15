#!/usr/bin/env node

/**
 * YouTube 爬蟲 — 為 music.json 中的每首歌搜尋 YouTube 視頻 ID
 *
 * 流程：
 *   1. 對每首歌，用 YouTube API 搜「{歌手} {歌名} official」
 *   2. 取第一個搜尋結果的視頻 ID
 *   3. 寫回 music.json 的 youtubeId 欄位
 *
 * Usage:
 *   node youtube-crawler.js             # 執行並更新
 *   node youtube-crawler.js --report    # 只印報告，不修改
 *   node youtube-crawler.js --from 10   # 從第 10 首開始
 */

import 'dotenv/config'
import { loadPlaylist, savePlaylist } from './playlist.js'

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
 * Search YouTube for a song
 */
async function searchYouTube(title, artist, apiKey) {
  const query = `${artist} ${title} official`

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('q', query)
  url.searchParams.set('type', 'video')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('maxResults', '5')
  url.searchParams.set('key', apiKey)

  try {
    const response = await fetch(url.toString())

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`YouTube API error (${response.status}): ${text}`)
    }

    const data = await response.json()
    const items = data.items || []

    if (items.length === 0) {
      return null
    }

    // Return first result's video ID
    return items[0].id.videoId
  } catch (err) {
    console.error(`  ⚠ YouTube API error: ${err.message}`)
    return null
  }
}

async function main() {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    console.error('❌ 錯誤：YOUTUBE_API_KEY 未設定在 .env')
    process.exit(1)
  }

  console.log('🎥 YouTube 爬蟲 — 搜尋視頻 ID\n')

  const playlist = loadPlaylist()
  console.log(`   共 ${playlist.length} 首歌需要搜尋`)
  if (START_FROM > 1) {
    console.log(`   從第 ${START_FROM} 首開始`)
  }
  console.log()

  let foundCount = 0
  let skippedCount = 0
  let errorCount = 0

  const startIndex = START_FROM - 1
  for (let i = startIndex; i < playlist.length; i++) {
    const song = playlist[i]
    const label = `[${i + 1}/${playlist.length}]`

    // Skip if already has youtubeId
    if (song.youtubeId) {
      console.log(`${label} ${song.title} — ${song.artist} ... ⏭️  已有 ID`)
      skippedCount++
      continue
    }

    process.stdout.write(`${label} ${song.title} — ${song.artist} ... `)

    // Search
    process.stdout.write('🔍 ')
    const youtubeId = await searchYouTube(song.title, song.artist, apiKey)
    await sleep(500) // Rate limiting

    if (youtubeId) {
      console.log(`✅ ${youtubeId}`)
      if (!REPORT_ONLY) {
        song.youtubeId = youtubeId
      }
      foundCount++
    } else {
      console.log('❌ 找不到')
      errorCount++
    }
  }

  // Save
  if (!REPORT_ONLY && foundCount > 0) {
    savePlaylist(playlist)
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`🎬 搜尋完成`)
  console.log(`   ✅ 找到:   ${foundCount}`)
  console.log(`   ⏭️  已有:   ${skippedCount}`)
  console.log(`   ❌ 失敗:   ${errorCount}`)
  if (!REPORT_ONLY && foundCount > 0) {
    console.log(`\n💾 已存檔 music.json (${playlist.length} 首)`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
