import * as fs from 'fs'
import * as path from 'path'
import { Game, GameDatabase, Music } from './types'

// If /data volume exists (Fly.io), use it for games; otherwise fall back to local
const VOLUME_PATH = '/data'
const useVolume = fs.existsSync(VOLUME_PATH)
const GAMES_DB_PATH = useVolume
  ? path.join(VOLUME_PATH, 'games.json')
  : path.join(__dirname, '../data/games.json')
const MUSIC_DB_PATH = path.join(__dirname, '../data/music_new.json')

// Initialize games database if not exists
function initGamesDb() {
  if (!fs.existsSync(GAMES_DB_PATH)) {
    fs.writeFileSync(GAMES_DB_PATH, JSON.stringify({}, null, 2))
  }
}

// Load all games
export function loadGames(): GameDatabase {
  initGamesDb()
  const data = fs.readFileSync(GAMES_DB_PATH, 'utf-8')
  return JSON.parse(data || '{}')
}

// Save all games
export function saveGames(games: GameDatabase): void {
  fs.writeFileSync(GAMES_DB_PATH, JSON.stringify(games, null, 2))
}

// Get single game
export function getGame(gameId: string): Game | null {
  const games = loadGames()
  return games[gameId] || null
}

// Find game by room code
export function getGameByRoomCode(roomCode: string): Game | null {
  const games = loadGames()
  for (const id of Object.keys(games)) {
    if (games[id].roomCode === roomCode.toUpperCase()) {
      return games[id]
    }
  }
  return null
}

// Create game
export function createGame(game: Game): Game {
  const games = loadGames()
  games[game.id] = game
  saveGames(games)
  return game
}

// Update game
export function updateGame(gameId: string, updates: Partial<Game>): Game | null {
  const games = loadGames()
  const game = games[gameId]
  if (!game) return null

  const updated = { ...game, ...updates, updatedAt: new Date().toISOString() }
  games[gameId] = updated
  saveGames(games)
  return updated
}

// Load all music
export function loadMusic(): Music[] {
  const data = fs.readFileSync(MUSIC_DB_PATH, 'utf-8')
  return JSON.parse(data || '[]')
}

// Get music by ID
export function getMusicById(musicId: string): Music | null {
  const music = loadMusic()
  return music.find(m => m.id === musicId) || null
}

// Get all available tags
export function getAllMusicTags(): string[] {
  const music = loadMusic()
  const tags = new Set<string>()
  music.forEach(m => {
    m.tags.forEach(tag => tags.add(tag))
  })
  return Array.from(tags).sort()
}

// Filter music by tags
export function filterMusicByTags(tags: string[]): Music[] {
  const music = loadMusic()
  if (!tags || tags.length === 0) {
    return music
  }

  // Split tags into year tags (e.g. "1990s", "2000s") and other tags
  const yearTags = tags.filter(t => /^\d{4}s$/.test(t))
  const otherTags = tags.filter(t => !/^\d{4}s$/.test(t))

  return music.filter(m => {
    // Year tags: union (any year matches)
    const yearMatch = yearTags.length === 0 || yearTags.some(t => m.tags.includes(t))
    // Other tags: union (any other tag matches)
    const otherMatch = otherTags.length === 0 || otherTags.some(t => m.tags.includes(t))
    // Intersect the two groups
    return yearMatch && otherMatch
  })
}

// Cleanup old games (older than maxAgeMs, default 24h)
export function cleanupOldGames(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
  const games = loadGames()
  const now = Date.now()
  let removed = 0

  for (const id of Object.keys(games)) {
    const updatedAt = new Date(games[id].updatedAt).getTime()
    if (now - updatedAt > maxAgeMs) {
      delete games[id]
      removed++
    }
  }

  if (removed > 0) {
    saveGames(games)
  }
  return removed
}

// Generate room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Utility: Normalize song title for comparison
export function normalizeSongTitle(title: string): string {
  return title.toLowerCase().trim().replace(/[^\w\s]/g, '')
}

// Utility: Check if year guess is correct (allow ±2 year tolerance)
export function isYearCorrect(guess: number, actual: number, tolerance: number = 2): boolean {
  return Math.abs(guess - actual) <= tolerance
}

// Utility: Calculate year tolerance based on difficulty
export function getYearTolerance(difficulty: 'easy' | 'medium' | 'hard'): number {
  switch (difficulty) {
    case 'easy':
      return 4
    case 'medium':
      return 2
    case 'hard':
      return 1
    default:
      return 2
  }
}
