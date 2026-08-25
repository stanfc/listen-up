#!/usr/bin/env node

/**
 * YouTube 播放列表爬蟲 → music_new.json
 *
 * 使用 yt-dlp 從播放列表提取歌曲標題、ID、上傳年份，生成 music_new.json
 * 年份直接使用 YouTube 影片的上傳日期
 *
 * 使用方法:
 *   node yt-playlist-crawler.js <PLAYLIST_URL>
 *   node yt-playlist-crawler.js <PLAYLIST_URL> --from 50
 *   node yt-playlist-crawler.js <PLAYLIST_URL> --random 20
 *   node yt-playlist-crawler.js <PLAYLIST_URL> --tags 華語,經典
 */

import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import * as OpenCC from 'opencc-js'

// 簡體 → 繁體（台灣）
const s2t = OpenCC.Converter({ from: 'cn', to: 'twp' })

const args = process.argv.slice(2)
const playlistUrl = args.find(a => !a.startsWith('--'))
const fromIndex = parseInt(args[args.indexOf('--from') + 1]) || 0
const randomCount = args.includes('--random') ? parseInt(args[args.indexOf('--random') + 1]) || 0 : 0

function parseExtraTags(cliArgs) {
  const tagFlagIndex = cliArgs.findIndex(arg => arg === '--tags' || arg === '--tag')
  if (tagFlagIndex === -1) return []

  return (cliArgs[tagFlagIndex + 1] || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
}

const extraTags = parseExtraTags(args)

if (!playlistUrl) {
  console.error('❌ 請提供 YouTube 播放列表 URL')
  console.error('用法: node yt-playlist-crawler.js "<PLAYLIST_URL>" [--from N]')
  process.exit(1)
}

// ===== 設定 =====
const OUTPUT_FILE = path.resolve('.', '..', 'backend', 'data', 'music_new.json')
const FAILED_FILE = path.resolve('.', '..', 'backend', 'data', 'music_new_failed.json')
const LOCK_FILE = OUTPUT_FILE + '.lock'

// ===== File lock（只在讀寫時短暫持有）=====
function waitForLock(maxWaitMs = 10000) {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    try {
      fs.writeFileSync(LOCK_FILE, String(process.pid), { flag: 'wx' })
      return true
    } catch {
      // 檢查持有者是否還活著
      try {
        const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'))
        process.kill(pid, 0)
      } catch {
        // 持有者已死，搶過來
        try { fs.unlinkSync(LOCK_FILE) } catch { /* ignore */ }
        continue
      }
      // 等一下再試
      const waitUntil = Date.now() + 100
      while (Date.now() < waitUntil) { /* spin */ }
    }
  }
  return false
}

function releaseLock() {
  try { fs.unlinkSync(LOCK_FILE) } catch { /* ignore */ }
}

/**
 * 安全讀取 JSON 檔（帶 lock）
 */
function readJsonSafe(filePath) {
  if (!waitForLock()) {
    throw new Error(`無法取得檔案鎖（${LOCK_FILE}），可能有其他程序正在寫入，請稍後再試`)
  }
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    }
    return []
  } finally {
    releaseLock()
  }
}

/**
 * 安全寫入 JSON 檔（帶 lock，先讀再合併再寫）
 */
function saveResults(newItems, failedItems) {
  if (!waitForLock()) {
    throw new Error(`無法取得檔案鎖（${LOCK_FILE}），可能有其他程序正在寫入，請稍後再試`)
  }
  try {
    // 讀取最新的檔案內容（可能被另一個 process 更新過）
    let existing = []
    if (fs.existsSync(OUTPUT_FILE)) {
      existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'))
    }
    const existingIds = new Set(existing.map(m => m.youtubeId))

    // 只加入不重複的
    for (const item of newItems) {
      if (!existingIds.has(item.youtubeId)) {
        item.id = `music-${String(existing.length + 1).padStart(3, '0')}`
        existing.push(item)
        existingIds.add(item.youtubeId)
      }
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existing, null, 2), 'utf8')

    // failed
    if (failedItems.length > 0) {
      let existingFailed = []
      if (fs.existsSync(FAILED_FILE)) {
        try { existingFailed = JSON.parse(fs.readFileSync(FAILED_FILE, 'utf8')) } catch { /* ignore */ }
      }
      const failedIds = new Set(existingFailed.map(m => m.youtubeId))
      for (const item of failedItems) {
        if (!failedIds.has(item.youtubeId)) {
          existingFailed.push(item)
        }
      }
      fs.writeFileSync(FAILED_FILE, JSON.stringify(existingFailed, null, 2), 'utf8')
    }
  } finally {
    releaseLock()
  }
}

// ===== 工具函數 =====

/**
 * 用 yt-dlp 獲取播放列表中所有視頻的標題和 ID
 */
