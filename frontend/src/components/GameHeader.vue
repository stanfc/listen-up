<template>
  <header class="game-hud">
    <div class="hud-left">
      <img src="/logo_without_bg.png" alt="" class="logo-icon" />
      <span class="logo">Listen Up!</span>
    </div>
    <div class="hud-center">
      <span class="hud-item">房間 <strong>{{ roomCode }}</strong></span>
      <span class="hud-divider">|</span>
      <span class="hud-item">第 <strong>{{ roundNumber }}</strong> 回合</span>
      <span class="hud-divider">|</span>
      <span class="hud-item current-player">{{ currentPlayerName }}</span>
    </div>
    <div class="hud-right">
      <button class="icon-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全螢幕' : '全螢幕'">
        <svg v-if="!isFullscreen" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
        </svg>
      </button>
      <button class="icon-btn" @click="$emit('rules')" title="規則書">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M6 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13zM8 12h8v2H8v-2zm0 4h8v2H8v-2z"/>
        </svg>
      </button>
      <button class="icon-btn" @click="$emit('reset')" title="回到設定">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{
  roomCode: string
  roundNumber: number
  currentPlayerName: string
}>()

defineEmits<{ reset: [], rules: [] }>()

const isFullscreen = ref(!!document.fullscreenElement)

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen().catch(() => {})
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => document.addEventListener('fullscreenchange', onFullscreenChange))
onUnmounted(() => document.removeEventListener('fullscreenchange', onFullscreenChange))
</script>

<style scoped>
.game-hud {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

@media (min-width: 640px) {
  .game-hud {
    padding: 8px 20px;
  }
}

.hud-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.logo-icon {
  width: 24px;
  height: 24px;
  image-rendering: pixelated;
}

.logo {
  font-family: 'Segoe Script', 'Brush Script MT', cursive;
  font-size: 1em;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 700;
  font-style: italic;
}

@media (min-width: 640px) {
  .logo {
    font-size: 1.2em;
  }
}

.hud-center {
  display: flex;
  align-items: center;
  gap: 6px;
}

@media (min-width: 640px) {
  .hud-center {
    gap: 12px;
  }
}

.hud-item {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.7em;
}

@media (min-width: 640px) {
  .hud-item {
    font-size: 0.8em;
  }
}

.hud-divider {
  display: none;
}

@media (min-width: 640px) {
  .hud-divider {
    display: inline;
  }
}

.hud-item strong {
  color: rgba(255, 255, 255, 0.9);
}

.current-player {
  color: var(--accent);
  font-weight: 600;
}

.hud-right {
  display: flex;
  gap: 4px;
}

.icon-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
}

.icon-btn:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.1);
}
</style>
