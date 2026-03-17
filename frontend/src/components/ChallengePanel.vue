<template>
  <Transition name="panel">
    <div v-if="visible" class="bottom-panel">
      <div class="panel-card">
        <p class="panel-title">卡牌已放置！有人要挑戰嗎？</p>
        <p class="panel-hint">
          覺得放錯了？花費 1 個代幣，猜測 {{ currentPlayerName }} 時間線上的正確位置來搶奪卡牌！
        </p>

        <!-- Show current player's timeline with placed card marker -->
        <div class="challenge-timeline">
          <div class="timeline-label">{{ currentPlayerName }} 的時間線：</div>
          <div class="timeline-row">
            <template v-for="(item, idx) in timelineWithPlacement" :key="item.key">
              <!-- Insert slot (for challenger to pick) -->
              <div
                v-if="item.type === 'slot'"
                class="insert-slot"
                :class="{ active: selectedPos === item.slotIndex }"
                @click="selectPos(item.slotIndex!)"
              ><span class="slot-icon">+</span></div>
              <!-- Existing card -->
              <TimelineCard
                v-else-if="item.type === 'card'"
                :card="item.card!"
                :is-flipped="true"
                size="sm"
                color="#00ffff"
              />
              <!-- Placed card (ghost marker) -->
              <div v-else-if="item.type === 'placed'" class="placed-marker">
                <div class="placed-card-inner">
                  <span class="placed-label">?</span>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Challenger selection -->
        <template v-if="!selectedChallenger">
          <p class="panel-subtitle">誰要挑戰？</p>
          <div class="player-select">
            <button
              v-for="p in eligiblePlayers"
              :key="p.id"
              :class="['chip', { disabled: p.tokens < 1 }]"
              :disabled="p.tokens < 1"
              @click="selectedChallenger = p.id"
            >
              {{ p.name }}（{{ p.tokens }} 代幣）
            </button>
          </div>
        </template>

        <!-- After selecting challenger, show position selection -->
        <template v-else>
          <p class="panel-subtitle">
            {{ challengerName }} — 選擇正確位置！（花費 1 代幣）
          </p>
        </template>

        <div class="btn-row">
          <button
            v-if="selectedChallenger && selectedPos !== null"
            class="btn btn-accent"
            @click="submitChallenge"
            :disabled="submitting"
          >
            挑戰！
          </button>
          <button
            class="btn btn-ghost"
            @click="handleSkip"
            :disabled="submitting"
          >
            不挑戰 — 跳過
          </button>
        </div>

        <!-- Result -->
        <p v-if="resultMessage" :class="['result-msg', resultSuccess ? 'correct' : 'wrong']">
          {{ resultMessage }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Player, Card } from '@/types'
import TimelineCard from './TimelineCard.vue'

const props = defineProps<{
  visible: boolean
  players: Player[]
  currentPlayerId: string
  currentPlayerName: string
  currentPlayerCards: Card[]
  challengeCard: Card | null
  placedPosition: number | null
  submitting: boolean
  resultMessage?: string
  resultSuccess?: boolean
}>()

const emit = defineEmits<{
  challenge: [challengerId: string, position: number]
  skip: []
}>()

const selectedChallenger = ref<string | null>(null)
const selectedPos = ref<number | null>(null)

const eligiblePlayers = computed(() =>
  props.players.filter(p => p.id !== props.currentPlayerId)
)

/**
 * Build timeline items: slots, existing cards, and the placed card marker.
 * The placed card is shown as a ghost at `placedPosition`.
 * The slots adjacent to the placed card (= the placed position itself) are blocked.
 */
/**
 * Build timeline: existing cards + placed card marker + insert slots for challenger.
 * The placed position is shown as a ghost card. Challenger slots skip that position.
 */
const timelineWithPlacement = computed(() => {
  const cards = props.currentPlayerCards
  const placedPos = props.placedPosition
  const items: Array<{
    type: 'slot' | 'card' | 'placed'
    key: string
    card?: Card
    slotIndex?: number
  }> = []

  let slotIdx = 0

  for (let i = 0; i <= cards.length; i++) {
    const isPlacedHere = placedPos !== null && placedPos === i

    if (isPlacedHere) {
      // Just the placed card marker — no slot here
      items.push({ type: 'placed', key: 'placed-card' })
    } else {
      items.push({ type: 'slot', key: `slot-${slotIdx}`, slotIndex: slotIdx })
      slotIdx++
    }

    if (i < cards.length) {
      items.push({ type: 'card', key: cards[i].id, card: cards[i] })
    }
  }

  return items
})

const challengerName = computed(() =>
  props.players.find(p => p.id === selectedChallenger.value)?.name || ''
)

function selectPos(pos: number) {
  if (!selectedChallenger.value) return
  selectedPos.value = selectedPos.value === pos ? null : pos
}

function submitChallenge() {
  if (selectedChallenger.value && selectedPos.value !== null) {
    emit('challenge', selectedChallenger.value, selectedPos.value)
  }
}

