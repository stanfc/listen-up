#!/usr/bin/env node

/**
 * 歌單驗證工具 — 比對 music.json 與 Spotify 實際資料
 *
 * 對每首歌用 spotifyId 去 Spotify 查，比對 title/artist/year，
 * 有差異時讓使用者互動選擇要保留哪個版本。
 *
 * Usage:
 *   node verify.js            # 互動模式
 *   node verify.js --auto     # 自動模式（全部採用 Spotify 資料）
 *   node verify.js --report   # 只印報告，不修改
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { GoogleGenAI } from '@google/genai'
import { getTrackById } from './spotify.js'
import { loadPlaylist, savePlaylist } from './playlist.js'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// ---------------------------------------------------------------------------
// Artist alias map (persistent)
// ---------------------------------------------------------------------------

const ARTIST_MAP_PATH = path.resolve(import.meta.dirname, 'artist-alias.json')
const TITLE_MAP_PATH = path.resolve(import.meta.dirname, 'title-alias.json')

function loadJsonMap(filePath) {
  if (!fs.existsSync(filePath)) return {}
  return JSON.parse(fs.readFileSync(filePath, 'utf-8') || '{}')
}

function saveJsonMap(filePath, map) {
  fs.writeFileSync(filePath, JSON.stringify(map, null, 2), 'utf-8')
}

function aliasKey(a, b) {
  return [a, b].sort().join(' <=> ')
}

const args = process.argv.slice(2)
const AUTO_MODE = args.includes('--auto')
const REPORT_ONLY = args.includes('--report')

function getArgValue(flag, defaultVal) {
  const idx = args.indexOf(flag)
  if (idx === -1 || idx + 1 >= args.length) return defaultVal
  return parseInt(args[idx + 1], 10)
}

const START_FROM = getArgValue('--from', 1)

// ---------------------------------------------------------------------------
// Interactive prompt
// ---------------------------------------------------------------------------

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve))
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Diff detection
// ---------------------------------------------------------------------------

function findDiffs(song, spotifyTrack) {
  const diffs = []

  const spTitle = spotifyTrack.name
  const spArtist = spotifyTrack.artists.map(a => a.name).join(' / ')
  const spYear = parseInt(spotifyTrack.album?.release_date?.substring(0, 4), 10) || null
  const spAlbumArt = pickAlbumArt(spotifyTrack)

  if (song.title !== spTitle) {
    diffs.push({ field: 'title', local: song.title, spotify: spTitle })
  }
  if (song.artist !== spArtist) {
    diffs.push({ field: 'artist', local: song.artist, spotify: spArtist })
  }
  if (spAlbumArt && song.albumArt !== spAlbumArt) {
    diffs.push({ field: 'albumArt', local: song.albumArt, spotify: spAlbumArt })
  }

  return diffs
}

function pickAlbumArt(track) {
  const images = track.album?.images || []
  const medium = images.find(img => img.width >= 200 && img.width <= 640)
  return (medium || images[0])?.url || ''
}

// ---------------------------------------------------------------------------
// LLM artist check
// ---------------------------------------------------------------------------

async function askLlmYesNo(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {}
    })
    return response.text?.trim().toLowerCase() === 'yes'
  } catch {
    return false
  }
}

async function isSameArtist(localArtist, spotifyArtist) {
  return askLlmYesNo(
    `「${localArtist}」和「${spotifyArtist}」是同一位歌手/樂團嗎？（可能是同一人的中英文名、藝名、本名等）\n請只回答 yes 或 no，不要其他文字。`
  )
}

async function isSameTitle(localTitle, spotifyTitle) {
  return askLlmYesNo(
    `「${localTitle}」和「${spotifyTitle}」是同一首歌嗎？（可能是同一首歌的不同寫法、簡繁體、加了括號備註等）\n請只回答 yes 或 no，不要其他文字。`
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🔍 歌單驗證工具 — 比對 music.json vs Spotify\n')

  const playlist = loadPlaylist()
  const artistMap = loadJsonMap(ARTIST_MAP_PATH)
  const titleMap = loadJsonMap(TITLE_MAP_PATH)
  console.log(`   共 ${playlist.length} 首歌需要驗證`)
  console.log(`   已知歌手對照: ${Object.keys(artistMap).length} 組`)
  console.log(`   已知歌名對照: ${Object.keys(titleMap).length} 組\n`)

  let matchCount = 0
  let diffCount = 0
  let errorCount = 0
  let modifiedCount = 0

  const startIndex = START_FROM - 1 // --from is 1-based
  if (startIndex > 0) {
    console.log(`   從第 ${START_FROM} 首開始\n`)
  }

  for (let i = startIndex; i < playlist.length; i++) {
    const song = playlist[i]
    const label = `[${i + 1}/${playlist.length}] ${song.id}`

    if (!song.spotifyId) {
      console.log(`${label} ⚠ 沒有 spotifyId，跳過`)
      errorCount++
      continue
    }

    let track
    try {
      track = await getTrackById(song.spotifyId)
    } catch (err) {
      console.log(`${label} ❌ Spotify 查詢失敗: ${err.message}`)
      errorCount++
      await sleep(500)
      continue
    }

    let diffs = findDiffs(song, track)

    // If title differs, check map first, then ask LLM
    const titleDiff = diffs.find(d => d.field === 'title')
    if (titleDiff) {
      const key = aliasKey(titleDiff.local, titleDiff.spotify)
      const cached = titleMap[key]

      if (cached !== undefined) {
        if (cached) {
          console.log(`${label} 歌名不同 → 快取：同一首，保留本地「${titleDiff.local}」`)
          diffs = diffs.filter(d => d.field !== 'title')
        } else {
          console.log(`${label} 歌名不同 → 快取：不同歌`)
        }
      } else {
        process.stdout.write(`${label} 歌名不同，詢問 LLM... `)
        const same = await isSameTitle(titleDiff.local, titleDiff.spotify)
        titleMap[key] = same
        saveJsonMap(TITLE_MAP_PATH, titleMap)
        if (same) {
          console.log(`✅ 同一首，保留本地「${titleDiff.local}」`)
          diffs = diffs.filter(d => d.field !== 'title')
        } else {
          console.log(`❌ 不同歌`)
        }
      }
    }

    // If artist differs, check map first, then ask LLM
    const artistDiff = diffs.find(d => d.field === 'artist')
    if (artistDiff) {
      const key = aliasKey(artistDiff.local, artistDiff.spotify)
      const cached = artistMap[key]

      if (cached !== undefined) {
        if (cached) {
          console.log(`${label} 歌手不同 → 快取：同一人，保留本地「${artistDiff.local}」`)
          diffs = diffs.filter(d => d.field !== 'artist')
        } else {
          console.log(`${label} 歌手不同 → 快取：不同人`)
        }
      } else {
        process.stdout.write(`${label} 歌手不同，詢問 LLM... `)
        const same = await isSameArtist(artistDiff.local, artistDiff.spotify)
        artistMap[key] = same
        saveJsonMap(ARTIST_MAP_PATH, artistMap)
        if (same) {
          console.log(`✅ 同一人，保留本地「${artistDiff.local}」`)
          diffs = diffs.filter(d => d.field !== 'artist')
        } else {
          console.log(`❌ 不同人`)
        }
      }
    }

    if (diffs.length === 0) {
      matchCount++
      await sleep(500)
      continue
    }

    diffCount++

    // Print diffs
    console.log(`\n${'─'.repeat(60)}`)
    console.log(`${label}: ${song.title} — ${song.artist}`)
    console.log()

    for (const d of diffs) {
      const localStr = d.field === 'albumArt' ? truncate(d.local, 50) : d.local
      const spotifyStr = d.field === 'albumArt' ? truncate(d.spotify, 50) : d.spotify
      console.log(`  ${d.field}:`)
      console.log(`    [L] 本地:   ${localStr}`)
      console.log(`    [S] Spotify: ${spotifyStr}`)
    }

    if (REPORT_ONLY) {
      await sleep(500)
      continue
    }

    // Ask user what to do
    let choice
    if (AUTO_MODE) {
      choice = 's'
      console.log('  → 自動採用 Spotify 資料')
    } else {
      console.log()
      console.log('  選擇:')
      console.log('    [s] 全部採用 Spotify 資料')
      console.log('    [l] 全部保留本地資料')
      console.log('    [p] 逐欄位選擇')
      console.log('    [d] 刪除這首歌')
      console.log('    [enter] 跳過')

      choice = (await ask('  > ')).trim().toLowerCase()
    }

    let modified = false

    if (choice === 's') {
      for (const d of diffs) {
        song[d.field] = d.spotify
      }
      modified = true
      console.log('  ✅ 已更新為 Spotify 資料')
    } else if (choice === 'l') {
      // Cache title/artist as "same" so we don't ask again
      for (const d of diffs) {
        if (d.field === 'title') {
          titleMap[aliasKey(d.local, d.spotify)] = true
          saveJsonMap(TITLE_MAP_PATH, titleMap)
        } else if (d.field === 'artist') {
          artistMap[aliasKey(d.local, d.spotify)] = true
          saveJsonMap(ARTIST_MAP_PATH, artistMap)
        }
      }
      console.log('  ✅ 保留本地資料（已加入快取）')
    } else if (choice === 'd') {
      playlist.splice(i, 1)
      i-- // adjust index
      modified = true
      console.log('  🗑️ 已刪除')
    } else if (choice === 'p') {
      for (const d of diffs) {
        const localStr = d.field === 'albumArt' ? truncate(d.local, 50) : d.local
        const spotifyStr = d.field === 'albumArt' ? truncate(d.spotify, 50) : d.spotify
        console.log(`\n  ${d.field}:`)
        console.log(`    [l] ${localStr}`)
        console.log(`    [s] ${spotifyStr}`)
        const fieldChoice = (await ask('    選擇 (l/s): ')).trim().toLowerCase()
        if (fieldChoice === 's') {
          song[d.field] = d.spotify
          modified = true
          console.log(`    → 採用 Spotify`)
        } else {
          // Cache as "same" for title/artist
          if (d.field === 'title') {
            titleMap[aliasKey(d.local, d.spotify)] = true
            saveJsonMap(TITLE_MAP_PATH, titleMap)
          } else if (d.field === 'artist') {
            artistMap[aliasKey(d.local, d.spotify)] = true
            saveJsonMap(ARTIST_MAP_PATH, artistMap)
          }
          console.log(`    → 保留本地（已加入快取）`)
        }
      }
    } else {
      console.log('  ⏭ 跳過')
    }

    if (modified) {
      modifiedCount++
      if (!REPORT_ONLY) {
        savePlaylist(playlist)
        console.log('  💾 已存檔')
      }
    }

    await sleep(500)
  }

  // Summary
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`🏁 驗證完成`)
  console.log(`   ✅ 完全一致: ${matchCount}`)
  console.log(`   ⚠ 有差異:   ${diffCount}`)
  console.log(`   ❌ 查詢失敗: ${errorCount}`)
  if (!REPORT_ONLY) {
    console.log(`   📝 已修改:   ${modifiedCount}`)
  }

  console.log(`   📂 歌單總計: ${playlist.length} 首`)

  rl.close()
}

function truncate(str, max) {
  if (!str) return '(empty)'
  return str.length > max ? str.substring(0, max) + '...' : str
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