function fetchPlaylistVideos(url) {
  console.log('🎬 正在從 YouTube 播放列表爬取視頻...')

  try {
    const output = execFileSync('yt-dlp', ['-j', '--flat-playlist', url], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 })

    const videos = []
    let adSkipped = 0
    for (const line of output.trim().split('\n')) {
      if (!line.trim()) continue
      try {
        const json = JSON.parse(line)
        if (!json.title || !json.id) continue
        if (json.duration && (json.duration < 30 || json.duration > 480)) { adSkipped++; continue }
        const t = json.title.toLowerCase()
        if (t.includes('廣告') || t.includes('广告') || t.includes('ad ') || t.includes('advertisement')) { adSkipped++; continue }
        if (json.id.length < 8) { adSkipped++; continue }
        videos.push({ id: json.id, title: json.title })
      } catch (e) { /* skip */ }
    }
    if (adSkipped > 0) console.log(`🚫 跳過 ${adSkipped} 個疑似廣告`)

    console.log(`✅ 獲得 ${videos.length} 個視頻`)
    return videos
  } catch (err) {
    console.error('❌ yt-dlp 執行失敗:', err.message)
    console.error('請先安裝 yt-dlp，可用其中一種方式：')
    console.error('  • macOS(Homebrew): brew install yt-dlp')
    console.error('  • pipx: pipx install yt-dlp')
    console.error('  • Python: pip3 install yt-dlp')
    process.exit(1)
  }
}

/**
 * 用 yt-dlp 獲取單支影片的上傳年份
 */
