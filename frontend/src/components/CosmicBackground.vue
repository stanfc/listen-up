<template>
  <div class="cosmic-bg">
    <div class="stars" :style="starsStyle"></div>
    <div class="nebula"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Generate random star positions via CSS radial-gradient
const starsStyle = computed(() => {
  const stars: string[] = []
  for (let i = 0; i < 80; i++) {
    const x = Math.floor(Math.random() * 2000)
    const y = Math.floor(Math.random() * 2000)
    const size = Math.random() > 0.7 ? 2 : 1
    const opacity = (Math.random() * 0.6 + 0.4).toFixed(2)
    stars.push(`radial-gradient(${size}px ${size}px at ${x}px ${y}px, rgba(255,255,255,${opacity}), transparent)`)
  }
  return { backgroundImage: stars.join(','), backgroundSize: '2000px 2000px' }
})
</script>

<style scoped>
.cosmic-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: radial-gradient(ellipse at 20% 50%, var(--bg-to) 0%, var(--bg-from) 50%, #000 100%);
  overflow: hidden;
}

.stars {
  position: absolute;
  inset: 0;
  animation: twinkle 6s ease-in-out infinite alternate;
}

.nebula {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 70% 20%, rgba(100, 0, 200, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 20% 70%, rgba(0, 80, 200, 0.08) 0%, transparent 45%),
    radial-gradient(ellipse at 50% 50%, rgba(var(--accent-rgb), 0.03) 0%, transparent 40%);
}

@keyframes twinkle {
  0% { opacity: 0.8; }
  100% { opacity: 1; }
}
</style>
