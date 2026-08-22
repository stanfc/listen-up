<template>
  <div class="game-setup">
    <CosmicBackground />
    <div class="setup-container">
      <div class="logo-area">
        <img src="/logo_without_bg.png" alt="Listen Up!" class="setup-logo-img" />
        <h1 class="setup-logo">Listen Up!</h1>
        <p class="setup-subtitle">音樂時間線遊戲</p>
      </div>

      <div class="form-group">
        <label>玩家人數</label>
        <select v-model.number="playerCount">
          <option v-for="n in 19" :key="n + 1" :value="n + 1">{{ n + 1 }} 位玩家</option>
        </select>
      </div>

      <div class="form-group">
        <label>勝利所需卡牌數</label>
        <select v-model.number="winningCards">
          <option v-for="n in 19" :key="n + 1" :value="n + 1">{{ n + 1 }} 張卡牌</option>
          <option :value="999">無限</option>
        </select>
      </div>

      <div class="form-group">
        <label>玩家名稱</label>
        <div class="player-names">
          <input
            v-for="(_, idx) in playerNames"
            :key="idx"
            v-model="playerNames[idx]"
            class="name-input"
            :placeholder="`玩家 ${idx + 1}`"
          />
        </div>
      </div>

      <div class="form-group">
        <label>擴充規則</label>
        <div class="expansion-row">
          <button
            :class="['switch', { on: tokenPointsEnabled }]"
            @click="tokenPointsEnabled = !tokenPointsEnabled"
          >
            <span class="switch-knob"></span>
          </button>
          <span class="expansion-text" :class="{ dimmed: !tokenPointsEnabled }">
            代幣換分：每
            <select
              v-model.number="tokenPointsK"
              :disabled="!tokenPointsEnabled"
              class="inline-select"
            >
              <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
            </select>
            個代幣 = 1 分
          </span>
        </div>
      </div>

      <div class="form-group">
        <label>年份傾向 <span class="label-hint">{{ yearSkewLabel }}</span></label>
        <input
          type="range"
          v-model.number="yearSkew"
          min="-1"
          max="1"
          step="0.1"
          class="skew-slider"
        />
        <div class="skew-scale">
          <span>😌 懷舊</span>
          <span>⚖️ 均衡</span>
          <span>🔥 年輕</span>
        </div>
      </div>

      <div class="form-group">
        <label>音樂標籤 <span class="label-hint">（不選 = 全選）</span></label>
        <div class="tags-container">
          <button
            v-for="tag in availableTags"
            :key="tag"
            :class="['tag-btn', { active: selectedTags.includes(tag) }]"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <button
        @click="startGame"
        :disabled="isLoading"
        class="btn-start"
      >
        {{ isLoading ? '啟動中...' : '開始遊戲' }}
      </button>

      <div class="divider">
        <span>或</span>
      </div>

      <div class="rejoin-section">
        <label>輸入房號繼續遊戲</label>
        <div class="rejoin-row">
          <input
            v-model="rejoinCode"
            class="name-input rejoin-input"
            placeholder="例：A1B2"
            maxlength="4"
            @keyup.enter="rejoinGame"
          />
          <button
            @click="rejoinGame"
            :disabled="isLoading || !rejoinCode.trim()"
            class="btn-rejoin"
          >
            加入
          </button>
        </div>
      </div>

      <p v-if="error" class="error-message">{{ error }}</p>

      <button class="btn-rules" @click="showRules = true">規則書</button>
    </div>

    <RulesModal :visible="showRules" @close="showRules = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { apiService } from '@/api/client'
import CosmicBackground from './CosmicBackground.vue'
import RulesModal from './RulesModal.vue'

const gameStore = useGameStore()
const emit = defineEmits(['game-started'])

// Load saved settings
const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem('gameSetup') || '{}')
  } catch { return {} }
})()

const playerCount = ref(saved.playerCount || 4)
const playerNames = ref<string[]>(saved.playerNames || Array.from({ length: playerCount.value }, (_, i) => `玩家 ${i + 1}`))
const winningCards = ref(saved.winningCards || 5)

