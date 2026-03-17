<template>
  <Transition name="panel">
    <div v-if="visible" class="bottom-panel">
      <div class="panel-card">
        <!-- Song info (shown after reveal) -->
        <div v-if="revealedMusic" class="song-info">
          <p class="song-title">{{ revealedMusic.title }}</p>
          <p v-if="revealedMusic.artist" class="song-artist">{{ revealedMusic.artist }}</p>
        </div>

        <p class="panel-title">聽歌猜猜看！</p>

        <!-- Top row: Show Video + Change Song -->
        <div class="top-row">
          <button
            class="btn btn-accent"
            @click="handleShowVideo"
            :disabled="submitting || !isMyTurn"
          >
            顯示影片
          </button>
          <button
            class="btn btn-token"
            @click="$emit('changeSong')"
            :disabled="submitting || !isMyTurn || currentTokens < 1"
          >
            🔄 換歌 (1 代幣)
          </button>
        </div>

        <!-- Player guess buttons in 2-col grid -->
        <div class="player-grid">
          <button
            v-for="p in players"
            :key="p.id"
            class="btn btn-success"
            @click="$emit('selectWinner', p.id)"
            :disabled="submitting || !isMyTurn"
          >
            {{ p.name }} 猜對
          </button>
          <!-- No one got it - sits in the grid -->
          <button
            class="btn btn-danger"
            @click="$emit('wrong')"
            :disabled="submitting || !isMyTurn"
          >
            無人猜對
          </button>
        </div>

        <!-- Result message -->
        <p v-if="resultMessage" :class="['result-msg', resultCorrect ? 'correct' : 'wrong']">
          {{ resultMessage }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { Player, RevealMusicResponse } from '@/types'

defineProps<{
  visible: boolean
  isMyTurn: boolean
  submitting: boolean
  players: Player[]
  revealedMusic: RevealMusicResponse | null
  resultMessage?: string
  resultCorrect?: boolean
  currentTokens: number
}>()

const emit = defineEmits<{
  revealAndShowVideo: []
  skip: []
  wrong: []
  selectWinner: [playerId: string]
  changeSong: []
}>()

function handleShowVideo() {
  emit('revealAndShowVideo')
}

function reset() {
  // No internal state to reset
}

defineExpose({ reset })
</script>

<style scoped>
.bottom-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 30;
  padding: 0 12px 12px;
}

@media (min-width: 640px) {
  .bottom-panel {
    right: auto;
    padding: 0;
    bottom: 16px;
    left: 16px;
    width: clamp(260px, 28vw, 380px);
  }
}

.panel-card {
  background: rgba(15, 12, 40, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 255, 255, 0.12);
  border-radius: 12px;
  padding: clamp(10px, 1.5vh, 16px) clamp(12px, 1.5vw, 20px);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
}

.panel-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: clamp(0.8em, 1.2vw, 1.05em);
  font-weight: 600;
  text-align: center;
  margin-bottom: clamp(6px, 1vh, 12px);
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
  font-size: clamp(0.75em, 1.1vw, 1em);
  font-weight: 700;
}

.song-artist {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85em;
  margin-top: 2px;
}

/* Top row: show video + change song side by side */
.top-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.top-row .btn {
  flex: 1;
}

/* Player grid: 2 columns */
.player-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(4px, 0.5vh, 6px);
  margin-bottom: 4px;
}

.btn {
  padding: clamp(6px, 0.8vh, 9px) clamp(8px, 1vw, 12px);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: clamp(0.7em, 1vw, 0.82em);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-accent {
  background: rgba(0, 255, 255, 0.15);
  color: #00ffff;
  border: 1px solid rgba(0, 255, 255, 0.3);
}
.btn-accent:hover:not(:disabled) { background: rgba(0, 255, 255, 0.25); }

.btn-success {
  background: rgba(72, 187, 120, 0.15);
  color: #7cff7c;
  border: 1px solid rgba(72, 187, 120, 0.25);
}
.btn-success:hover:not(:disabled) { background: rgba(72, 187, 120, 0.3); }

.btn-danger {
  background: rgba(245, 101, 101, 0.12);
  color: #ff7c7c;
  border: 1px solid rgba(245, 101, 101, 0.25);
}
.btn-danger:hover:not(:disabled) { background: rgba(245, 101, 101, 0.25); }

.btn-token {
  background: rgba(255, 215, 0, 0.08);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.2);
}
.btn-token:hover:not(:disabled) { background: rgba(255, 215, 0, 0.15); }
.btn-token:disabled { opacity: 0.3; cursor: not-allowed; }

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
