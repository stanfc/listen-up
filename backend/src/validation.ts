export class ValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Validate game configuration
export function validateGameConfig(maxPlayers: number, winningCards: number, musicTags: string[]): void {
  if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 8) {
    throw new ValidationError('最大玩家數必須介於 2 到 8 之間', 'INVALID_MAX_PLAYERS')
  }

  if (!Number.isInteger(winningCards) || winningCards < 3 || winningCards > 10) {
    throw new ValidationError('勝利所需卡牌數必須介於 3 到 10 之間', 'INVALID_WINNING_CARDS')
  }

  if (!Array.isArray(musicTags)) {
    throw new ValidationError('音樂標籤必須為陣列', 'INVALID_MUSIC_TAGS')
  }

  if (musicTags.length > 0 && musicTags.some(tag => typeof tag !== 'string' || tag.trim().length === 0)) {
    throw new ValidationError('所有音樂標籤必須為非空字串', 'INVALID_TAG_FORMAT')
  }
}

// Validate player name
export function validatePlayerName(name: string): void {
  if (typeof name !== 'string') {
    throw new ValidationError('玩家名稱必須為字串', 'INVALID_PLAYER_NAME_TYPE')
  }

  if (name.trim().length === 0) {
    throw new ValidationError('玩家名稱不能為空', 'EMPTY_PLAYER_NAME')
  }

  if (name.length > 20) {
    throw new ValidationError('玩家名稱不能超過 20 個字元', 'PLAYER_NAME_TOO_LONG')
  }

  if (!/^[\w\s\u4e00-\u9fa5]+$/.test(name)) {
    throw new ValidationError('玩家名稱包含無效字元', 'INVALID_PLAYER_NAME_FORMAT')
  }
}

// Validate player count
export function validatePlayerCount(currentCount: number, maxPlayers: number): void {
  if (currentCount >= maxPlayers) {
    throw new ValidationError('遊戲已滿，無法新增更多玩家', 'GAME_FULL')
  }
}

// Validate song guess
export function validateSongGuess(guess: string): void {
  if (typeof guess !== 'string') {
    throw new ValidationError('猜歌答案必須為字串', 'INVALID_SONG_GUESS_TYPE')
  }

  if (guess.trim().length === 0) {
    throw new ValidationError('猜歌答案不能為空', 'EMPTY_SONG_GUESS')
  }

  if (guess.length > 100) {
    throw new ValidationError('猜歌答案過長', 'SONG_GUESS_TOO_LONG')
  }
}

// Validate year guess
export function validateYearGuess(guess: number): void {
  if (!Number.isInteger(guess)) {
    throw new ValidationError('年份猜測必須為整數', 'INVALID_YEAR_GUESS_TYPE')
  }

  if (guess < 1900 || guess > new Date().getFullYear() + 1) {
    throw new ValidationError(
      `年份猜測必須介於 1900 到 ${new Date().getFullYear() + 1} 之間`,
      'YEAR_OUT_OF_RANGE'
    )
  }
}

// Validate card placement position
export function validateCardPosition(position: number, cardsLength: number): void {
  if (!Number.isInteger(position) || position < 0 || position > cardsLength) {
    throw new ValidationError(
      `位置必須介於 0 到 ${cardsLength} 之間`,
      'INVALID_CARD_POSITION'
    )
  }
}

// Validate player ID
export function validatePlayerId(playerId: string): void {
  if (typeof playerId !== 'string' || playerId.trim().length === 0) {
    throw new ValidationError('無效的玩家 ID', 'INVALID_PLAYER_ID')
  }
}

// Validate game ID
export function validateGameId(gameId: string): void {
  if (typeof gameId !== 'string' || gameId.trim().length === 0) {
    throw new ValidationError('無效的遊戲 ID', 'INVALID_GAME_ID')
  }
}
