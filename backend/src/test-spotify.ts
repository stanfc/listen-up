#!/usr/bin/env node

/**
 * 測試 Spotify API 連線
 */

import 'dotenv/config'
import { getSpotifyToken } from './spotify'

async function testSpotify() {
  console.log('🧪 測試 Spotify API 連線...\n')

  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    console.error('❌ 錯誤：SPOTIFY_CLIENT_ID 或 SPOTIFY_CLIENT_SECRET 未設定')
    process.exit(1)
  }

  try {
    const testSpotifyId = '0fQla3BOmDbwE7e6I78LbZ' // 錯的人 - Elva Hsiao（確定存在）

    console.log('📤 取得 Token...')
    const token = await getSpotifyToken()
    console.log(`✅ Token 取得成功 (長度: ${token.length})\n`)

    console.log('📤 查詢 Spotify Track 詳細資訊...')
    const res = await fetch(`https://api.spotify.com/v1/tracks/${testSpotifyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`API 呼叫失敗 (${res.status}): ${errText}`)
    }

    const track = await res.json() as any
    console.log('\n✅ 完整 API 回應：')
    console.log(JSON.stringify(track, null, 2))

    console.log('\n📊 關鍵字段：')
    console.log(`   • Track ID: ${track.id}`)
    console.log(`   • Track Name: ${track.name}`)
    console.log(`   • Artists: ${track.artists.map((a: any) => a.name).join(' / ')}`)
    console.log(`   • Release Date: ${track.album?.release_date}`)
    console.log(`   • Preview URL: ${track.preview_url || '(null - 無試聽版本)'}`)
    console.log(`   • Album Images: ${track.album?.images?.length || 0} 張`)
    if (track.album?.images?.length) {
      track.album.images.forEach((img: any, idx: number) => {
        console.log(`       [${idx}] ${img.width}x${img.height} - ${img.url.substring(0, 50)}...`)
      })
    }

    console.log(`\n✨ 一切正常，可以開始遊戲了`)
  } catch (err: any) {
    console.error(`\n❌ Spotify API 無法連線：`)
    console.error(`   ${err.message}`)
    console.error(`\n💡 檢查項目：`)
    console.error(`   1. SPOTIFY_CLIENT_ID 和 SPOTIFY_CLIENT_SECRET 是否正確？`)
    console.error(`   2. API credentials 是否過期？`)
    console.error(`   3. 網路連線是否正常？`)
    process.exit(1)
  }
}

testSpotify()
