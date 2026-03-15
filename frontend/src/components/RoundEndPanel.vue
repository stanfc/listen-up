<template>
  <Transition name="panel">
    <div v-if="visible" class="bottom-panel">
      <div class="panel-card">
        <!-- Deuce banner -->
        <div v-if="isDeuce" class="deuce-banner">
          <span>DEUCE!</span>
        </div>

        <!-- Song reveal -->
        <div v-if="revealedMusic" class="song-reveal">
          <div class="reveal-badge">Answer</div>
          <p class="song-title">{{ revealedMusic.title }}</p>
          <p v-if="revealedMusic.artist" class="song-artist">{{ revealedMusic.artist }}</p>
          <p class="song-year">{{ revealedMusic.year }}</p>
        </div>

        <!-- Result message -->
        <p v-if="resultMessage" :class="['result-msg', resultSuccess ? 'correct' : 'wrong']">
          {{ resultMessage }}
        </p>

        <button class="btn btn-primary" @click="$emit('nextRound')" :disabled="submitting">
          {{ submitting ? 'Loading...' : 'Next Round' }}
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
  padding: 20px 24px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  text-align: center;
}

.deuce-banner {
  background: linear-gradient(135deg, rgba(255, 107, 203, 0.15), rgba(255, 80, 80, 0.1));
  border: 1px solid rgba(255, 107, 203, 0.3);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 14px;
  color: #ff6bcb;
  font-size: 1.1em;
  font-weight: 800;
  letter-spacing: 2px;
  text-shadow: 0 0 12px rgba(255, 107, 203, 0.3);
}

.song-reveal {
  margin-bottom: 16px;
}

.reveal-badge {
  display: inline-block;
  padding: 2px 12px;
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 12px;
  color: #00ffff;
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.song-title {
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.1em;
  font-weight: 700;
  margin-bottom: 4px;
}

.song-artist {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9em;
}

.song-year {
  color: #00ffff;
  font-size: 1.6em;
  font-weight: 800;
  margin-top: 6px;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 12px rgba(0, 255, 255, 0.4);
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
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95em;
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
