#!/usr/bin/env node

/**
 * 從 log.txt 恢復 YouTube ID 到 music.json
 *
 * log.txt 格式：
 * [1/352] 歌名 — 歌手 ... 🔍 ✅ youtubeId
 */

import fs from 'fs'
import path from 'path'
import { loadPlaylist, savePlaylist } from './playlist.js'

function parseLogFile(logPath) {
  const content = fs.readFileSync(logPath, 'utf8')
  const lines = content.split('\n').filter(line => line.trim())

  console.log(`📄 讀取 ${lines.length} 行`)

  const results = {}

  for (const line of lines) {
    // 清除行尾的 \r\n
    const cleanLine = line.trim()

    // 匹配格式：[N/M] 歌名 — 歌手 ... 🔍 ✅ youtubeId
    const match = cleanLine.match(/\] (.+?) — (.+?) \.\.\. 🔍 ✅ (.+)$/)
    if (match) {
      const [, title, artist, youtubeId] = match
      const key = `${title}|${artist}`
      results[key] = youtubeId.trim()
    }
  }

  return results
}

function main() {
  console.log('🔄 從 log.txt 恢復 YouTube ID...\n')

  // log.txt 在上一層目錄（相對於 song-crawler）
  const logPath = path.resolve('.', '..', 'log.txt')

  if (!fs.existsSync(logPath)) {
    console.error('❌ 找不到 log.txt 於', logPath)
    process.exit(1)
  }

  // 解析 log
  const youtubeIds = parseLogFile(logPath)
  console.log(`📋 從 log 解析出 ${Object.keys(youtubeIds).length} 個 YouTube ID\n`)

  // 顯示前 3 個
  const keys = Object.keys(youtubeIds).slice(0, 3)
  console.log('範例:')
  for (const key of keys) {
    console.log(`  "${key}" → ${youtubeIds[key]}`)
  }
  console.log()

  // 讀取 music.json
  const playlist = loadPlaylist()
  console.log(`📀 讀取 music.json (${playlist.length} 首歌)\n`)

  let updated = 0
  let skipped = 0
  let notFound = 0

  for (const song of playlist) {
    const key = `${song.title}|${song.artist}`

    if (youtubeIds[key]) {
      song.youtubeId = youtubeIds[key]
      updated++
    } else if (song.youtubeId) {
      // 已經有 youtubeId，跳過
      skipped++
    } else {
      // 沒找到
      notFound++
    }
  }

  // 顯示結果
  console.log(`${'═'.repeat(50)}`)
  console.log(`✅ 已更新: ${updated}`)
  console.log(`⏭️  已有:   ${skipped}`)
  console.log(`❌ 缺失:   ${notFound}`)

  // 保存
  savePlaylist(playlist)
  console.log(`\n💾 已存檔 music.json`)
}

main()
