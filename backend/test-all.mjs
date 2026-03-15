import 'dotenv/config'

const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'grant_type=client_credentials'
})

const tokenData = await tokenRes.json()
const accessToken = tokenData.access_token

// 讀取 music.json
const musicRes = await fetch('file:///D:/A_desktop/my_project/猜歌王/backend/data/music.json')
const music = JSON.parse(await musicRes.text())

let hasPreview = 0
let noPreview = 0

for (const song of music.slice(0, 20)) {  // 測試前20首
  const url = new URL(`https://api.spotify.com/v1/tracks/${song.spotifyId}`)
  url.searchParams.set('market', 'TW')

  const res = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })

  if (res.ok) {
    const data = await res.json()
    if (data.preview_url) {
      hasPreview++
      console.log(`✅ ${song.title} — ${data.preview_url.substring(0, 50)}...`)
    } else {
      noPreview++
    }
  }
}

console.log(`\n統計：有試聽 ${hasPreview}首，無試聽 ${noPreview}首`)
