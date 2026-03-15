<template>
  <div :class="['tl-card', { 'is-new': isNew, 'is-flipped': isFlipped }]" :style="cardStyle">
    <div class="card-inner">
      <div class="card-back">
        <div class="card-pattern"></div>
      </div>
      <div class="card-front">
        <span class="card-year">{{ card?.year }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Card } from '@/types'

const props = withDefaults(defineProps<{
  card?: Card
  isFlipped?: boolean
  isNew?: boolean
  size?: 'sm' | 'md'
  color?: string
}>(), {
  isFlipped: true,
  isNew: false,
  size: 'md',
  color: '#00ffff'
})

const cardStyle = computed(() => ({
  '--card-color': props.color,
  '--card-w': props.size === 'sm' ? '50px' : '64px',
  '--card-h': props.size === 'sm' ? '72px' : '90px',
  '--font-size': props.size === 'sm' ? '0.85em' : '1.1em',
}))
</script>

<style scoped>
.tl-card {
  width: var(--card-w, 64px);
  height: var(--card-h, 90px);
  perspective: 600px;
  flex-shrink: 0;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.is-flipped .card-inner {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-back {
  background: linear-gradient(135deg, #1a1a3e, #2d2b55);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.card-pattern {
  width: 100%;
  height: 100%;
  background:
    repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.03) 8px, rgba(255,255,255,0.03) 9px),
    repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(255,255,255,0.03) 8px, rgba(255,255,255,0.03) 9px);
}

.card-front {
  transform: rotateY(180deg);
  background: linear-gradient(135deg, #0f0c29, #302b63);
  border: 1.5px solid var(--card-color, #00ffff);
  box-shadow: 0 0 6px rgba(0, 255, 255, 0.15);
}

.card-year {
  color: var(--card-color, #00ffff);
  font-weight: 700;
  font-size: var(--font-size, 1.1em);
  text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
  font-family: 'Courier New', monospace;
}

/* New card glow pulse */
.is-new .card-front {
  animation: neonPulse 2s ease-in-out infinite;
}

@keyframes neonPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(0, 255, 255, 0.3), 0 0 16px rgba(0, 255, 255, 0.1); }
  50% { box-shadow: 0 0 16px rgba(0, 255, 255, 0.6), 0 0 32px rgba(0, 255, 255, 0.2); }
}
</style>
