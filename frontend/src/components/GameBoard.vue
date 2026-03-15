<template>
  <div class="game-board">
    <div class="header">
      <h1>🎵 金曲猜歌王</h1>
      <div class="game-info">
        <span>房間號: {{ gameStore.roomCode }}</span>
        <span>輪次: {{ gameStore.currentGame?.currentRound.roundNumber }}</span>
      </div>
    </div>

    <div class="game-container">
      <!-- Current Player Info -->
      <div class="current-player-info">
        <h2>當前玩家: {{ currentPlayer?.name }}</h2>
        <div class="player-stats">
          <div v-for="player in gameStore.gamePlayers" :key="player.id" class="player-stat">
            <p>{{ player.name }}</p>
            <p class="stat-value">🎫 {{ player.cards.length }}/{{ gameStore.currentGame?.config.winningCards }}</p>
            <p class="stat-value">💰 {{ player.tokens }}</p>
          </div>
        </div>
      </div>

      <!-- Music Player -->
      <div v-if="currentMusic" class="music-player">
        <h3>現在播放中...</h3>
        <audio
          ref="audioElement"
          :src="currentMusic.musicUrl"
          @ended="handleMusicEnded"
          @play="isPlaying = true"
          @pause="isPlaying = false"
          controls
        ></audio>
      </div>

      <!-- Guess Interface -->
      <div v-if="gameStore.currentPhase === 'song_guess'" class="guess-interface">
        <h3>猜歌曲名稱</h3>

        <!-- Show Answer Button -->
        <button v-if="!showAnswer" @click="showAnswer = true" class="btn-reveal" :disabled="isSubmitting">
          顯示答案
        </button>

        <!-- Answer Revealed -->
        <div v-else class="answer-revealed">
          <div class="answer-box">
            <p class="label">正確答案:</p>
            <p class="song-title">{{ currentMusic?.title }}</p>
            <p class="artist">{{ currentMusic?.artist }}</p>
          </div>

          <!-- Guess Correct/Wrong Buttons -->
          <div class="guess-buttons">
            <button
              @click="submitSongGuess(true)"
              :disabled="isSubmitting"
              class="btn-correct"
            >
              ✓ 我猜對了
            </button>
            <button
              @click="submitSongGuess(false)"
              :disabled="isSubmitting"
              class="btn-wrong"
            >
              ✗ 我猜錯了
            </button>
          </div>
        </div>
      </div>

      <div v-if="gameStore.currentPhase === 'year_guess'" class="guess-interface">
        <h3>猜發行年份</h3>
        <input
          v-model.number="yearGuess"
          type="number"
          placeholder="輸入年份"
          @keyup.enter="submitYearGuess"
          :disabled="isSubmitting"
        />
        <button @click="submitYearGuess" :disabled="yearGuess === null || isSubmitting" class="btn-submit">
          {{ isSubmitting ? '提交中...' : '提交' }}
        </button>
      </div>

      <!-- Card Placement -->
      <div v-if="gameStore.currentPhase === 'card_placement'" class="card-placement">
        <h3>放置卡牌到時間線</h3>
        <div class="timeline">
          <div class="timeline-cards">
            <div v-for="(card, idx) in currentPlayerCards" :key="card.id" class="timeline-card">
              <p>{{ card.year }}</p>
            </div>
            <div class="insert-point" @click="placeCard(0)">+</div>
          </div>
        </div>
        <div v-if="newCard" class="new-card">
          <p>{{ newCard.title }} ({{ newCard.year }})</p>
          <button @click="cancelCardPlacement">取消</button>
        </div>
      </div>

      <!-- Next Round -->
      <div v-if="gameStore.currentPhase === 'round_end'" class="round-end">
        <h3>輪次結束</h3>
        <button @click="nextRound" :disabled="isSubmitting">下一輪</button>
      </div>

      <!-- Game Over -->
      <div v-if="gameStore.isGameFinished" class="game-over">
        <h2>遊戲結束!</h2>
        <h1>🎉 {{ gameStore.winner?.name }} 獲勝! 🎉</h1>
        <button @click="resetGame" class="btn-primary">返回主選單</button>
      </div>

      <p v-if="gameStore.error" class="error-message">{{ gameStore.error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import type { Card } from '@/types'

const gameStore = useGameStore()

const audioElement = ref<HTMLAudioElement | null>(null)
const showAnswer = ref(false)
const yearGuess = ref<number | null>(null)
const isPlaying = ref(false)
const isSubmitting = ref(false)
const newCard = ref<Card | null>(null)
const selectedPosition = ref<number | null>(null)

const currentPlayer = computed(() =>
  gameStore.gamePlayers.find(p => p.isCurrentPlayer)
)

const currentMusic = computed(() => gameStore.currentMusic)

const currentPlayerCards = computed(() => currentPlayer.value?.cards || [])

async function submitSongGuess(isCorrect: boolean) {
  if (!currentPlayer.value || !currentMusic.value) return

  isSubmitting.value = true
  try {
    // If user claims correct, use the actual song title
    // If user claims wrong, use a dummy guess that won't match
    const guess = isCorrect ? currentMusic.value.title : '___WRONG___'

    const result = await gameStore.submitSongGuess(
      currentPlayer.value.id,
      guess
    )

    showAnswer.value = false

    if (result.correct && result.nextPhase === 'year_guess') {
      // Wait for year guess
    } else if (!result.correct) {
      // Wrong guess, might be next player's turn
    }
  } catch (err) {
    console.error('Error submitting song guess:', err)
  } finally {
    isSubmitting.value = false
  }
}

async function submitYearGuess() {
  if (!currentPlayer.value || yearGuess.value === null) return

  isSubmitting.value = true
  try {
    const result = await gameStore.submitYearGuess(
      currentPlayer.value.id,
      yearGuess.value
    )

    if (result.correct && result.card) {
      newCard.value = result.card
      // Wait for card placement
    }

    yearGuess.value = null
  } catch (err) {
    console.error('Error submitting year guess:', err)
  } finally {
    isSubmitting.value = false
  }
}

function placeCard(position: number) {
  if (!currentPlayer.value || !newCard.value) return
  selectedPosition.value = position
  submitCardPlacement()
}

async function submitCardPlacement() {
  if (!currentPlayer.value || !newCard.value || selectedPosition.value === null) return

  isSubmitting.value = true
  try {
    await gameStore.submitCardPlacement(
      currentPlayer.value.id,
      newCard.value,
      selectedPosition.value
    )

    newCard.value = null
    selectedPosition.value = null

    // Move to next round after a delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    await nextRound()
  } catch (err) {
    console.error('Error placing card:', err)
  } finally {
    isSubmitting.value = false
  }
}

function cancelCardPlacement() {
  newCard.value = null
  selectedPosition.value = null
}

async function nextRound() {
  isSubmitting.value = true
  try {
    await gameStore.moveToNextRound()
    showAnswer.value = false
  } catch (err) {
    console.error('Error moving to next round:', err)
  } finally {
    isSubmitting.value = false
  }
}

function handleMusicEnded() {
  isPlaying.value = false
}

function resetGame() {
  showAnswer.value = false
  gameStore.reset()
  // Parent component should handle navigation back to setup
}

onMounted(async () => {
  await gameStore.loadCurrentMusic()
})
</script>

<style scoped>
.game-board {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  color: white;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
}

.game-info {
  display: flex;
  justify-content: center;
  gap: 30px;
  font-size: 1.1em;
}

.game-container {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  color: #333;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.current-player-info {
  margin-bottom: 30px;
}

.current-player-info h2 {
  color: #667eea;
  margin-bottom: 15px;
}

.player-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.player-stat {
  background: #f7fafc;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  border-left: 3px solid #667eea;
}

.player-stat p {
  margin: 5px 0;
}

.stat-value {
  font-weight: 600;
  color: #667eea;
  font-size: 1.2em;
}

.music-player {
  margin: 20px 0;
  padding: 20px;
  background: #f7fafc;
  border-radius: 8px;
}

.music-player audio {
  width: 100%;
  margin-top: 10px;
}

.guess-interface,
.card-placement,
.round-end {
  margin: 20px 0;
  padding: 20px;
  background: #f7fafc;
  border-radius: 8px;
}

.guess-interface h3,
.card-placement h3,
.round-end h3 {
  color: #667eea;
  margin-bottom: 15px;
}

.btn-reveal {
  width: 100%;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 1.1em;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 10px;
}

.btn-reveal:hover:not(:disabled) {
  background: linear-gradient(135deg, #5568d3 0%, #6a3a8c 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

.btn-reveal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.answer-revealed {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.answer-box {
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: center;
}

.answer-box .label {
  color: #856404;
  font-size: 0.9em;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.answer-box .song-title {
  color: #333;
  font-size: 1.5em;
  font-weight: 700;
  margin: 10px 0;
}

.answer-box .artist {
  color: #666;
  font-size: 1.1em;
  margin: 5px 0 0 0;
}

.guess-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.btn-correct,
.btn-wrong,
.round-end button {
  padding: 15px 20px;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 1.1em;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-correct {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
}

.btn-correct:hover:not(:disabled) {
  background: linear-gradient(135deg, #38a169 0%, #276749 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(72, 187, 120, 0.4);
}

.btn-wrong {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
}

.btn-wrong:hover:not(:disabled) {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(245, 101, 101, 0.4);
}

.btn-correct:disabled,
.btn-wrong:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.round-end button {
  width: 100%;
  background: #667eea;
}

.round-end button:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
}

.round-end button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Year guess input and button */
.guess-interface input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1em;
  margin-bottom: 10px;
  box-sizing: border-box;
}

.guess-interface input:focus {
  outline: none;
  border-color: #667eea;
}

.guess-interface .btn-submit {
  width: 100%;
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.guess-interface .btn-submit:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
}

.guess-interface .btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.timeline {
  background: white;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.timeline-cards {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.timeline-card {
  background: #667eea;
  color: white;
  padding: 10px 15px;
  border-radius: 6px;
  min-width: 60px;
  text-align: center;
  font-weight: 600;
}

.insert-point {
  background: #48bb78;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.5em;
  font-weight: 600;
  transition: all 0.3s;
}

.insert-point:hover {
  background: #38a169;
  transform: scale(1.1);
}

.new-card {
  background: #fff5f5;
  border: 2px dashed #fc8181;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.new-card p {
  color: #c53030;
  font-weight: 600;
  margin-bottom: 10px;
}

.new-card button {
  padding: 8px 16px;
  background: #fc8181;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.game-over {
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  border-radius: 12px;
  color: white;
}

.game-over h2 {
  font-size: 2em;
  margin-bottom: 20px;
}

.game-over h1 {
  font-size: 3em;
  margin-bottom: 30px;
}

.btn-primary {
  background: white;
  color: #48bb78;
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.error-message {
  color: #e53e3e;
  padding: 15px;
  background: #fff5f5;
  border-radius: 6px;
  margin-top: 15px;
}
</style>
