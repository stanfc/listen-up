const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

let cachedToken: { accessToken: string; expiresAt: number } | null = null

/**
 * Get Spotify access token using Client Credentials flow.
 * Caches the token until it expires (with 60s buffer).
 */
export async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Spotify token request failed (${response.status}): ${text}`)
  }

  const data = await response.json() as { access_token: string; expires_in: number }

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000 // refresh 60s early
  }

  return cachedToken.accessToken
}

/**
 * Get the preview URL for a Spotify track.
 * Returns null if no preview is available.
 */
export async function getPreviewUrl(spotifyId: string): Promise<string | null> {
  const token = await getSpotifyToken()

  const url = new URL(`${SPOTIFY_API_BASE}/tracks/${spotifyId}`)
  url.searchParams.set('market', 'TW') // Add market parameter for preview availability

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Spotify track request failed (${response.status}): ${text}`)
  }

  const track = await response.json() as { preview_url: string | null; album?: { images?: { url: string; width: number }[] } }
  return track.preview_url
}

/**
 * Get the album art URL for a Spotify track.
 * Prefers ~300px image, falls back to largest.
 */
export async function getAlbumArt(spotifyId: string): Promise<string | null> {
  const token = await getSpotifyToken()

  const url = new URL(`${SPOTIFY_API_BASE}/tracks/${spotifyId}`)
  url.searchParams.set('market', 'TW')

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) return null

  const track = await response.json() as { album?: { images?: { url: string; width: number }[] } }
  const images = track.album?.images || []
  const medium = images.find(img => img.width >= 200 && img.width <= 640)
  return (medium || images[0])?.url || null
}
