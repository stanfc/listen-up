#!/usr/bin/env node

/**
 * 華語金曲爬蟲 — Song Crawler for 猜歌王
 *
 * Flow per year:
 *   1. Claude + web_search → 找出該年最經典的華語歌曲
 *   2. Spotify search → 查 spotifyId & albumArt
 *   3. 套用多樣性規則 → 寫入 music.json
 *
 * Usage:
 *   npm start                          # 全範圍 1940-2026
 *   npm start -- --from 2000 --to 2010 # 指定年份範圍
 *   npm run dry-run                    # 只印出，不寫入
 */

import 'dotenv/config'
import { findSongsForYear } from './llm.js'
import { lookupSong } from './spotify.js'
import {
  loadPlaylist,
  savePlaylist,
  hasSpotifyId,
  countByArtist,
  nextMusicId
} from './playlist.js'
import {
  YEAR_START,
  YEAR_END,
  MAX_SONGS_PER_ARTIST,
  getSongsPerYear,
  getDifficulty,
  getYearTag
} from './config.js'

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')

function getArgValue(flag, defaultVal) {
  const idx = args.indexOf(flag)
  if (idx === -1 || idx + 1 >= args.length) return defaultVal
  return parseInt(args[idx + 1], 10)
}

const fromYear = getArgValue('--from', YEAR_START)
const toYear = getArgValue('--to', YEAR_END)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function crawlYear(year, playlist) {
  const target = getSongsPerYear(year)
  const added = []

  // Step 1: Ask LLM (with web search) for song recommendations
  let suggestions
  try {
    suggestions = await findSongsForYear(year, playlist, target)
  } catch (err) {
    console.error(`  ⚠ LLM error: ${err.message}`)
    return added
  }

  if (suggestions.length === 0) return added

  // Step 2: For each suggestion, look up on Spotify
  for (const suggestion of suggestions) {
    if (added.length >= target) break

    try {
      const result = await lookupSong(suggestion.title, suggestion.artist)

      if (!result) {
        console.log(`   ⚠ Spotify 找不到: ${suggestion.title} — ${suggestion.artist}`)
        continue
      }

      // Skip if already in playlist
      if (hasSpotifyId(playlist, result.spotifyId)) {
        console.log(`   ⏭ 已存在: ${suggestion.title}`)
        continue
      }

      // Diversity check
      const artist = suggestion.artist.split(/[/／&、]/)[0].trim()
      if (countByArtist(playlist, artist) >= MAX_SONGS_PER_ARTIST) {
        console.log(`   ⏭ 歌手太多: ${artist} (已有 ${MAX_SONGS_PER_ARTIST} 首)`)
        continue
      }

      const song = {
        id: nextMusicId(playlist),
        title: suggestion.title,
        artist: suggestion.artist,
        year: year,
        spotifyId: result.spotifyId,
        albumArt: result.albumArt,
        tags: [getYearTag(year), 'chinese'],
        difficulty: getDifficulty(year)
      }

      playlist.push(song)
      added.push(song)

      await sleep(200) // polite delay
    } catch (err) {
      console.error(`   ⚠ Spotify lookup failed for "${suggestion.title}": ${err.message}`)
    }
  }

  return added
}

async function main() {
  console.log('🎵 華語金曲爬蟲 — Song Crawler for 猜歌王')
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (不寫入)' : 'LIVE (寫入 music.json)'}`)
  console.log(`   Years: ${fromYear} – ${toYear}`)
  console.log()

  const playlist = DRY_RUN ? [] : loadPlaylist()
  const startCount = playlist.length
  console.log(`   現有歌曲: ${startCount} 首\n`)

  let totalAdded = 0

  for (let year = fromYear; year <= toYear; year++) {
    const target = getSongsPerYear(year)
    process.stdout.write(`\n📅 ${year} (目標 ${target} 首) ...\n`)

    try {
      const added = await crawlYear(year, playlist)
      totalAdded += added.length

      if (added.length > 0) {
        console.log(`   ✅ +${added.length} 首`)
        for (const s of added) {
          console.log(`   ├ ${s.title} — ${s.artist} [${s.spotifyId}]`)
        }
      } else {
        console.log('   — 無新歌曲')
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`)
    }

    // Save periodically (every 5 years)
    if (!DRY_RUN && year % 5 === 0) {
      savePlaylist(playlist)
      console.log(`   💾 已存檔 (${playlist.length} 首)`)
    }

    await sleep(500) // delay between years to be polite to APIs
  }

  // Final save
  if (!DRY_RUN) {
    savePlaylist(playlist)
  }

  console.log()
  console.log('═══════════════════════════════════════════')
  console.log(`🏁 完成！新增 ${totalAdded} 首，歌單總計 ${playlist.length} 首`)
  console.log('═══════════════════════════════════════════')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
