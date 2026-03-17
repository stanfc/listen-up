<template>
  <div class="center-deck">
    <!-- Stacked cards -->
    <div class="deck-stack">
      <div class="deck-card" v-for="i in 3" :key="i" :style="stackStyle(i)"></div>
    </div>
    <!-- Play button -->
    <button class="play-btn" @click="$emit('play')" :disabled="disabled">
      <div class="glow-ring"></div>
      <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </button>
    <!-- Round badge -->
    <div class="round-badge" v-if="roundNumber">
      第 {{ roundNumber }} 回合
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  roundNumber?: number
  disabled?: boolean
}>()

defineEmits<{
  play: []
}>()

function stackStyle(i: number) {
  const offset = (3 - i) * 3
  return {
    transform: `translate(${offset}px, ${offset}px)`,
    opacity: 1 - (3 - i) * 0.15,
  }
}
</script>

<style scoped>
.center-deck {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.deck-stack {
  position: relative;
  width: clamp(56px, 12vmin, 80px);
  height: clamp(78px, 17vmin, 112px);
}

.deck-card {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1a1a3e, #2d2b55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.play-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(44px, 10vmin, 60px);
  height: clamp(44px, 10vmin, 60px);
  border-radius: 50%;
  border: none;
  background: rgba(10, 10, 30, 0.9);
  color: #00ffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 6;
}

.play-btn:hover:not(:disabled) {
  transform: translate(-50%, -50%) scale(1.08);
}

.play-btn:active:not(:disabled) {
  transform: translate(-50%, -50%) scale(0.95);
}

.play-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.play-icon {
  width: clamp(18px, 4vmin, 24px);
  height: clamp(18px, 4vmin, 24px);
  margin-left: 2px;
}

.glow-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid rgba(0, 255, 255, 0.5);
  box-shadow:
    0 0 16px rgba(0, 255, 255, 0.3),
    inset 0 0 16px rgba(0, 255, 255, 0.05);
  animation: ringPulse 3s ease-in-out infinite;
}

@keyframes ringPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.round-badge {
  position: absolute;
  bottom: -28px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.7em;
  padding: 2px 10px;
  border-radius: 8px;
  white-space: nowrap;
  letter-spacing: 0.5px;
}
</style>
