<template>
  <Transition name="panel">
    <div v-if="visible" class="bottom-panel">
      <div class="panel-card">
        <p class="panel-title">將卡牌放入你的時間線</p>

        <!-- Timeline with insert gaps -->
        <div class="placement-timeline">
          <div
            class="insert-gap"
            :class="{ active: selectedPos === 0 }"
            @click="selectedPos = selectedPos === 0 ? null : 0"
          ><span class="gap-icon">+</span></div>

          <template v-for="(card, idx) in cards" :key="card.id">
            <TimelineCard :card="card" :is-flipped="true" size="md" color="#00ffff" />
            <div
              class="insert-gap"
              :class="{ active: selectedPos === idx + 1 }"
              @click="selectedPos = selectedPos === idx + 1 ? null : idx + 1"
            ><span class="gap-icon">+</span></div>
          </template>
        </div>

        <!-- Pending card preview -->
        <div v-if="pendingCard" class="pending-info">
          <span>新卡牌</span>
        </div>

        <div class="btn-row">
          <button class="btn btn-success" @click="confirm" :disabled="selectedPos === null || submitting">
            確認
          </button>
          <button class="btn btn-ghost" @click="selectedPos = null">
            重置
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Card } from '@/types'
import TimelineCard from './TimelineCard.vue'

defineProps<{
  visible: boolean
  cards: Card[]
  pendingCard: Card | null
  submitting: boolean
}>()

const emit = defineEmits<{
  place: [position: number]
}>()

const selectedPos = ref<number | null>(null)

function confirm() {
  if (selectedPos.value !== null) {
    emit('place', selectedPos.value)
    selectedPos.value = null
  }
}

function reset() {
  selectedPos.value = null
}

defineExpose({ reset })
</script>

<style scoped>
.bottom-panel {
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: 30;
  width: min(420px, 50vw);
}

.panel-card {
  background: rgba(15, 12, 40, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 255, 255, 0.12);
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 -4px 40px rgba(0, 0, 0, 0.5);
}

.panel-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1em;
  font-weight: 600;
  text-align: center;
  margin-bottom: 14px;
}

.placement-timeline {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 20px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.insert-gap {
  width: 8px;
  height: 60px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
  flex-shrink: 0;
  overflow: hidden;
  background: transparent;
}

.insert-gap .gap-icon {
  opacity: 0;
  font-size: 1em;
  font-weight: 700;
  color: rgba(0, 255, 255, 0.6);
  transition: opacity 0.2s;
}

.insert-gap:hover {
  width: 36px;
  background: rgba(0, 255, 255, 0.08);
  border: 1px dashed rgba(0, 255, 255, 0.3);
}

.insert-gap:hover .gap-icon {
  opacity: 1;
}

.insert-gap.active {
  width: 36px;
  background: rgba(255, 107, 203, 0.12);
  border: 2px solid #ff6bcb;
  box-shadow: 0 0 10px rgba(255, 107, 203, 0.2);
}

.insert-gap.active .gap-icon {
  opacity: 1;
  color: #ff6bcb;
}

.pending-info {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8em;
  margin: 6px 0 12px;
}

.btn-row {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-success {
  background: rgba(72, 187, 120, 0.2);
  color: #7cff7c;
  border: 1px solid rgba(72, 187, 120, 0.3);
  flex: 1;
  max-width: 180px;
}
.btn-success:hover:not(:disabled) { background: rgba(72, 187, 120, 0.3); }

.btn-ghost {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.btn-ghost:hover:not(:disabled) { background: rgba(255, 255, 255, 0.12); }

/* Panel transition */
.panel-enter-active { transition: all 0.3s ease-out; }
.panel-leave-active { transition: all 0.2s ease-in; }
.panel-enter-from { opacity: 0; transform: translateY(20px); }
.panel-leave-to { opacity: 0; transform: translateY(20px); }
</style>