watch(playerCount, (count) => {
  while (playerNames.value.length < count) {
    playerNames.value.push(`玩家 ${playerNames.value.length + 1}`)
  }
  while (playerNames.value.length > count) {
    playerNames.value.pop()
  }
})
const selectedTags = ref<string[]>(saved.selectedTags || [])
const availableTags = ref<string[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const rejoinCode = ref('')
const showRules = ref(false)
const tokenPointsEnabled = ref(saved.tokenPointsEnabled || false)
const tokenPointsK = ref(saved.tokenPointsK || 3)
const yearSkew = ref(saved.yearSkew ?? 0)

const yearSkewLabel = computed(() => {
  const v = yearSkew.value
  if (v === 0) return '（均衡：每個年份機率一樣）'
  const side = v > 0 ? '較新' : '較舊'
  const ratio = (1 + Math.abs(v)).toFixed(1)
  return `（最${side}的年份機率是最${v > 0 ? '舊' : '新'}的 ${ratio} 倍）`
})

function saveSettings() {
  localStorage.setItem('gameSetup', JSON.stringify({
    playerCount: playerCount.value,
    playerNames: playerNames.value,
    winningCards: winningCards.value,
    selectedTags: selectedTags.value,
    tokenPointsEnabled: tokenPointsEnabled.value,
    tokenPointsK: tokenPointsK.value,
    yearSkew: yearSkew.value,
  }))
}

onMounted(async () => {
  try {
    const tagsResponse = await apiService.getMusicTags()
    availableTags.value = tagsResponse.tags || defaultTags()
  } catch {
    availableTags.value = defaultTags()
  }
})

function defaultTags() {
  return []
}

function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx > -1) {
    selectedTags.value.splice(idx, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

async function rejoinGame() {
  if (!rejoinCode.value.trim()) return
  isLoading.value = true
  error.value = null
  try {
    await gameStore.rejoinByRoomCode(rejoinCode.value.trim())
  } catch (err: any) {
    error.value = err?.response?.data?.message || '找不到此房間'
  } finally {
    isLoading.value = false
  }
}

async function startGame() {
  isLoading.value = true
  error.value = null
  saveSettings()
  try {
    const config = {
      maxPlayers: playerCount.value,
      minPlayers: 2,
      winningCards: winningCards.value,
      musicTags: selectedTags.value,
      maxRounds: 100,
      tokenPointsK: tokenPointsEnabled.value ? tokenPointsK.value : 0,
      yearSkew: yearSkew.value
    }

    await gameStore.createGame(config)

    for (let i = 0; i < playerCount.value; i++) {
      const name = playerNames.value[i]?.trim() || `玩家 ${i + 1}`
      await gameStore.addPlayer(name)
    }

    await gameStore.startGame()
    await gameStore.loadCurrentMusic()
    emit('game-started')
  } catch (err: any) {
    error.value = err.message || '遊戲啟動失敗'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.game-setup {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.setup-container {
  position: relative;
  z-index: 1;
  background: rgba(var(--surface), 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px 20px;
  max-width: 460px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

@media (min-width: 640px) {
  .setup-container {
    padding: 40px;
  }
}

.logo-area {
  text-align: center;
  margin-bottom: 24px;
}

.setup-logo-img {
  width: 80px;
  height: 80px;
  margin-bottom: 8px;
  image-rendering: pixelated;
}

.setup-logo {
  font-family: 'Segoe Script', 'Brush Script MT', cursive;
  font-style: italic;
  color: rgba(255, 255, 255, 0.9);
  font-size: 2em;
  margin-bottom: 4px;
}

.setup-subtitle {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85em;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.form-group {
  margin-bottom: 18px;
}

label {
  display: block;
  margin-bottom: 6px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.82em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.label-hint {
  text-transform: none;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.3);
}

select {
  width: 100%;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  font-size: 0.95em;
  color: rgba(255, 255, 255, 0.9);
  box-sizing: border-box;
  transition: border-color 0.2s;
  appearance: auto;
}

select:focus {
  outline: none;
  border-color: rgba(var(--accent-rgb), 0.4);
}

select option {
  background: #1a1a3e;
  color: white;
}

.player-names {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.name-input {
  width: 100%;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.9);
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.name-input:focus {
  outline: none;
  border-color: rgba(var(--accent-rgb), 0.4);
}

.name-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.skew-slider {
  width: 100%;
  accent-color: var(--accent);
  cursor: pointer;
}

.skew-scale {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.75em;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-btn {
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.82em;
  font-weight: 500;
}

.tag-btn:hover {
  border-color: rgba(var(--accent-rgb), 0.3);
  color: rgba(255, 255, 255, 0.8);
}

.tag-btn.active {
  background: rgba(var(--accent-rgb), 0.15);
  color: var(--accent);
  border-color: rgba(var(--accent-rgb), 0.4);
}

.btn-start {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1em;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.2s;
}

.btn-start:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.btn-start:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  gap: 12px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.divider span {
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.82em;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.rejoin-section {
  margin-bottom: 10px;
}

.rejoin-row {
  display: flex;
  gap: 8px;
}

.rejoin-input {
  flex: 1;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
  font-weight: 700;
}

.btn-rejoin {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9em;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-rejoin:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(var(--accent-rgb), 0.3);
}

.btn-rejoin:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.expansion-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch {
  position: relative;
  width: 38px;
  height: 20px;
  border-radius: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
  padding: 0;
}

.switch.on {
  background: rgba(var(--accent-rgb, 0, 255, 255), 0.5);
}

.switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s;
}

.switch.on .switch-knob {
  transform: translateX(18px);
}

.expansion-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85em;
  display: flex;
  align-items: center;
  gap: 4px;
}

.expansion-text.dimmed {
  opacity: 0.4;
}

.inline-select {
  width: 44px;
  padding: 2px 4px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
}

.inline-select:disabled {
  opacity: 0.3;
}

.btn-rules {
  width: 100%;
  padding: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-size: 0.85em;
  cursor: pointer;
  margin-top: 12px;
  transition: all 0.2s;
}

.btn-rules:hover {
  color: rgba(255, 255, 255, 0.7);
  border-color: rgba(var(--accent-rgb), 0.2);
}

.error-message {
  color: #ff7c7c;
  text-align: center;
  margin-top: 12px;
  padding: 10px;
  background: rgba(245, 101, 101, 0.1);
  border-radius: 8px;
  font-size: 0.9em;
}
</style>
