<template>
  <Transition name="panel">
    <div v-if="visible" class="bottom-panel">
      <div class="panel-card">
        <!-- Initial: two buttons + change song -->
        <template v-if="!showAnswer">
          <p class="panel-title">Your turn — listen and guess!</p>
          <div class="btn-row">
            <button class="btn btn-primary" @click="revealAnswer" :disabled="submitting || !isMyTurn">
              I know this song!
            </button>
            <button class="btn btn-ghost" @click="$emit('skip')" :disabled="submitting || !isMyTurn">
              Skip, place card
            </button>
          </div>
          <button
            class="btn btn-token"
            @click="$emit('changeSong')"
            :disabled="submitting || !isMyTurn || currentTokens < 1"
          >
            🔄 Change Song (1 token)
          </button>
        </template>

        <!-- After reveal -->
        <template v-else>
          <!-- Song info (only after show video) -->
          <div v-if="showVideo && revealedMusic" class="song-info">
            <p class="song-title">{{ revealedMusic.title }}</p>
            <p v-if="revealedMusic.artist" class="song-artist">{{ revealedMusic.artist }}</p>
          </div>

          <!-- Winner selection -->
          <template v-if="selectingWinner">
            <p class="panel-subtitle">Who guessed correctly?</p>
            <div class="player-select">
              <button
                v-for="p in players"
                :key="p.id"
                :class="['chip', { active: selectedWinner === p.id }]"
                @click="selectedWinner = p.id"
              >
                {{ p.name }}
              </button>
            </div>
            <div class="btn-row">
              <button class="btn btn-success" @click="confirmWinner" :disabled="!selectedWinner || submitting">
                Confirm
              </button>
              <button class="btn btn-ghost" @click="selectingWinner = false; selectedWinner = null">
                Cancel
              </button>
            </div>
          </template>

          <!-- Three action buttons -->
          <template v-else>
            <div class="btn-row">
              <button class="btn btn-accent" @click="$emit('showVideo')" :disabled="submitting || !isMyTurn">
                Show Video
              </button>
              <button class="btn btn-success" @click="selectingWinner = true" :disabled="submitting || !isMyTurn">
                Someone got it!
              </button>
              <button class="btn btn-danger" @click="$emit('wrong')" :disabled="submitting || !isMyTurn">
                No one got it
              </button>
            </div>
          </template>

          <!-- Result message -->
          <p v-if="resultMessage" :class="['result-msg', resultCorrect ? 'correct' : 'wrong']">
            {{ resultMessage }}
          </p>
        </template>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Player, RevealMusicResponse } from '@/types'

defineProps<{
  visible: boolean
  isMyTurn: boolean
  submitting: boolean
  players: Player[]
  revealedMusic: RevealMusicResponse | null
  showVideo: boolean
  resultMessage?: string
  resultCorrect?: boolean
  currentTokens: number
}>()

const emit = defineEmits<{
  reveal: []
  skip: []
  showVideo: []
  wrong: []
  selectWinner: [playerId: string]
  changeSong: []
}>()

const showAnswer = ref(false)
const selectingWinner = ref(false)
const selectedWinner = ref<string | null>(null)

function revealAnswer() {
  emit('reveal')
  showAnswer.value = true
}

function confirmWinner() {
  if (selectedWinner.value) {
    emit('selectWinner', selectedWinner.value)
    selectingWinner.value = false
    selectedWinner.value = null
  }
}

// Reset when panel hides
function reset() {
  showAnswer.value = false
  selectingWinner.value = false
  selectedWinner.value = null
}

defineExpose({ reset })
</script>

<style scoped>
.bottom-panel {
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: 30;
  width: min(380px, 45vw);
}

.panel-card {
  background: rgba(15, 12, 40, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 255, 255, 0.12);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
}

.panel-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.05em;
  font-weight: 600;
  text-align: center;
  margin-bottom: 14px;
}

.panel-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9em;
  text-align: center;
  margin-bottom: 10px;
}

.song-info {
  text-align: center;
  margin-bottom: 12px;
  padding: 10px;
  background: rgba(0, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(0, 255, 255, 0.1);
}

.song-title {
  color: #00ffff;
  font-size: 1em;
  font-weight: 700;
}

.song-artist {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85em;
  margin-top: 2px;
}

.btn-row {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  max-width: 180px;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }

.btn-accent {
  background: rgba(0, 255, 255, 0.15);
  color: #00ffff;
  border: 1px solid rgba(0, 255, 255, 0.3);
}
.btn-accent:hover:not(:disabled) { background: rgba(0, 255, 255, 0.25); }

.btn-success {
  background: rgba(72, 187, 120, 0.2);
  color: #7cff7c;
  border: 1px solid rgba(72, 187, 120, 0.3);
}
.btn-success:hover:not(:disabled) { background: rgba(72, 187, 120, 0.3); }

.btn-danger {
  background: rgba(245, 101, 101, 0.15);
  color: #ff7c7c;
  border: 1px solid rgba(245, 101, 101, 0.3);
}
.btn-danger:hover:not(:disabled) { background: rgba(245, 101, 101, 0.25); }

.btn-ghost {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.btn-ghost:hover:not(:disabled) { background: rgba(255, 255, 255, 0.12); }

.btn-token {
  width: 100%;
  margin-top: 8px;
  padding: 8px 16px;
  background: rgba(255, 215, 0, 0.08);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8em;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-token:hover:not(:disabled) { background: rgba(255, 215, 0, 0.15); }
.btn-token:disabled { opacity: 0.3; cursor: not-allowed; }

.player-select {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 12px;
}

.chip {
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.82em;
  font-weight: 600;
  transition: all 0.2s;
}

.chip:hover { background: rgba(255, 255, 255, 0.15); }

.chip.active {
  background: rgba(0, 255, 255, 0.2);
  color: #00ffff;
  border-color: rgba(0, 255, 255, 0.4);
}

.result-msg {
  text-align: center;
  padding: 8px;
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 600;
  margin-top: 10px;
}
.result-msg.correct { color: #7cff7c; background: rgba(72, 187, 120, 0.1); }
.result-msg.wrong { color: #ff7c7c; background: rgba(245, 101, 101, 0.1); }

/* Panel transition */
.panel-enter-active { transition: all 0.3s ease-out; }
.panel-leave-active { transition: all 0.2s ease-in; }
.panel-enter-from { opacity: 0; transform: translateY(20px); }
.panel-leave-to { opacity: 0; transform: translateY(20px); }
</style>
