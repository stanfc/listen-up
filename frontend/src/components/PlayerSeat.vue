<template>
  <div
    class="player-seat"
    :class="{ 'is-current': player.isCurrentPlayer }"
    :style="seatStyle"
  >
    <div class="seat-inner" :style="{ transform: `rotate(${-rotation}deg)` }">
      <!-- Player info -->
      <div class="player-info">
        <span class="player-dot" :style="{ background: color }"></span>
        <span class="player-name">{{ player.name }}</span>
        <span class="player-tokens">{{ player.tokens }}</span>
      </div>
      <!-- Timeline cards -->
      <div class="timeline-row">
        <TransitionGroup name="card-list" tag="div" class="cards-container">
          <TimelineCard
            v-for="card in player.cards"
            :key="card.id"
            :card="card"
            :is-flipped="true"
            :size="player.isCurrentPlayer ? 'md' : 'sm'"
            :color="color"
          />
        </TransitionGroup>
      </div>
      <!-- Card count badge -->
      <div class="card-count">
        <span>{{ player.cards.length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Player } from '@/types'
import TimelineCard from './TimelineCard.vue'

const props = defineProps<{
  player: Player
  x: number         // percent
  y: number         // percent
  rotation: number   // degrees
  color: string
}>()

const seatStyle = computed(() => ({
  left: `${props.x}%`,
  top: `${props.y}%`,
  transform: `translate(-50%, -50%) rotate(${props.rotation}deg)`,
}))
</script>

<style scoped>
.player-seat {
  position: absolute;
  z-index: 2;
  transition: all 0.5s ease;
}

.seat-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 60px;
}

@media (min-width: 640px) {
  .seat-inner {
    gap: 4px;
    min-width: 80px;
  }
}

.player-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  backdrop-filter: blur(4px);
  white-space: nowrap;
}

.player-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.player-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.75em;
  font-weight: 600;
}

.player-tokens {
  color: #ffd700;
  font-size: 0.7em;
  font-weight: 700;
}

.player-tokens::before {
  content: '\1FA99';
  margin-right: 2px;
}

.timeline-row {
  display: flex;
  justify-content: center;
}

.cards-container {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.card-count {
  background: rgba(0, 0, 0, 0.6);
  border-radius: 10px;
  padding: 1px 8px;
  font-size: 0.65em;
  color: rgba(255, 255, 255, 0.6);
}

/* Current player highlight */
.is-current .player-info {
  background: rgba(var(--accent-rgb), 0.15);
  border: 1px solid rgba(var(--accent-rgb), 0.3);
}

.is-current .player-name {
  color: var(--accent);
}

/* TransitionGroup animations */
.card-list-move {
  transition: transform 0.4s ease;
}
.card-list-enter-active {
  transition: all 0.4s ease;
}
.card-list-leave-active {
  transition: all 0.3s ease;
  position: absolute;
}
.card-list-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.8);
}
.card-list-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
