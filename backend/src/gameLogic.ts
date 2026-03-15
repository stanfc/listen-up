import { v4 as uuidv4 } from 'uuid'
import { Game, Player, Card, GameStatus, GamePhase, GameConfig, GameRound, Music, GuessType } from './types'
import {
  getGame,
  updateGame,
  getMusicById,
  filterMusicByTags,
  generateRoomCode,
  normalizeSongTitle,
  isYearCorrect,
  getYearTolerance
} from './database'

/**
 * Create a new game room
 */
export function createNewGame(config: GameConfig): Game {
  const gameId = `game-${uuidv4()}`
  const roomCode = generateRoomCode()
  const now = new Date().toISOString()

  const game: Game = {
    id: gameId,
    roomCode,
    status: GameStatus.WAITING,
    config,
    players: [],
    currentRound: {
      roundNumber: 0,
      currentPlayer: '',
      musicId: '',
      phase: GamePhase.SONG_GUESS,
      usedMusicIds: [],
      startingPlayerId: '',
      turnIndex: 0
    },
    createdAt: now,
    updatedAt: now
  }

  return game
}

/**
 * Add a player to the game
 */
export function addPlayerToGame(game: Game, playerName: string): Player {
  const playerId = `player-${uuidv4()}`

  // Create a default starting card for the player
  const startingCard: Card = {
    id: `card-${uuidv4()}`,
    musicId: 'starter',
    title: '起始卡牌',
    artist: 'System',
    year: 2012,
    position: 0
  }

  const player: Player = {
    id: playerId,
    name: playerName,
    tokens: 2, // Starting tokens
    cards: [startingCard], // Each player starts with 1 card
    isCurrentPlayer: false,
    guessedCorrectSongInRound: false
  }

  game.players.push(player)
  return player
}

/**
 * Start the game - shuffle players and pick first music
 */
export function startGame(game: Game): Game {
  if (game.status !== GameStatus.WAITING) {
    throw new Error('Game is not in waiting state')
  }

  const minPlayers = game.config.minPlayers || 2
  if (game.players.length < minPlayers || game.players.length > game.config.maxPlayers) {
    throw new Error('Invalid number of players')
  }

  // Shuffle players for random order
  const shuffledPlayers = shuffleArray([...game.players])
  shuffledPlayers.forEach(player => {
    const originalPlayer = game.players.find(p => p.id === player.id)
    if (originalPlayer) {
      originalPlayer.isCurrentPlayer = false
    }
  })

  game.players = shuffledPlayers
  game.status = GameStatus.PLAYING
  game.currentRound.roundNumber = 1
  game.currentRound.currentPlayer = game.players[0].id
  game.currentRound.startingPlayerId = game.players[0].id
  game.currentRound.turnIndex = 0
  game.players[0].isCurrentPlayer = true

  // Get first music
  const music = getNextMusic(game)
  if (music) {
    game.currentRound.musicId = music.id
    game.currentRound.phase = GamePhase.SONG_GUESS
  }

  return game
}

/**
 * Get next unplayed music with year-balanced weighting.
 * Each year has equal probability, then a random song is picked from that year.
 * This prevents years with many songs from dominating.
 */