function handleSkip() {
  emit('skip')
}

function reset() {
  selectedChallenger.value = null
  selectedPos.value = null
}

defineExpose({ reset })
</script>

<style scoped>
.bottom-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 30;
  padding: 0 12px 12px;
}

@media (min-width: 640px) {
  .bottom-panel {
    right: auto;
    padding: 0;
    bottom: 16px;
    left: 16px;
    width: clamp(280px, 30vw, 420px);
  }
}

.panel-card {
  background: rgba(15, 12, 40, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 107, 203, 0.2);
  border-radius: 12px;
  padding: clamp(12px, 1.5vh, 20px) clamp(14px, 1.5vw, 24px);
  box-shadow: 0 -4px 40px rgba(0, 0, 0, 0.5);
}

.panel-title {
  color: #ff6bcb;
  font-size: clamp(0.8em, 1.2vw, 1.05em);
  font-weight: 700;
  text-align: center;
  margin-bottom: 6px;
}

.panel-hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: clamp(0.65em, 0.9vw, 0.8em);
  text-align: center;
  margin-bottom: clamp(8px, 1vh, 14px);
}

.panel-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: clamp(0.75em, 1vw, 0.9em);
  text-align: center;
  margin-bottom: clamp(6px, 0.8vh, 10px);
}

.challenge-timeline {
  margin-bottom: 14px;
}

.timeline-label {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  text-align: center;
}

.timeline-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  overflow-x: auto;
  padding: 6px 0;
}

.insert-slot {
  width: 8px;
  height: clamp(44px, 9vmin, 60px);
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

.insert-slot .slot-icon {
  opacity: 0;
  font-size: 1em;
  font-weight: 700;
  color: rgba(255, 107, 203, 0.6);
  transition: opacity 0.2s;
}

.insert-slot:hover {
  width: 36px;
  background: rgba(255, 107, 203, 0.08);
  border: 1px dashed rgba(255, 107, 203, 0.3);
}

.insert-slot:hover .slot-icon {
  opacity: 1;
}

.insert-slot.active {
  width: 36px;
  background: rgba(255, 107, 203, 0.12);
  border: 2px solid #ff6bcb;
  box-shadow: 0 0 10px rgba(255, 107, 203, 0.2);
}

.insert-slot.active .slot-icon {
  opacity: 1;
  color: #ff6bcb;
}


.placed-marker {
  width: clamp(36px, 7vmin, 50px);
  height: clamp(52px, 10vmin, 72px);
  flex-shrink: 0;
  animation: placedPulse 2s ease-in-out infinite;
}

.placed-card-inner {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: 2px solid rgba(255, 170, 50, 0.6);
  background: linear-gradient(135deg, rgba(255, 170, 50, 0.1), rgba(255, 120, 30, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 12px rgba(255, 170, 50, 0.15);
}

.placed-label {
  color: rgba(255, 170, 50, 0.9);
  font-weight: 700;
  font-size: 1.2em;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 8px rgba(255, 170, 50, 0.5);
}

@keyframes placedPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(255, 170, 50, 0.2); }
  50% { box-shadow: 0 0 16px rgba(255, 170, 50, 0.4); }
}

.player-select {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 12px;
}

.chip {
  padding: clamp(4px, 0.6vh, 6px) clamp(8px, 1vw, 14px);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  cursor: pointer;
  font-size: clamp(0.7em, 1vw, 0.82em);
  font-weight: 600;
  transition: all 0.2s;
}

.chip:hover:not(:disabled) { background: rgba(255, 107, 203, 0.15); }
.chip:disabled { opacity: 0.3; cursor: not-allowed; }

.btn-row {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 12px;
}

.btn {
  padding: clamp(6px, 0.8vh, 10px) clamp(10px, 1.2vw, 20px);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: clamp(0.7em, 1vw, 0.85em);
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  max-width: 200px;
}

.btn:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-accent {
  background: rgba(255, 107, 203, 0.2);
  color: #ff6bcb;
  border: 1px solid rgba(255, 107, 203, 0.4);
}
.btn-accent:hover:not(:disabled) { background: rgba(255, 107, 203, 0.3); }

.btn-ghost {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.btn-ghost:hover:not(:disabled) { background: rgba(255, 255, 255, 0.12); }

.result-msg {
  text-align: center;
  padding: 8px;
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 600;
  margin-top: 10px;
}
.result-msg.correct { color: #7cff7c; background: rgba(72, 187, 120, 0.1); }
.result-msg.wrong { color: #ff7c7c; background: rgba(245, 101, 101, 0.1); }

.panel-enter-active { transition: all 0.3s ease-out; }
.panel-leave-active { transition: all 0.2s ease-in; }
.panel-enter-from { opacity: 0; transform: translateY(20px); }
.panel-leave-to { opacity: 0; transform: translateY(20px); }
</style>
