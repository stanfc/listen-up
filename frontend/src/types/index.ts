/**
 * Core Game Types and Interfaces
 */

// Enums
export enum GameStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
  PAUSED = 'paused'
}

export enum GamePhase {
  SONG_GUESS = 'song_guess',
  CARD_PLACEMENT = 'card_placement',
  CHALLENGE = 'challenge',
  ROUND_END = 'round_end'
}

export enum GuessType {
  SONG = 'song'
}

export enum GuessResult {
  CORRECT = 'correct',
  INCORRECT = 'incorrect',
  PARTIAL = 'partial'
}

// Music related types
export interface Music {
  id: string
  title: string
  artist: string
  year: number
  spotifyId: string
  youtubeId: string
  albumArt: string
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface Card {
  id: string
  musicId: string
  title: string
  artist: string
  year: number
  position?: number
}

// Player related types
export interface Player {
  id: string
  name: string
  tokens: number
  cards: Card[]
  isCurrentPlayer: boolean
  guessedCorrectSongInRound?: boolean
}

// Game Config
export interface GameConfig {
  maxPlayers: number
  minPlayers?: number
  winningCards: number
  musicTags: string[]
  maxRounds?: number
  tokenPointsK?: number
}

// Game State
export interface GameRound {
  roundNumber: number
  currentPlayer: string
  musicId: string
  phase: GamePhase
  usedMusicIds: string[]
  correctGuessPlayer?: string
  pendingCard?: Card
  challengeCard?: Card
  placedPosition?: number
}

export interface Game {
  id: string
  roomCode: string
  status: GameStatus
  config: GameConfig
  players: Player[]
  currentRound: GameRound
  createdAt: string
  updatedAt: string
  finishedAt?: string
  winner?: string
  deuce?: boolean
}

// API Request/Response types
export interface CreateGameRequest {
  maxPlayers: number
  winningCards: number
  musicTags: string[]
  tokenPointsK?: number
}

export interface CreateGameResponse {
  gameId: string
  roomCode: string
}

export interface AddPlayerRequest {
  playerName: string
}

export interface AddPlayerResponse {
  playerId: string
  player: Player
}

export interface GetMusicResponse {
  id: string
  youtubeId: string
  spotifyId: string
}

export interface RevealMusicResponse {
  title: string
  artist: string
  year: number
  albumArt: string
  spotifyId: string
}

export interface SubmitGuessRequest {
  playerId: string
  guessType: GuessType
  guess: string | number
  usingToken?: boolean
}

export interface SubmitGuessResponse {
  result: GuessResult
  message: string
  nextPhase?: GamePhase
  player?: Player
  correctAnswer?: string | number
  awardedTokens?: number
  cardEarned?: Card
}

export interface GameStateResponse {
  game: Game
  currentPlayer: Player
  musicUrl?: string
}

// Error types
export interface ApiError {
  code: string
  message: string
  details?: any
}
