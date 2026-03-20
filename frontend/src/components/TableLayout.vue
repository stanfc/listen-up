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
      :token-points-k="tokenPointsK"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Player } from '@/types'
import PlayerSeat from './PlayerSeat.vue'

const COLORS = ['#00ffff', '#ff6bcb', '#ffd700', '#7cff7c', '#ff7c7c', '#b47cff', '#ff9f43', '#4ecdc4']

const props = defineProps<{
  players: Player[]
  roundNumber: number
  isPlayable: boolean
  tokenPointsK?: number
}>()

const seats = computed(() => {
  const list = props.players
  const count = list.length
  if (count === 0) return []

  const currentIdx = list.findIndex(p => p.isCurrentPlayer)

  return list.map((player, i) => {
    const offsetIndex = (i - currentIdx + count) % count
    const angleDeg = ((offsetIndex / count) * 360 + 90) % 360
    const rad = (angleDeg * Math.PI) / 180

    const radiusX = 38
    const radiusY = 28
    const x = 50 + radiusX * Math.cos(rad)
    const y = 45 + radiusY * Math.sin(rad)

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
  width: 100%;
  height: 100%;
  max-width: 750px;
  max-height: 750px;
  margin: 0 auto;
}

.table-circle {
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: radial-gradient(circle, rgba(var(--accent-rgb), 0.02) 0%, transparent 70%);
}
</style>
