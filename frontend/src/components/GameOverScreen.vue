<template>
  <Transition name="fade">
    <div v-if="visible" class="game-over-overlay">
      <div class="game-over-card">
        <div class="trophy">🏆</div>
        <h2 class="winner-title">{{ winnerName }} 獲勝！</h2>
        <div class="ranking">
          <div
            v-for="(player, idx) in ranking"
            :key="player.id"
            class="rank-row"
          >
            <span class="rank-pos">{{ idx + 1 }}.</span>
            <span class="rank-name">{{ player.name }}</span>
            <span class="rank-cards">{{ player.cards.length }} 張卡牌</span>
          </div>
        </div>
        <button class="btn-restart" @click="$emit('restart')">
          重新開始
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { Player } from '@/types'

defineProps<{
  visible: boolean
  winnerName: string
  ranking: Player[]
}>()

defineEmits<{ restart: [] }>()
</script>

<style scoped>
.game-over-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
}

.game-over-card {
  background: rgba(15, 12, 40, 0.95);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 16px;
  padding: 28px 24px;
  text-align: center;
  box-shadow: 0 0 60px rgba(255, 215, 0, 0.1);
  max-width: 400px;
  width: 90vw;
}

@media (min-width: 640px) {
  .game-over-card {
    border-radius: 20px;
    padding: 40px 48px;
  }
}

.trophy {
  font-size: 3em;
  margin-bottom: 12px;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.winner-title {
  color: #ffd700;
  font-size: 1.4em;
  font-weight: 800;
  margin-bottom: 24px;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

@media (min-width: 640px) {
  .winner-title {
    font-size: 1.8em;
  }
}

.ranking {
  margin-bottom: 28px;
}

.rank-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
}

.rank-row:first-child {
  background: rgba(255, 215, 0, 0.1);
}

.rank-pos {
  color: rgba(255, 255, 255, 0.4);
  font-weight: 700;
  width: 24px;
}

.rank-name {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  flex: 1;
  text-align: left;
}

.rank-cards {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85em;
}

.btn-restart {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #1a0a3e;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1em;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-restart:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 215, 0, 0.3);
}

/* Fade transition */
.fade-enter-active { transition: all 0.4s ease-out; }
.fade-leave-active { transition: all 0.3s ease-in; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
