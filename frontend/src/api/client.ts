import axios from 'axios'
import type {
  CreateGameRequest,
  CreateGameResponse,
  AddPlayerRequest,
  AddPlayerResponse,
  GetMusicResponse,
  RevealMusicResponse,
  SubmitGuessRequest,
  GameStateResponse
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Surface the backend's actual validation message (err.response.data.message)
// through err.message, so every call site's generic `catch (err) { err.message }`
// shows the real reason instead of axios's "Request failed with status code 400".
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const backendMessage = error?.response?.data?.message
    if (backendMessage) {
      error.message = backendMessage
    }
    return Promise.reject(error)
  }
)

export const apiService = {
  // Games
  async createGame(data: CreateGameRequest): Promise<CreateGameResponse> {
    const response = await client.post('/games', data)
    return response.data
  },

  async getGameState(gameId: string): Promise<GameStateResponse> {
    const response = await client.get(`/games/${gameId}`)
    return response.data
  },

  async getGameByRoomCode(roomCode: string) {
    const response = await client.get(`/games/room/${roomCode}`)
    return response.data
  },

  // Players
  async addPlayer(
    gameId: string,
    data: AddPlayerRequest
  ): Promise<AddPlayerResponse> {
    const response = await client.post(`/games/${gameId}/players`, data)
    return response.data
  },

  // Game Control
  async startGame(gameId: string) {
    const response = await client.post(`/games/${gameId}/start`)
    return response.data
  },

  async nextRound(gameId: string) {
    const response = await client.post(`/games/${gameId}/next-round`)
    return response.data
  },

  // Music
  async getMusic(gameId: string): Promise<GetMusicResponse> {
    const response = await client.get(`/games/${gameId}/music`)
    return response.data
  },

  async revealMusic(gameId: string): Promise<RevealMusicResponse> {
    const response = await client.get(`/games/${gameId}/music/reveal`)
    return response.data
  },

  async getMusicTags() {
    const response = await client.get('/music/tags')
    return response.data
  },

  // Guesses
  async submitGuess(gameId: string, data: SubmitGuessRequest): Promise<any> {
    const response = await client.post(`/games/${gameId}/guess`, data)
    return response.data
  },

  async skipSongGuess(gameId: string): Promise<any> {
    const response = await client.post(`/games/${gameId}/skip-song-guess`)
    return response.data
  },

  async changeSong(gameId: string, data: { playerId: string }): Promise<any> {
    const response = await client.post(`/games/${gameId}/change-song`, data)
    return response.data
  },

  async challenge(gameId: string, data: { challengerId: string; position: number }): Promise<any> {
    const response = await client.post(`/games/${gameId}/challenge`, data)
    return response.data
  },

  async skipChallenge(gameId: string): Promise<any> {
    const response = await client.post(`/games/${gameId}/skip-challenge`)
    return response.data
  },

  // Card Placement
  async submitCardPlacement(gameId: string, data: any) {
    const response = await client.post(`/games/${gameId}/card-placement`, data)
    return response.data
  },

  // Health
  async checkHealth() {
    const response = await client.get('/health')
    return response.data
  }
}

export default client
