<template>
  <div class="table-container">
    <div class="table-circle"></div>
    <PlayerSeat
      v-for="seat in seats"
      :key="seat.player.id"
      :player="seat.player"
      :x="seat.x"
      :y="seat.y"
      :rotation="seat.rotation"
      :color="seat.color"
    />
    <CenterDeck
      :round-number="roundNumber"
      :disabled="!isPlayable"
      @play="$emit('play')"
    />
    <!-- Hidden YouTube iframe for audio -->
    <iframe
      v-if="youtubeId"
      :src="`https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=45&showinfo=0&modestbranding=1`"
      :class="['yt-iframe', { visible: showVideo }]"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Player } from '@/types'
import PlayerSeat from './PlayerSeat.vue'
import CenterDeck from './CenterDeck.vue'

const COLORS = ['#00ffff', '#ff6bcb', '#ffd700', '#7cff7c', '#ff7c7c', '#b47cff', '#ff9f43', '#4ecdc4']

const props = defineProps<{
  players: Player[]
  roundNumber: number
  isPlayable: boolean
  youtubeId?: string
  showVideo?: boolean
}>()

defineEmits<{ play: [] }>()

const seats = computed(() => {
  const list = props.players
  const count = list.length
  if (count === 0) return []

  const currentIdx = list.findIndex(p => p.isCurrentPlayer)

  return list.map((player, i) => {
    const offsetIndex = (i - currentIdx + count) % count
    // 90° = bottom in CSS coordinates (y-axis is inverted)
    const angleDeg = ((offsetIndex / count) * 360 + 90) % 360
    const rad = (angleDeg * Math.PI) / 180

    const radiusX = 42
    const radiusY = 34
    const x = 50 + radiusX * Math.cos(rad)
    // Shift center up so bottom player isn't covered by panel
    const y = 42 + radiusY * Math.sin(rad)

    // Cards rotation: current player (bottom) = 0, others face center
    const rotation = offsetIndex === 0 ? 0 : angleDeg + 90

    return {
      player,
      x,
      y,
      rotation,
      color: COLORS[i % COLORS.length],
    }
  })
})
</script>

<style scoped>
.table-container {
  position: relative;
  width: min(85vmin, 750px);
  aspect-ratio: 1;
  margin: 0 auto;
}

.table-circle {
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: radial-gradient(circle, rgba(0, 255, 255, 0.02) 0%, transparent 70%);
}

.yt-iframe {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.yt-iframe.visible {
  position: fixed;
  bottom: 160px;
  right: 20px;
  width: 320px;
  height: 180px;
  opacity: 1;
  pointer-events: auto;
  border-radius: 12px;
  z-index: 50;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}
</style>