function fetchUploadYear(videoId) {
  try {
    const output = execFileSync(
      'yt-dlp',
      ['--print', 'upload_date', '--no-download', `https://www.youtube.com/watch?v=${videoId}`],
      { encoding: 'utf8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim()
    if (/^\d{8}$/.test(output)) {
      return parseInt(output.slice(0, 4))
    }
    return null
  } catch (err) {
    return null
  }
}

/**
 * 從 YouTube 標題中提取乾淨的歌名
 */
function extractSongName(rawTitle) {
  let t = rawTitle

  // 移除常見後綴 / 雜訊
  t = t
    .replace(/\s*[\[\(【（]?\s*(Official|MV|Music Video|Audio|Lyrics?|HD|HQ|M\/V|歌詞|完整版|高音質|畫質.*?版|數位修復|詞曲\s*[:：].*)/gi, '')
    .replace(/[\]】）)]/g, '')
    .replace(/[\[【（(]/g, '')

  // 提取《》或〈〉內的歌名（最可靠）
  const angleMatch = t.match(/[《〈](.+?)[》〉]/)
  if (angleMatch) return angleMatch[1].trim()

  // 提取 "歌手 - 歌名" 或 "歌手 / 歌名" 格式
  const dashMatch = t.match(/[-–—\/]\s*(.+)/)
  if (dashMatch) {
    let songPart = dashMatch[1].trim()
    songPart = songPart.replace(/[~～].*/g, '').trim()
    if (songPart.length >= 2) return songPart
  }

  // 移除 ~ 之後的內容
  t = t.replace(/[~～].*/g, '').trim()

  // 最後手段：移除英文名 / 拼音，保留中文部分
  const chineseOnly = t.replace(/[a-zA-Z\-']+/g, ' ').replace(/\s+/g, ' ').trim()
  if (chineseOnly.length >= 2) return chineseOnly

  return t.trim()
}

/**
 * 從 YouTube 標題中提取歌手名
 */
function extractArtistName(rawTitle) {
  let t = rawTitle

  // 移除前綴 【原唱】【MV】等
  t = t.replace(/^[\[【（(][^\]】）)]*[\]】）)]\s*/g, '')

  // 方法 1: 取《》前面的部分作為歌手
  const angleIdx = t.indexOf('《')
  if (angleIdx > 0) {
    let artist = t.slice(0, angleIdx).trim()
    artist = artist.replace(/\s+[a-zA-Z][\w\s\-']*$/, '').trim()
    if (artist.length >= 2) return artist
  }

  // 方法 2: 取 - / – / — 前面的部分
  const dashMatch = t.match(/^(.+?)\s*[-–—\/]\s*/)
  if (dashMatch) {
    let artist = dashMatch[1].trim()
    artist = artist.replace(/\s+[a-zA-Z][\w\s\-']*$/, '').trim()
    if (artist.length >= 2) return artist
  }

  return ''
}

/**
 * 根據年份決定 tags 和難度
 */
function getTagsAndDifficulty(year) {
  const decade = Math.floor(year / 10) * 10
  const tag = decade >= 1960 ? `${decade}s` : 'classic'

  let difficulty = 'easy'
  if (year < 2000) difficulty = 'hard'
  else if (year < 2010) difficulty = 'medium'

  return { tags: [...extraTags, tag], difficulty }
}

// ===== 主程式 =====

async function main() {
  console.log('\n🎵 YouTube 播放列表爬蟲 → music_new.json\n')
  console.log(`📺 播放列表: ${playlistUrl}`)
  if (fromIndex > 0) console.log(`⏩ 從第 ${fromIndex + 1} 首開始`)
  if (randomCount > 0) console.log(`🎲 隨機抽 ${randomCount} 首`)
  if (extraTags.length > 0) console.log(`🏷️  額外標籤: ${extraTags.join(', ')}`)
  console.log()

  // 1. 爬取播放列表
  let videos = fetchPlaylistVideos(playlistUrl)
  if (videos.length === 0) {
    console.error('❌ 無法取得任何視頻')
    process.exit(1)
  }

  // 讀取已有的 youtubeId（用 lock 安全讀取）
  const existingData = readJsonSafe(OUTPUT_FILE)
  const existingIds = new Set(existingData.map(m => m.youtubeId))
  if (existingData.length > 0) console.log(`📂 已有 ${existingData.length} 筆舊資料`)

  // 隨機抽樣：過濾已存在的，再隨機取 n 首
  if (randomCount > 0) {
    const newVideos = videos.filter(v => !existingIds.has(v.id))
    console.log(`📋 未爬過的有 ${newVideos.length} 首`)
    for (let i = newVideos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newVideos[i], newVideos[j]] = [newVideos[j], newVideos[i]]
    }
    videos = newVideos.slice(0, randomCount)
    console.log(`🎲 隨機選了 ${videos.length} 首`)
  }

  // 2. 逐首取得上傳年份
  console.log(`\n🔍 正在取得 YouTube 上傳年份...\n`)

  let successCount = 0
  let failedCount = 0
  const pendingSuccess = []
  const pendingFailed = []

  const startIdx = randomCount > 0 ? 0 : fromIndex
  const total = videos.length

  for (let i = startIdx; i < total; i++) {
    const video = videos[i]
    const progress = `[${i + 1}/${total}]`

    if (existingIds.has(video.id)) {
      console.log(`${progress} ⏭️  已存在，跳過`)
      continue
    }

    const songName = extractSongName(video.title)
    const artistName = extractArtistName(video.title)
    process.stdout.write(`${progress} "${songName}"${artistName ? ` (${artistName})` : ''} ... `)

    const year = fetchUploadYear(video.id)

    if (year) {
      const { tags, difficulty } = getTagsAndDifficulty(year)
      const finalTitle = s2t(video.title)
      const finalArtist = s2t(artistName || '')

      pendingSuccess.push({
        id: '',
        title: finalTitle,
        artist: finalArtist,
        year,
        spotifyId: '',
        albumArt: '',
        tags,
        difficulty,
        youtubeId: video.id
      })
      existingIds.add(video.id)

      successCount++
      const artistStr = finalArtist ? ` / ${finalArtist}` : ''
      console.log(`✅ ${year} "${finalTitle}"${artistStr}`)
    } else {
      failedCount++
      const finalTitle = s2t(video.title)
      const finalArtist = s2t(artistName || '')
      pendingFailed.push({
        id: '',
        title: finalTitle,
        artist: finalArtist,
        year: null,
        spotifyId: '',
        albumArt: '',
        tags: [...extraTags],
        difficulty: '',
        youtubeId: video.id
      })
      console.log('❌')
    }

    // 每 10 首 flush 到檔案（lock → 讀最新 → 合併 → 寫 → unlock）
    if ((i + 1) % 10 === 0 && (pendingSuccess.length > 0 || pendingFailed.length > 0)) {
      saveResults(pendingSuccess, pendingFailed)
      pendingSuccess.length = 0
      pendingFailed.length = 0
    }
  }

  // 3. 最終 flush 剩餘的
  if (pendingSuccess.length > 0 || pendingFailed.length > 0) {
    saveResults(pendingSuccess, pendingFailed)
  }

  // 4. 統計
  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ 成功: ${successCount}`)
  console.log(`❌ 失敗: ${failedCount}`)
  if (successCount + failedCount > 0) {
    console.log(`📊 成功率: ${((successCount / (successCount + failedCount)) * 100).toFixed(1)}%`)
  }
  console.log(`💾 已存檔: ${OUTPUT_FILE}`)
  if (failedCount > 0) {
    console.log(`📋 失敗清單: music_new_failed.json（可手動補年份）`)
  }

  console.log(`\n📝 範例:`)
  const final = readJsonSafe(OUTPUT_FILE)
  final.slice(-3).forEach((m) => {
    const a = m.artist ? ` - ${m.artist}` : ''
    console.log(`   "${m.title}"${a} (${m.year}) [${m.youtubeId}]`)
  })
}

main().catch(err => {
  console.error('❌ 錯誤:', err)
  process.exit(1)
})
