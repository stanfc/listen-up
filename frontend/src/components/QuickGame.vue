<template>
  <div class="game-root">
    <CosmicBackground />

    <GameHeader
      :room-code="gameStore.roomCode || ''"
      :round-number="gameStore.currentGame?.currentRound.roundNumber || 0"
      :current-player-name="currentPlayer?.name || ''"
      @reset="resetGame"
      @rules="showRules = true"
    />

    <div class="table-area">
      <TableLayout
        :players="gameStore.gamePlayers"
        :round-number="gameStore.currentGame?.currentRound.roundNumber || 0"
        :is-playable="gameStore.currentPhase === 'song_guess' && !gameStore.isGameFinished"
        :token-points-k="gameStore.currentGame?.config.tokenPointsK"
      />
    </div>

    <!-- Phase panels -->
    <SongGuessPanel
      ref="songGuessRef"
      :visible="gameStore.currentPhase === 'song_guess' && !gameStore.isGameFinished"
      :is-my-turn="!!currentPlayer?.isCurrentPlayer"
      :submitting="isSubmitting"
      :players="gameStore.gamePlayers"
      :revealed-music="gameStore.revealedMusic"
      :result-message="lastResult?.message"
      :result-correct="lastResult?.correct"
      :current-tokens="currentPlayer?.tokens ?? 0"
      @revealAndShowVideo="handleRevealAndShowVideo"
      @skip="skipSongGuess"
      @wrong="submitWrongGuess"
      @selectWinner="submitCorrectGuess"
      @changeSong="handleChangeSong"
    />

    <CardPlacementPanel
      ref="cardPlacementRef"
      :visible="gameStore.currentPhase === 'card_placement' && !gameStore.isGameFinished"
      :cards="currentPlayerCards"
      :pending-card="pendingCard"
      :submitting="isSubmitting"
      @place="confirmCardPlacement"
    />

    <ChallengePanel
      ref="challengeRef"
      :visible="gameStore.currentPhase === 'challenge' && !gameStore.isGameFinished"
      :players="gameStore.gamePlayers"
      :current-player-id="currentPlayer?.id || ''"
      :current-player-name="currentPlayer?.name || ''"
      :current-player-cards="currentPlayerCards"
      :challenge-card="gameStore.currentGame?.currentRound.challengeCard || null"
      :placed-position="gameStore.currentGame?.currentRound.placedPosition ?? null"
      :submitting="isSubmitting"
      :result-message="lastResult?.message"
      :result-success="lastResult?.success"
      @challenge="handleChallenge"
      @skip="handleSkipChallenge"
    />

    <RoundEndPanel
      :visible="gameStore.currentPhase === 'round_end' && !showGameOver"
      :revealed-music="gameStore.revealedMusic"
      :result-message="lastResult?.message"
      :result-success="lastResult?.goodForPlayer"
      :submitting="isSubmitting"
      :is-deuce="gameStore.currentGame?.deuce"
      @nextRound="handleRoundEnd"
    />

    <GameOverScreen
      :visible="showGameOver"
      :winner-name="gameStore.winner?.name || ''"
      :ranking="finalRanking"
      :token-points-k="tokenK"
      @restart="resetGame"
    />

    <RulesModal :visible="showRules" @close="showRules = false" />

    <!-- Floating video window — at root level for highest z-index -->
    <VideoWindow
      ref="videoWindowRef"
      :youtube-id="currentMusic?.youtubeId"
      :visible="showMusicVideo"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import type { Card } from '@/types'

import CosmicBackground from './CosmicBackground.vue'
import GameHeader from './GameHeader.vue'
import TableLayout from './TableLayout.vue'
import SongGuessPanel from './SongGuessPanel.vue'
import CardPlacementPanel from './CardPlacementPanel.vue'
import ChallengePanel from './ChallengePanel.vue'
import RoundEndPanel from './RoundEndPanel.vue'
import GameOverScreen from './GameOverScreen.vue'
import VideoWindow from './VideoWindow.vue'
import RulesModal from './RulesModal.vue'

const gameStore = useGameStore()

// UI state
const showMusicVideo = ref(false)
const isSubmitting = ref(false)
const pendingCard = ref<Card | null>(null)
const lastResult = ref<any>(null)
const showGameOver = ref(false)
const showRules = ref(false)

// Refs for child reset
const songGuessRef = ref<InstanceType<typeof SongGuessPanel> | null>(null)
const cardPlacementRef = ref<InstanceType<typeof CardPlacementPanel> | null>(null)
const challengeRef = ref<InstanceType<typeof ChallengePanel> | null>(null)
const videoWindowRef = ref<InstanceType<typeof VideoWindow> | null>(null)

// Computed
const currentPlayer = computed(() =>
  gameStore.gamePlayers.find(p => p.isCurrentPlayer)
)

const currentMusic = computed(() => gameStore.currentMusic)

const currentPlayerCards = computed(() => currentPlayer.value?.cards || [])

const tokenK = computed(() => gameStore.currentGame?.config.tokenPointsK || 0)

function getScore(p: { cards: { length: number }; tokens: number }) {
  const k = tokenK.value
  const bonus = k > 0 ? Math.floor(p.tokens / k) : 0
  return p.cards.length + bonus
}

