import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import * as db from './database'
import * as gameLogic from './gameLogic'
import * as validation from './validation'
import { Game, GameStatus, GamePhase, GuessType } from './types'

const app = express() as any

// Middleware
app.use(cors())
app.use(express.json())


// Routes

/**
 * POST /api/games
 * Create a new game room
 */
app.post('/api/games', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { maxPlayers, winningCards, musicTags, tokenPointsK } = req.body

    // Validate input
    validation.validateGameConfig(maxPlayers, winningCards, musicTags)

    // Create game
    const config = {
      maxPlayers,
      minPlayers: 2,
      winningCards,
      musicTags,
      maxRounds: 100,
      tokenPointsK: tokenPointsK || 0
    }

    const game = gameLogic.createNewGame(config)
    db.createGame(game)

    res.json({
      gameId: game.id,
      roomCode: game.roomCode
    })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/games/room/:roomCode
 * Find game by room code (for rejoin)
 */
app.get('/api/games/room/:roomCode', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomCode } = req.params
    const game = db.getGameByRoomCode(roomCode)
    if (!game) {
      return res.status(404).json({
        code: 'GAME_NOT_FOUND',
        message: '找不到此房間'
      })
    }
    res.json(game)
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/games/:gameId
 * Get game state
 */
app.get('/api/games/:gameId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params
    validation.validateGameId(gameId)

    const game = db.getGame(gameId)
    if (!game) {
      return res.status(404).json({
        code: 'GAME_NOT_FOUND',
        message: '找不到遊戲'
      })
    }

    res.json(game)
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/games/:gameId/players
 * Add a player to the game
 */
app.post('/api/games/:gameId/players', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params
    const { playerName } = req.body

    validation.validateGameId(gameId)
    validation.validatePlayerName(playerName)

    const game = db.getGame(gameId)
    if (!game) {
      return res.status(404).json({
        code: 'GAME_NOT_FOUND',
        message: '找不到遊戲'
      })
    }

    if (game.status !== GameStatus.WAITING) {
      return res.status(400).json({
        code: 'GAME_ALREADY_STARTED',
        message: '遊戲已經開始'
      })
    }

    validation.validatePlayerCount(game.players.length, game.config.maxPlayers)

    const player = gameLogic.addPlayerToGame(game, playerName)
    db.updateGame(gameId, game)

    res.json({
      playerId: player.id,
      player
    })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/games/:gameId/start
 * Start the game
 */
app.post('/api/games/:gameId/start', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params
    validation.validateGameId(gameId)

    let game = db.getGame(gameId)
    if (!game) {
      return res.status(404).json({
        code: 'GAME_NOT_FOUND',
        message: '找不到遊戲'
      })
    }

    if (game.status !== GameStatus.WAITING) {
      return res.status(400).json({
        code: 'GAME_ALREADY_STARTED',
        message: '遊戲已經開始'
      })
    }

    game = gameLogic.startGame(game)
    db.updateGame(gameId, game)

    res.json({
      game,
      currentPlayer: game.players.find(p => p.isCurrentPlayer)
    })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/games/:gameId/music
 * Get current music for playing (returns YouTube ID for iframe embed)
 */
app.get('/api/games/:gameId/music', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params
    validation.validateGameId(gameId)

    const game = db.getGame(gameId)
    if (!game) {
      return res.status(404).json({
        code: 'GAME_NOT_FOUND',
        message: '找不到遊戲'
      })
    }

    const music = db.getMusicById(game.currentRound.musicId)
    if (!music) {
      return res.status(404).json({
        code: 'MUSIC_NOT_FOUND',
        message: '找不到音樂'
      })
    }

    // Don't send answer information (title, artist, year)
    res.json({
      id: music.id,
      youtubeId: music.youtubeId,
      spotifyId: music.spotifyId
    })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/games/:gameId/music/reveal
 * Reveal full music info (call during ROUND_END phase)
 */
app.get('/api/games/:gameId/music/reveal', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params
    validation.validateGameId(gameId)

    const game = db.getGame(gameId)
    if (!game) {
      return res.status(404).json({
        code: 'GAME_NOT_FOUND',
        message: '找不到遊戲'
      })
    }

    const music = db.getMusicById(game.currentRound.musicId)
    if (!music) {
      return res.status(404).json({
        code: 'MUSIC_NOT_FOUND',
        message: '找不到音樂'
      })
    }

    const albumArt = music.albumArt || ''

    res.json({
      title: music.title,
      artist: music.artist,
      year: music.year,
      albumArt,
      spotifyId: music.spotifyId
    })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/games/:gameId/guess
 * Submit a song guess
 */
app.post('/api/games/:gameId/guess', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params
    const { playerId, guessType, guess, usingToken } = req.body

    validation.validateGameId(gameId)
    validation.validatePlayerId(playerId)

    const game = db.getGame(gameId)
    if (!game) {
      return res.status(404).json({
        code: 'GAME_NOT_FOUND',
        message: '找不到遊戲'
      })
    }

    if (guessType === GuessType.SONG) {
      validation.validateSongGuess(guess)
      const result = gameLogic.processSongGuess(game, playerId, guess, usingToken)
      db.updateGame(gameId, game)

      res.json({
        ...result,
        game,
        currentPlayer: game.players.find(p => p.isCurrentPlayer)
      })
    } else {
      throw new validation.ValidationError('Invalid guess type', 'INVALID_GUESS_TYPE')
    }
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/games/:gameId/skip-song-guess
 * Skip song guess and move directly to card placement
 */
app.post('/api/games/:gameId/skip-song-guess', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params

    validation.validateGameId(gameId)

    const game = db.getGame(gameId)
    if (!game) {
      return res.status(404).json({
        code: 'GAME_NOT_FOUND',
        message: '找不到遊戲'
      })
    }

    const result = gameLogic.skipSongGuess(game)
    db.updateGame(gameId, game)

    res.json({
      ...result,
      game,
      currentPlayer: game.players.find(p => p.isCurrentPlayer)
    })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/games/:gameId/card-placement
 * Process card placement using pending card
 */
app.post('/api/games/:gameId/card-placement', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params
    const { playerId, position } = req.body

    validation.validateGameId(gameId)
    validation.validatePlayerId(playerId)
    validation.validateCardPosition(position, 20) // Max 20 cards

    const game = db.getGame(gameId)
    if (!game) {
      return res.status(404).json({
        code: 'GAME_NOT_FOUND',
        message: '找不到遊戲'
      })
    }

    const result = gameLogic.processCardPlacement(game, playerId, position)
    db.updateGame(gameId, game)

    res.json({
      ...result,
      game,
      player: game.players.find(p => p.id === playerId)
    })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/games/:gameId/challenge
 * Challenge the current player's wrong placement
 */
app.post('/api/games/:gameId/challenge', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params
    const { challengerId, position } = req.body

    validation.validateGameId(gameId)
    validation.validatePlayerId(challengerId)

    const game = db.getGame(gameId)
    if (!game) {
      return res.status(404).json({ code: 'GAME_NOT_FOUND', message: '找不到遊戲' })
    }

    const result = gameLogic.challengePlacement(game, challengerId, position)
    db.updateGame(gameId, game)

    res.json({
      ...result,
      game,
      currentPlayer: game.players.find(p => p.isCurrentPlayer)
    })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/games/:gameId/skip-challenge
 * No one wants to challenge, discard the card
 */
app.post('/api/games/:gameId/skip-challenge', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params
    validation.validateGameId(gameId)

    const game = db.getGame(gameId)
    if (!game) {
      return res.status(404).json({ code: 'GAME_NOT_FOUND', message: '找不到遊戲' })
    }

    const result = gameLogic.skipChallenge(game)
    db.updateGame(gameId, game)

    res.json({
      ...result,
      game,
      currentPlayer: game.players.find(p => p.isCurrentPlayer)
    })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/games/:gameId/change-song
 * Spend 1 token to skip current song and draw a new one
 */
app.post('/api/games/:gameId/change-song', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params
    const { playerId } = req.body

    validation.validateGameId(gameId)
    validation.validatePlayerId(playerId)

    const game = db.getGame(gameId)
    if (!game) {
      return res.status(404).json({
        code: 'GAME_NOT_FOUND',
        message: '找不到遊戲'
      })
    }

    const result = gameLogic.changeSong(game, playerId)
    db.updateGame(gameId, game)

    res.json({
      ...result,
      game,
      currentPlayer: game.players.find(p => p.isCurrentPlayer)
    })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/games/:gameId/next-round
 * Move to next round
 */
app.post('/api/games/:gameId/next-round', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params
    validation.validateGameId(gameId)

    let game = db.getGame(gameId)
    if (!game) {
      return res.status(404).json({
        code: 'GAME_NOT_FOUND',
        message: '找不到遊戲'
      })
    }

    const result = gameLogic.moveToNextRound(game)
    db.updateGame(gameId, game)

    res.json({
      ...result,
      game,
      currentPlayer: game.players.find(p => p.isCurrentPlayer)
    })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/music/tags
 * Get all available music tags
 */
app.get('/api/music/tags', (req: Request, res: Response) => {
  const tags = db.getAllMusicTags()
  res.json({ tags })
})

/**
 * Health check
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

// Error handling middleware (must be after all routes)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err)

  if (err instanceof validation.ValidationError) {
    return res.status(400).json({
      code: err.code,
      message: err.message
    })
  }

  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: err.message || '內部伺服器錯誤'
  })
})

module.exports = app
