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
    <!-- Draggable YouTube video window -->
    <div
      v-if="youtubeId && showVideo"
      ref="videoWindow"
      class="video-window"
      :style="videoStyle"
    >
      <div
        class="video-handle"
        @mousedown.prevent="startDrag"
        @touchstart.prevent="startDrag"
      >
        <span class="handle-dots">⠿</span>
        <button class="video-minimize" @click="minimized = !minimized">
          {{ minimized ? '▢' : '—' }}
        </button>
      </div>
      <iframe
        v-show="!minimized"
        :src="`https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=45&showinfo=0&modestbranding=1`"
        class="yt-iframe"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      ></iframe>
    </div>
    <!-- Hidden audio-only iframe when not showing video -->
    <iframe
      v-if="youtubeId && !showVideo"
      :src="`https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=45&showinfo=0&modestbranding=1`"
      class="yt-hidden"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onUnmounted } from 'vue'
import type { Player } from '@/types'
import PlayerSeat from './PlayerSeat.vue'

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

    const radiusX = 38
    const radiusY = 28
    const x = 50 + radiusX * Math.cos(rad)
    const y = 45 + radiusY * Math.sin(rad)

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

// --- Draggable video window ---
const minimized = ref(false)
const pos = reactive({ x: -1, y: -1 }) // -1 = use CSS default
const dragging = ref(false)
const dragOffset = reactive({ x: 0, y: 0 })

const videoStyle = computed(() => {
  if (pos.x < 0 && pos.y < 0) return {}
  return {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    right: 'auto',
    bottom: 'auto',
  }
})

function startDrag(e: MouseEvent | TouchEvent) {
  dragging.value = true
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const el = (e.currentTarget as HTMLElement).parentElement!
  const rect = el.getBoundingClientRect()
  dragOffset.x = clientX - rect.left
  dragOffset.y = clientY - rect.top

  // Initialize position from current rect if first drag
  if (pos.x < 0) {
    pos.x = rect.left
    pos.y = rect.top
  }

  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchmove', onDrag, { passive: false })
  window.addEventListener('touchend', stopDrag)
}

function onDrag(e: MouseEvent | TouchEvent) {
  if (!dragging.value) return
  e.preventDefault()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  pos.x = Math.max(0, Math.min(window.innerWidth - 100, clientX - dragOffset.x))
  pos.y = Math.max(0, Math.min(window.innerHeight - 60, clientY - dragOffset.y))
}

function stopDrag() {
  dragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('touchend', stopDrag)
}

onUnmounted(() => {
  stopDrag()
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
  background: radial-gradient(circle, rgba(0, 255, 255, 0.02) 0%, transparent 70%);
}

.yt-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.video-window {
  position: fixed;
  top: 48px;
  right: 8px;
  z-index: 50;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  background: #000;
  transition: box-shadow 0.2s;
}

.video-window:hover {
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.8);
}

.video-handle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 8px;
  background: rgba(30, 25, 60, 0.95);
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.video-handle:active {
  cursor: grabbing;
}

.handle-dots {
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.9em;
  letter-spacing: 1px;
}

.video-minimize {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 0.8em;
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.15s;
}

.video-minimize:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
}

.yt-iframe {
  display: block;
  width: clamp(140px, 22vw, 320px);
  height: clamp(79px, 12.4vw, 180px);
  border: none;
}
</style>