const finalRanking = computed(() =>
  [...gameStore.gamePlayers].sort((a, b) => getScore(b) - getScore(a))
)

// --- Actions ---

function handlePlay() {}

async function handleChangeSong() {
  if (!currentPlayer.value) return
  isSubmitting.value = true
  try {
    showMusicVideo.value = false
    gameStore.revealedMusic = null
    await gameStore.changeSong(currentPlayer.value.id)
    songGuessRef.value?.reset()
  } catch (err) {
    console.error('Change song failed:', err)
  } finally {
    isSubmitting.value = false
  }
}

async function handleRevealAndShowVideo() {
  await gameStore.revealMusic()
  showMusicVideo.value = true
}

async function skipSongGuess() {
  if (!currentPlayer.value) return
  isSubmitting.value = true
  try {
    await gameStore.skipSongGuess()
    if (gameStore.currentGame?.currentRound.pendingCard) {
      pendingCard.value = gameStore.currentGame.currentRound.pendingCard
    }
  } catch (err) {
    console.error('Skip failed:', err)
  } finally {
    isSubmitting.value = false
  }
}

async function submitWrongGuess() {
  if (!currentPlayer.value || !currentMusic.value) return
  isSubmitting.value = true
  try {
    const result = await gameStore.submitSongGuess(
      currentPlayer.value.id,
      '___WRONG___'
    )
    lastResult.value = result
    if (gameStore.currentGame?.currentRound.pendingCard) {
      pendingCard.value = gameStore.currentGame.currentRound.pendingCard
    }
    setTimeout(() => { lastResult.value = null }, 1500)
  } catch (err) {
    console.error('Wrong guess failed:', err)
  } finally {
    isSubmitting.value = false
  }
}

async function submitCorrectGuess(playerId: string) {
  isSubmitting.value = true
  try {
    const revealedTitle = gameStore.revealedMusic?.title
    if (!revealedTitle) {
      await gameStore.revealMusic()
    }
    const title = gameStore.revealedMusic?.title
    if (!title) throw new Error('找不到歌曲名稱')

    const result = await gameStore.submitSongGuess(playerId, title)
    lastResult.value = result

    if (gameStore.currentGame?.currentRound.pendingCard) {
      pendingCard.value = gameStore.currentGame.currentRound.pendingCard
    }
    setTimeout(() => { lastResult.value = null }, 1500)
  } catch (err) {
    console.error('Correct guess failed:', err)
  } finally {
    isSubmitting.value = false
  }
}

async function confirmCardPlacement(position: number) {
  if (!currentPlayer.value) return
  isSubmitting.value = true
  try {
    await gameStore.submitCardPlacement(
      currentPlayer.value.id,
      position
    )
    pendingCard.value = null
    // Goes to CHALLENGE phase — don't reveal anything yet
  } catch (err) {
    console.error('Card placement failed:', err)
  } finally {
    isSubmitting.value = false
  }
}

async function handleChallenge(challengerId: string, position: number) {
  isSubmitting.value = true
  try {
    const result = await gameStore.challenge(challengerId, position)
    lastResult.value = { ...result, goodForPlayer: result.placementWasCorrect }
    // Now reveal music + show video
    await gameStore.revealMusic()
    showMusicVideo.value = true
  } catch (err) {
    console.error('Challenge failed:', err)
  } finally {
    isSubmitting.value = false
  }
}

async function handleSkipChallenge() {
  isSubmitting.value = true
  try {
    const result = await gameStore.skipChallenge()
    lastResult.value = { ...result, goodForPlayer: result.placementCorrect }
    // Now reveal music + show video
    await gameStore.revealMusic()
    showMusicVideo.value = true
  } catch (err) {
    console.error('Skip challenge failed:', err)
  } finally {
    isSubmitting.value = false
  }
}

function handleRoundEnd() {
  nextRound()
}

async function nextRound() {
  isSubmitting.value = true
  try {
    const result = await gameStore.moveToNextRound()

    if (result?.finished) {
      // Game ended after full round check
      showGameOver.value = true
    } else {
      await gameStore.loadCurrentMusic()
      resetUIState()
    }
  } catch (err) {
    console.error('Next round failed:', err)
  } finally {
    isSubmitting.value = false
  }
}

function resetUIState() {
  showMusicVideo.value = false
  showGameOver.value = false
  pendingCard.value = null
  lastResult.value = null
  songGuessRef.value?.reset()
  cardPlacementRef.value?.reset()
  challengeRef.value?.reset()
  videoWindowRef.value?.reset()
}

function resetGame() {
  gameStore.reset()
  resetUIState()
}

onMounted(async () => {
  if (gameStore.currentGame) {
    await gameStore.loadCurrentMusic()
  }
})
</script>

<style scoped>
.game-root {
  position: relative;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.table-area {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  height: 100dvh;
  padding-top: 40px;
  /* Reserve space for bottom panel */
  padding-bottom: 45vh;
}

@media (min-width: 640px) {
  .table-area {
    padding-top: 50px;
    padding-bottom: 30vh;
  }
}
</style>
