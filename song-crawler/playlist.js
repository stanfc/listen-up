/**
 * Playlist persistence — reads/writes the music.json for the game
 */

import fs from 'fs'
import path from 'path'

const PLAYLIST_PATH = path.resolve(import.meta.dirname, '../backend/data/music.json')

export function loadPlaylist() {
  if (!fs.existsSync(PLAYLIST_PATH)) return []
  const raw = fs.readFileSync(PLAYLIST_PATH, 'utf-8')
  return JSON.parse(raw || '[]')
}

export function savePlaylist(songs) {
  fs.writeFileSync(PLAYLIST_PATH, JSON.stringify(songs, null, 2), 'utf-8')
}

/**
 * Check if a Spotify track ID already exists in the playlist
 */
export function hasSpotifyId(playlist, spotifyId) {
  return playlist.some(s => s.spotifyId === spotifyId)
}

/**
 * Check if an artist already has enough songs in the playlist (for diversity)
 */
export function countByArtist(playlist, artistName) {
  const norm = artistName.toLowerCase().trim()
  return playlist.filter(s => s.artist.toLowerCase().trim() === norm).length
}

/**
 * Generate the next music ID (music-001, music-002, ...)
 */
export function nextMusicId(playlist) {
  const maxNum = playlist.reduce((max, s) => {
    const m = s.id.match(/^music-(\d+)$/)
    return m ? Math.max(max, parseInt(m[1], 10)) : max
  }, 0)
  return `music-${String(maxNum + 1).padStart(3, '0')}`
}
