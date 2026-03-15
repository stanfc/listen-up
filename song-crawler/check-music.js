#!/usr/bin/env node
/**
 * 檢視 music_new.json 中第 k ~ k+10 筆資料
 * 用法: node check-music.js [start_index]
 *   node check-music.js        → 顯示第 0~9 筆
 *   node check-music.js 10     → 顯示第 10~19 筆
 */
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.resolve('.', '..', 'backend', 'data', 'music_new.json')
const start = parseInt(process.argv[2]) || 0
const count = 10

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
const end = Math.min(start + count, data.length)

console.log(`\n📋 music_new.json  (共 ${data.length} 筆，顯示 #${start} ~ #${end - 1})\n`)
console.log('idx | title                          | artist       | year')
console.log('----|--------------------------------|--------------|-----')

for (let i = start; i < end; i++) {
  const m = data[i]
  const title = m.title.slice(0, 30).padEnd(30)
  const artist = (m.artist || '').slice(0, 12).padEnd(12)
  console.log(`${String(i).padStart(3)} | ${title} | ${artist} | ${m.year}`)
}

console.log(`\n下一批: node check-music.js ${end}`)
