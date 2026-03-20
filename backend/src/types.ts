// Backend type definitions (can be shared with frontend)

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

export interface Player {
  id: string
  name: string
  tokens: number
  cards: Card[]
  isCurrentPlayer: boolean
  guessedCorrectSongInRound?: boolean
}

export interface GameConfig {
  maxPlayers: number
  minPlayers?: number
  winningCards: number
  musicTags: string[]
  maxRounds?: number
  tokenPointsK?: number  // Every k tokens = 1 point. 0 or undefined = disabled
}

export interface GameRound {
  roundNumber: number
  currentPlayer: string
  musicId: string
  phase: GamePhase
  usedMusicIds: string[]
  correctGuessPlayer?: string
  pendingCard?: Card
  // Challenge phase data
  challengeCard?: Card
  placementWrong?: boolean
  placedPosition?: number
  // Round tracking — a "full round" = every player gets one turn
  startingPlayerId: string      // Who started this full round
  turnIndex: number             // How many players have played this full round (0-based)
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
  deuce?: boolean               // True when in deuce mode (someone reached winningCards but tied)
}

export interface GameDatabase {
  [gameId: string]: Game
}
