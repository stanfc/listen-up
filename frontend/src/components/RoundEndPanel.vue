<template>
  <Transition name="panel">
    <div v-if="visible" class="bottom-panel">
      <div class="panel-card">
        <!-- Deuce banner -->
        <div v-if="isDeuce" class="deuce-banner">
          <span>平手！</span>
        </div>

        <!-- Song reveal -->
        <div v-if="revealedMusic" class="song-reveal">
          <div class="reveal-badge">答案</div>
          <p class="song-title">{{ revealedMusic.title }}</p>
          <p v-if="revealedMusic.artist" class="song-artist">{{ revealedMusic.artist }}</p>
          <p class="song-year">{{ revealedMusic.year }}</p>
        </div>

        <!-- Result message -->
        <p v-if="resultMessage" :class="['result-msg', resultSuccess ? 'correct' : 'wrong']">
          {{ resultMessage }}
        </p>

        <button class="btn btn-primary" @click="$emit('nextRound')" :disabled="submitting">
          {{ submitting ? '載入中...' : '下一回合' }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { RevealMusicResponse } from '@/types'

defineProps<{
  visible: boolean
  revealedMusic: RevealMusicResponse | null
  resultMessage?: string
  resultSuccess?: boolean
  submitting: boolean
  isDeuce?: boolean
}>()

defineEmits<{ nextRound: [] }>()
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
  background: rgba(var(--surface), 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--accent-rgb), 0.12);
  border-radius: 12px;
  padding: clamp(12px, 1.5vh, 20px) clamp(14px, 1.5vw, 24px);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  text-align: center;
}

.deuce-banner {
  background: linear-gradient(135deg, rgba(var(--secondary-rgb), 0.15), rgba(255, 80, 80, 0.1));
  border: 1px solid rgba(var(--secondary-rgb), 0.3);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 14px;
  color: var(--secondary);
  font-size: 1.1em;
  font-weight: 800;
  letter-spacing: 2px;
  text-shadow: 0 0 12px rgba(var(--secondary-rgb), 0.3);
}

.song-reveal {
  margin-bottom: 16px;
}

.reveal-badge {
  display: inline-block;
  padding: 2px 12px;
  background: rgba(var(--accent-rgb), 0.1);
  border: 1px solid rgba(var(--accent-rgb), 0.2);
  border-radius: 12px;
  color: var(--accent);
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.song-title {
  color: rgba(255, 255, 255, 0.95);
  font-size: clamp(0.85em, 1.2vw, 1.1em);
  font-weight: 700;
  margin-bottom: 4px;
}

.song-artist {
  color: rgba(255, 255, 255, 0.5);
  font-size: clamp(0.75em, 1vw, 0.9em);
}

.song-year {
  color: var(--accent);
  font-size: clamp(1.1em, 1.8vw, 1.6em);
  font-weight: 800;
  margin-top: 6px;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 12px rgba(var(--accent-rgb), 0.4);
}

.result-msg {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.85em;
  font-weight: 600;
  margin-bottom: 14px;
}
.result-msg.correct { color: #7cff7c; background: rgba(72, 187, 120, 0.1); }
.result-msg.wrong { color: #ff7c7c; background: rgba(245, 101, 101, 0.1); }

.btn {
  width: 100%;
  padding: clamp(8px, 1vh, 12px);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: clamp(0.78em, 1.1vw, 0.95em);
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }

/* Panel transition */
.panel-enter-active { transition: all 0.3s ease-out; }
.panel-leave-active { transition: all 0.2s ease-in; }
.panel-enter-from { opacity: 0; transform: translateY(20px); }
.panel-leave-to { opacity: 0; transform: translateY(20px); }
</style>
