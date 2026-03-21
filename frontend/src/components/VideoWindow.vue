<template>
  <!-- Single iframe, always alive. Visibility toggled via CSS only. -->
  <div
    v-if="youtubeId"
    class="video-window"
    :class="{ hidden: !visible, minimized }"
    :style="visible ? videoStyle : undefined"
  >
    <div
      v-show="visible"
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
      :src="`https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=45&showinfo=0&modestbranding=1`"
      class="yt-iframe"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onUnmounted, watch } from 'vue'

const props = defineProps<{
  youtubeId?: string
  visible: boolean
}>()

// Override media session to hide song name from notifications
function hideMediaInfo() {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Listen Up!',
      artist: '猜猜看',
    })
  }
}

// Re-apply whenever YouTube changes it (poll since iframe can't be listened to)
let mediaInterval: ReturnType<typeof setInterval> | null = null

watch(() => props.youtubeId, () => {
  if (mediaInterval) clearInterval(mediaInterval)
  if (props.youtubeId) {
    hideMediaInfo()
    mediaInterval = setInterval(hideMediaInfo, 1000)
  }
}, { immediate: true })

onUnmounted(() => {
  if (mediaInterval) clearInterval(mediaInterval)
})

const minimized = ref(false)
const pos = reactive({ x: -1, y: -1 })
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

function reset() {
  minimized.value = false
  pos.x = -1
  pos.y = -1
}

onUnmounted(() => stopDrag())

defineExpose({ reset })
</script>

<style scoped>
.video-window {
  position: fixed;
  top: 48px;
  right: 8px;
  z-index: 9999;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  background: #000;
}

/* Hidden state: shrink to 1px, keep iframe alive for audio */
.video-window.hidden {
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
  box-shadow: none;
}

/* Minimized: hide iframe but keep handle visible */
.video-window.minimized .yt-iframe {
  display: none;
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
}

.video-minimize {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 0.8em;
  padding: 2px 4px;
  border-radius: 4px;
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
