/**
 * Spotify API client — Client Credentials flow
 * Used to look up spotifyId and albumArt for songs found via web search + LLM.
 */

let cachedToken = null

export async function getToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken
  }

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env')
  }

  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`)

  const data = await res.json()
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000
  }
  return cachedToken.accessToken
}

async function spotifyGet(path, params = {}) {
  const token = await getToken()
  const url = new URL(`https://api.spotify.com/v1${path}`)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  })

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('retry-after') || '2', 10)
      console.log(`  ⏳ Rate limited, waiting ${retryAfter}s...`)
      await sleep((retryAfter + 1) * 1000)
      continue
    }

    if (!res.ok) throw new Error(`Spotify API ${path} failed: ${res.status}`)
    return res.json()
  }

  throw new Error(`Spotify API ${path} failed after 3 retries`)
}

/**
 * Search Spotify for a specific song by title + artist.
 * Returns { spotifyId, albumArt, title, artist, year } or null if not found.
 */
export async function lookupSong(title, artist) {
  // Try exact search first
  const query = `track:${title} artist:${artist}`
  const data = await spotifyGet('/search', {
    q: query,
    type: 'track',
    limit: 5,
    market: 'TW'
  })

  const tracks = data.tracks?.items || []

  if (tracks.length === 0) {
    // Fallback: looser search
    const fallbackData = await spotifyGet('/search', {
      q: `${title} ${artist}`,
      type: 'track',
      limit: 5,
      market: 'TW'
    })
    tracks.push(...(fallbackData.tracks?.items || []))
  }

  if (tracks.length === 0) return null

  // Pick the best match (first result is usually best)
  const track = tracks[0]

  const images = track.album?.images || []
  const albumArt = (images.find(img => img.width >= 200 && img.width <= 640) || images[0])?.url || ''

  return {
    spotifyId: track.id,
    albumArt,
    spotifyTitle: track.name,
    spotifyArtist: track.artists.map(a => a.name).join(' / '),
    spotifyYear: parseInt(track.album?.release_date?.substring(0, 4), 10) || null
  }
}

/**
 * Get a track directly by Spotify ID.
 * Returns the full track object.
 */
export async function getTrackById(spotifyId) {
  return spotifyGet(`/tracks/${spotifyId}`, { market: 'TW' })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
