export class ValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Validate game configuration
export function validateGameConfig(maxPlayers: number, winningCards: number, musicTags: string[]): void {
  if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 8) {
    throw new ValidationError('maxPlayers must be between 2 and 8', 'INVALID_MAX_PLAYERS')
  }

  if (!Number.isInteger(winningCards) || winningCards < 3 || winningCards > 10) {
    throw new ValidationError('winningCards must be between 3 and 10', 'INVALID_WINNING_CARDS')
  }

  if (!Array.isArray(musicTags) || musicTags.length === 0) {
    throw new ValidationError('musicTags must be a non-empty array', 'INVALID_MUSIC_TAGS')
  }

  if (musicTags.some(tag => typeof tag !== 'string' || tag.trim().length === 0)) {
    throw new ValidationError('all musicTags must be non-empty strings', 'INVALID_TAG_FORMAT')
  }
}

// Validate player name
export function validatePlayerName(name: string): void {
  if (typeof name !== 'string') {
    throw new ValidationError('Player name must be a string', 'INVALID_PLAYER_NAME_TYPE')
  }

  if (name.trim().length === 0) {
    throw new ValidationError('Player name cannot be empty', 'EMPTY_PLAYER_NAME')
  }

  if (name.length > 20) {
    throw new ValidationError('Player name cannot exceed 20 characters', 'PLAYER_NAME_TOO_LONG')
  }

  if (!/^[\w\s\u4e00-\u9fa5]+$/.test(name)) {
    throw new ValidationError('Player name contains invalid characters', 'INVALID_PLAYER_NAME_FORMAT')
  }
}

// Validate player count
export function validatePlayerCount(currentCount: number, maxPlayers: number): void {
  if (currentCount >= maxPlayers) {
    throw new ValidationError('Game is full, cannot add more players', 'GAME_FULL')
  }
}

// Validate song guess
export function validateSongGuess(guess: string): void {
  if (typeof guess !== 'string') {
    throw new ValidationError('Song guess must be a string', 'INVALID_SONG_GUESS_TYPE')
  }

  if (guess.trim().length === 0) {
    throw new ValidationError('Song guess cannot be empty', 'EMPTY_SONG_GUESS')
  }

  if (guess.length > 100) {
    throw new ValidationError('Song guess is too long', 'SONG_GUESS_TOO_LONG')
  }
}

// Validate year guess
export function validateYearGuess(guess: number): void {
  if (!Number.isInteger(guess)) {
    throw new ValidationError('Year guess must be an integer', 'INVALID_YEAR_GUESS_TYPE')
  }

  if (guess < 1900 || guess > new Date().getFullYear() + 1) {
    throw new ValidationError(
      `Year guess must be between 1900 and ${new Date().getFullYear() + 1}`,
      'YEAR_OUT_OF_RANGE'
    )
  }
}

// Validate card placement position
export function validateCardPosition(position: number, cardsLength: number): void {
  if (!Number.isInteger(position) || position < 0 || position > cardsLength) {
    throw new ValidationError(
      `Position must be between 0 and ${cardsLength}`,
      'INVALID_CARD_POSITION'
    )
  }
}

// Validate player ID
export function validatePlayerId(playerId: string): void {
  if (typeof playerId !== 'string' || playerId.trim().length === 0) {
    throw new ValidationError('Invalid player ID', 'INVALID_PLAYER_ID')
  }
}

// Validate game ID
export function validateGameId(gameId: string): void {
  if (typeof gameId !== 'string' || gameId.trim().length === 0) {
    throw new ValidationError('Invalid game ID', 'INVALID_GAME_ID')
  }
}