export function getNextMusic(game: Game): Music | null {
  const filteredMusic = filterMusicByTags(game.config.musicTags)
  let availableMusic = filteredMusic.filter(
    m => !game.currentRound.usedMusicIds.includes(m.id)
  )

  if (availableMusic.length === 0) {
    game.currentRound.usedMusicIds = []
    availableMusic = filteredMusic
  }

  if (availableMusic.length === 0) return null

  // Separate year tags and other tags from config
  const allTags = game.config.musicTags || []
  const otherTags = allTags.filter(t => !/^\d{4}s$/.test(t))

  // Step 1: Group by year, pick a random year (equal probability)
  const byYear: Record<number, Music[]> = {}
  for (const m of availableMusic) {
    if (!byYear[m.year]) byYear[m.year] = []
    byYear[m.year].push(m)
  }
  const years = Object.keys(byYear).map(Number)
  const randomYear = years[Math.floor(Math.random() * years.length)]
  let pool = byYear[randomYear]

  // Step 2: If other tags exist, pick a random other tag, filter pool
  if (otherTags.length > 0) {
    const randomTag = otherTags[Math.floor(Math.random() * otherTags.length)]
    const tagged = pool.filter(m => m.tags.includes(randomTag))
    if (tagged.length > 0) pool = tagged
    // If no songs match that tag in this year, fall back to all songs in that year
  }

  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * Process song guess
 * If correct: +1 token, create pendingCard, move to CARD_PLACEMENT
 * If wrong: no change, move to CARD_PLACEMENT
 */
export function processSongGuess(
  game: Game,
  playerId: string,
  guess: string,
  usingToken: boolean = false
): { correct: boolean; message: string; nextPhase?: GamePhase } {
  const music = getMusicById(game.currentRound.musicId)
  if (!music) {
    throw new Error('Music not found')
  }

  const player = game.players.find(p => p.id === playerId)
  if (!player) {
    throw new Error('Player not found')
  }

  const normalizedGuess = normalizeSongTitle(guess)
  const normalizedAnswer = normalizeSongTitle(music.title)

  const isCorrect = normalizedGuess === normalizedAnswer

  // Create pending card from current music
  const pendingCard: Card = {
    id: `card-${uuidv4()}`,
    musicId: music.id,
    title: music.title,
    artist: music.artist,
    year: music.year
  }
  game.currentRound.pendingCard = pendingCard
  game.currentRound.phase = GamePhase.CARD_PLACEMENT

  if (isCorrect) {
    player.guessedCorrectSongInRound = true
    player.tokens = Math.min(player.tokens + 1, 5) // Award 1 token, max 5
    game.currentRound.correctGuessPlayer = playerId

    return {
      correct: true,
      message: `Correct! The song is "${music.title}" by ${music.artist}. +1 token!`,
      nextPhase: GamePhase.CARD_PLACEMENT
    }
  } else {
    // Wrong guess - still move to card placement
    return {
      correct: false,
      message: `Wrong! The song is "${music.title}" by ${music.artist}. Now place the card...`,
      nextPhase: GamePhase.CARD_PLACEMENT
    }
  }
}

/**
 * Skip song guess - player doesn't attempt to guess
 */
export function skipSongGuess(game: Game): { message: string; nextPhase?: GamePhase } {
  const music = getMusicById(game.currentRound.musicId)
  if (!music) {
    throw new Error('Music not found')
  }

  // Create pending card from current music
  const pendingCard: Card = {
    id: `card-${uuidv4()}`,
    musicId: music.id,
    title: music.title,
    artist: music.artist,
    year: music.year
  }
  game.currentRound.pendingCard = pendingCard
  game.currentRound.phase = GamePhase.CARD_PLACEMENT

  return {
    message: 'Skipped song guess. Now place the card...',
    nextPhase: GamePhase.CARD_PLACEMENT
  }
}

/**
 * Process card placement — does NOT reveal correctness yet.
 * Always goes to CHALLENGE phase so other players can challenge before reveal.
 */
export function processCardPlacement(
  game: Game,
  playerId: string,
  position: number
): { message: string; nextPhase: GamePhase } {
  const player = game.players.find(p => p.id === playerId)
  if (!player) {
    throw new Error('Player not found')
  }

  const card = game.currentRound.pendingCard
  if (!card) {
    throw new Error('No pending card to place')
  }

  if (position < 0 || position > player.cards.length) {
    throw new Error('Invalid card position')
  }

  // Store placement info but DON'T reveal if correct yet
  game.currentRound.challengeCard = card
  game.currentRound.placedPosition = position
  game.currentRound.pendingCard = undefined
  game.currentRound.phase = GamePhase.CHALLENGE

  // Pre-compute correctness (stored but not sent to client)
  let isCorrect = true
  if (position > 0 && player.cards[position - 1].year > card.year) {
    isCorrect = false
  }
  if (position < player.cards.length && player.cards[position].year < card.year) {
    isCorrect = false
  }
  game.currentRound.placementWrong = !isCorrect

  return {
    message: 'Card placed! Waiting for challenges...',
    nextPhase: GamePhase.CHALLENGE
  }
}

/**
 * Challenge — another player spends 1 token and guesses the correct position
 * on the CURRENT player's timeline.
 *
 * This also triggers the reveal:
 * - If original placement was correct AND challenger says it's wrong → challenger loses token, card stays
 * - If original placement was wrong AND challenger guesses correct position → challenger steals card
 * - If original placement was wrong AND challenger guesses wrong position → challenger loses token, card discarded
 */
export function challengePlacement(
  game: Game,
  challengerId: string,
  position: number
): { success: boolean; message: string; stolenCard: boolean; placementWasCorrect: boolean } {
  if (game.currentRound.phase !== GamePhase.CHALLENGE) {
    throw new Error('Not in challenge phase')
  }

  const challenger = game.players.find(p => p.id === challengerId)
  if (!challenger) throw new Error('Challenger not found')

  if (challenger.id === game.currentRound.currentPlayer) {
    throw new Error('Current player cannot challenge their own placement')
  }

  if (challenger.tokens < 1) {
    throw new Error('Not enough tokens to challenge')
  }

  const card = game.currentRound.challengeCard
  if (!card) throw new Error('No card to challenge')

  const currentPlayer = game.players.find(p => p.id === game.currentRound.currentPlayer)
  if (!currentPlayer) throw new Error('Current player not found')

  const wasWrong = game.currentRound.placementWrong === true

  // Spend 1 token
  challenger.tokens -= 1

  if (!wasWrong) {
    // Original placement was CORRECT — challenger loses, card stays with current player
    // Finalize the correct placement now
    const placedPos = game.currentRound.placedPosition!
    currentPlayer.cards.splice(placedPos, 0, { ...card, position: placedPos })
    currentPlayer.cards.forEach((c, i) => { c.position = i })

    game.currentRound.phase = GamePhase.ROUND_END
    game.currentRound.challengeCard = undefined

    return {
      success: false,
      message: `Placement was correct! ${challenger.name} lost 1 token.`,
      stolenCard: false,
      placementWasCorrect: true
    }
  }

  // Original placement was WRONG — check if challenger's position is correct
  const cards = currentPlayer.cards
  let isCorrectPosition = true

  if (position < 0 || position > cards.length) {
    isCorrectPosition = false
  } else {
    if (position > 0 && cards[position - 1].year > card.year) {
      isCorrectPosition = false
    }
    if (position < cards.length && cards[position].year < card.year) {
      isCorrectPosition = false
    }
  }

  if (isCorrectPosition) {
    // Challenger wins — steal card to their OWN timeline
    let challengerPos = 0
    for (let i = 0; i < challenger.cards.length; i++) {
      if (challenger.cards[i].year <= card.year) {
        challengerPos = i + 1
      }
    }
    challenger.cards.splice(challengerPos, 0, { ...card, position: challengerPos })
    challenger.cards.forEach((c, i) => { c.position = i })

    game.currentRound.phase = GamePhase.ROUND_END
    game.currentRound.challengeCard = undefined

    return {
      success: true,
      message: `${challenger.name} challenged correctly! Card stolen!`,
      stolenCard: true,
      placementWasCorrect: false
    }
  } else {
    // Challenger also got it wrong — card discarded
    game.currentRound.phase = GamePhase.ROUND_END
    game.currentRound.challengeCard = undefined

    return {
      success: false,
      message: `${challenger.name}'s challenge failed! Card discarded, token lost.`,
      stolenCard: false,
      placementWasCorrect: false
    }
  }
}

/**
 * Skip challenge — reveal the placement result now.
 * If correct → card stays. If wrong → card discarded.
 */
export function skipChallenge(game: Game): { message: string; placementCorrect: boolean } {
  if (game.currentRound.phase !== GamePhase.CHALLENGE) {
    throw new Error('Not in challenge phase')
  }

  const card = game.currentRound.challengeCard
  const currentPlayer = game.players.find(p => p.id === game.currentRound.currentPlayer)
  if (!currentPlayer || !card) throw new Error('Invalid state')

  const wasWrong = game.currentRound.placementWrong === true

  if (!wasWrong) {
    // Correct — insert card
    const pos = game.currentRound.placedPosition!
    currentPlayer.cards.splice(pos, 0, { ...card, position: pos })
    currentPlayer.cards.forEach((c, i) => { c.position = i })
  }
  // If wrong — card is simply discarded (not inserted)

  game.currentRound.phase = GamePhase.ROUND_END
  game.currentRound.challengeCard = undefined

  return {
    message: wasWrong ? 'Wrong placement! Card discarded.' : 'Correct placement! Card added.',
    placementCorrect: !wasWrong
  }
}

/**
 * Change song — spend 1 token to skip current song and draw a new one
 */
export function changeSong(
  game: Game,
  playerId: string
): { message: string; newMusicId: string } {
  const player = game.players.find(p => p.id === playerId)
  if (!player) {
    throw new Error('Player not found')
  }

  if (player.tokens < 1) {
    throw new Error('Not enough tokens')
  }

  if (game.currentRound.phase !== GamePhase.SONG_GUESS) {
    throw new Error('Can only change song during song guess phase')
  }

  // Spend 1 token
  player.tokens -= 1

  // Mark current music as used
  if (game.currentRound.musicId) {
    game.currentRound.usedMusicIds.push(game.currentRound.musicId)
  }

  // Draw new song
  const newMusic = getNextMusic(game)
  if (!newMusic) {
    throw new Error('No more music available')
  }

  game.currentRound.musicId = newMusic.id
  game.currentRound.pendingCard = undefined

  return {
    message: `Song changed! -1 token (${player.tokens} remaining)`,
    newMusicId: newMusic.id
  }
}

/**
 * Move to next turn. Checks if the full round is complete (every player had a turn).
 * If so, checks win condition:
 *   - No one at winningCards → continue
 *   - Exactly one leader → that player wins
 *   - Tie at top → deuce, continue until a full round produces a single leader
 *
 * Returns { finished, winner, deuce } so frontend knows what happened.
 */
export function moveToNextRound(game: Game): { finished: boolean; deuce: boolean } {
  if (game.status !== GameStatus.PLAYING) {
    return { finished: true, deuce: false }
  }

  const count = game.players.length
  const currentPlayerIndex = game.players.findIndex(p => p.id === game.currentRound.currentPlayer)
  const nextPlayerIndex = (currentPlayerIndex + 1) % count
  const nextPlayer = game.players[nextPlayerIndex]

  // Advance turn index
  game.currentRound.turnIndex += 1

  // Check if full round complete (everyone has played)
  const fullRoundComplete = game.currentRound.turnIndex >= count

  if (fullRoundComplete) {
    // Check win condition
    const maxCards = Math.max(...game.players.map(p => p.cards.length))

    if (maxCards >= game.config.winningCards) {
      const leaders = game.players.filter(p => p.cards.length === maxCards)

      if (leaders.length === 1) {
        // Single winner!
        game.status = GameStatus.FINISHED
        game.winner = leaders[0].id
        game.finishedAt = new Date().toISOString()
        game.deuce = false
        return { finished: true, deuce: false }
      } else {
        // Tie — deuce! Continue playing
        game.deuce = true
      }
    }

    // Start a new full round
    game.currentRound.turnIndex = 0
    game.currentRound.startingPlayerId = nextPlayer.id
  }

  // Set next player
  game.currentRound.roundNumber += 1
  game.currentRound.currentPlayer = nextPlayer.id
  game.players.forEach(p => {
    p.isCurrentPlayer = p.id === nextPlayer.id
    p.guessedCorrectSongInRound = false
  })

  // Clear challenge state
  game.currentRound.challengeCard = undefined
  game.currentRound.placementWrong = undefined
  game.currentRound.placedPosition = undefined

  // Get next music
  const music = getNextMusic(game)
  if (music) {
    game.currentRound.musicId = music.id
    game.currentRound.usedMusicIds.push(music.id)
  }

  game.currentRound.phase = GamePhase.SONG_GUESS
  return { finished: false, deuce: game.deuce || false }
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
