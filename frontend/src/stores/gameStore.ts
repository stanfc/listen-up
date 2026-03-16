import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Game,
  Player,
  GameConfig,
  GameStatus,
  GamePhase,
  RevealMusicResponse
} from '@/types'
import { GuessType } from '@/types'
import { apiService } from '@/api/client'

export const useGameStore = defineStore('game', () => {
  // State
  const currentGame = ref<Game | null>(null)
  const currentPlayer = ref<Player | null>(null)
  const currentMusic = ref<any>(null)
  const revealedMusic = ref<RevealMusicResponse | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const gameHistory = ref<Game[]>([])

  // Computed
  const gameId = computed(() => currentGame.value?.id)
  const roomCode = computed(() => currentGame.value?.roomCode)
  const gameStatus = computed(() => currentGame.value?.status)
  const gamePlayers = computed(() => currentGame.value?.players || [])
  const isGamePlaying = computed(() => gameStatus.value === 'playing')
  const isGameFinished = computed(() => gameStatus.value === 'finished')
  const currentPhase = computed(() => currentGame.value?.currentRound.phase)
  const winner = computed(() => {
    if (isGameFinished.value && currentGame.value?.winner) {
      return gamePlayers.value.find(p => p.id === currentGame.value?.winner)
    }
    return null
  })

  // Actions
  async function createGame(config: GameConfig) {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.createGame({
        maxPlayers: config.maxPlayers,
        winningCards: config.winningCards,
        musicTags: config.musicTags
      })

      currentGame.value = {
        id: response.gameId,
        roomCode: response.roomCode,
        status: 'waiting' as GameStatus,
        config,
        players: [],
        currentRound: {
          roundNumber: 0,
          currentPlayer: '',
          musicId: '',
          phase: 'song_guess' as GamePhase,
          usedMusicIds: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return response
    } catch (err: any) {
      error.value = err.message || '建立遊戲失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function addPlayer(playerName: string) {
    if (!gameId.value) throw new Error('沒有進行中的遊戲')

    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.addPlayer(gameId.value, { playerName })

      if (currentGame.value) {
        currentGame.value.players.push(response.player)
      }

      return response
    } catch (err: any) {
      error.value = err.message || '新增玩家失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function startGame() {
    if (!gameId.value) throw new Error('沒有進行中的遊戲')

    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.startGame(gameId.value)
      currentGame.value = response.game
      currentPlayer.value = response.currentPlayer

      // Load initial music
      await loadCurrentMusic()
    } catch (err: any) {
      error.value = err.message || '啟動遊戲失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function loadCurrentMusic() {
    if (!gameId.value) return

    try {
      const response = await apiService.getMusic(gameId.value)
      currentMusic.value = response
      revealedMusic.value = null // Reset revealed info for new round
    } catch (err: any) {
      error.value = '載入音樂失敗'
      console.error(err)
    }
  }

  async function revealMusic() {
    if (!gameId.value) return

    try {
      const response = await apiService.revealMusic(gameId.value)
      revealedMusic.value = response
      return response
    } catch (err: any) {
      error.value = '顯示音樂失敗'
      console.error(err)
    }
  }

  async function submitSongGuess(playerId: string, guess: string, usingToken: boolean = false) {
    if (!gameId.value) throw new Error('沒有進行中的遊戲')

    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.submitGuess(gameId.value, {
        playerId,
        guessType: GuessType.SONG,
        guess,
        usingToken
      })

      currentGame.value = response.game
      currentPlayer.value = response.currentPlayer

      return response
    } catch (err: any) {
      error.value = err.message || '提交猜測失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function skipSongGuess() {
    if (!gameId.value) throw new Error('沒有進行中的遊戲')

    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.skipSongGuess(gameId.value)

      currentGame.value = response.game
      currentPlayer.value = response.currentPlayer

      return response
    } catch (err: any) {
      error.value = err.message || '跳過猜歌失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function changeSong(playerId: string) {
    if (!gameId.value) throw new Error('沒有進行中的遊戲')

    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.changeSong(gameId.value, { playerId })

      currentGame.value = response.game
      currentPlayer.value = response.currentPlayer

      // Reload music for the new song
      await loadCurrentMusic()

      return response
    } catch (err: any) {
      error.value = err.message || '換歌失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function challenge(challengerId: string, position: number) {
    if (!gameId.value) throw new Error('沒有進行中的遊戲')

    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.challenge(gameId.value, { challengerId, position })
      currentGame.value = response.game
      currentPlayer.value = response.currentPlayer
      return response
    } catch (err: any) {
      error.value = err.message || '挑戰失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function skipChallenge() {
    if (!gameId.value) throw new Error('沒有進行中的遊戲')

    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.skipChallenge(gameId.value)
      currentGame.value = response.game
      currentPlayer.value = response.currentPlayer
      return response
    } catch (err: any) {
      error.value = err.message || '跳過挑戰失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function submitCardPlacement(playerId: string, position: number) {
    if (!gameId.value) throw new Error('沒有進行中的遊戲')

    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.submitCardPlacement(gameId.value, {
        playerId,
        position
      })

      currentGame.value = response.game

      return response
    } catch (err: any) {
      error.value = err.message || '放置卡牌失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function moveToNextRound() {
    if (!gameId.value) throw new Error('沒有進行中的遊戲')

    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.nextRound(gameId.value)
      currentGame.value = response.game
      currentPlayer.value = response.currentPlayer

      return response
    } catch (err: any) {
      error.value = err.message || '進入下一回合失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function loadGameState(gid: string) {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.getGameState(gid)
      currentGame.value = response.game
      currentPlayer.value = response.currentPlayer
    } catch (err: any) {
      error.value = err.message || '載入遊戲狀態失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function reset() {
    currentGame.value = null
    currentPlayer.value = null
    currentMusic.value = null
    revealedMusic.value = null
    error.value = null
  }

  return {
    // State
    currentGame,
    currentPlayer,
    currentMusic,
    revealedMusic,
    isLoading,
    error,
    gameHistory,

    // Computed
    gameId,
    roomCode,
    gameStatus,
    gamePlayers,
    isGamePlaying,
    isGameFinished,
    currentPhase,
    winner,

    // Actions
    createGame,
    addPlayer,
    startGame,
    loadCurrentMusic,
    revealMusic,
    submitSongGuess,
    skipSongGuess,
    changeSong,
    challenge,
    skipChallenge,
    submitCardPlacement,
    moveToNextRound,
    loadGameState,
    reset
  }
})
