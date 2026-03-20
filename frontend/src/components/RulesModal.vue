<template>
  <Transition name="fade">
    <div v-if="visible" class="rules-overlay" @click.self="$emit('close')">
      <div class="rules-card">
        <button class="close-btn" @click="$emit('close')">&times;</button>
        <h2 class="rules-title">Listen Up! 規則書</h2>

        <div class="rules-body">
          <section>
            <h3>目標</h3>
            <p>在你的時間線上收集足夠數量的卡牌即可獲勝。每張卡牌代表一首歌的 <strong>YouTube 上架年份</strong>，必須按照年份順序排列。</p>
          </section>

          <section>
            <h3>遊戲流程</h3>
            <p>每回合按照以下步驟進行：</p>
            <ol>
              <li><strong>聽歌</strong> — 播放一首歌，所有玩家一起聽。</li>
              <li><strong>猜歌</strong> — 由當前玩家決定：有人猜對歌名可獲得 1 個代幣；也可以跳過或宣布無人猜對。</li>
              <li><strong>放置卡牌</strong> — 當前玩家將這首歌的卡牌插入自己的時間線中，需要判斷正確的年份順序。</li>
              <li><strong>挑戰</strong> — 如果其他玩家認為放置錯誤，可以花 1 個代幣發起挑戰。</li>
              <li><strong>結算</strong> — 揭曉結果，進入下一位玩家的回合。</li>
            </ol>
          </section>

          <section>
            <h3>卡牌放置</h3>
            <p>將卡牌插入你的時間線，根據該歌曲的 <strong>YouTube 上架年份</strong>，使所有卡牌從左到右遞增排列。</p>
            <ul>
              <li>放置<strong>正確</strong> — 卡牌留在時間線上。</li>
              <li>放置<strong>錯誤</strong> — 卡牌被丟棄（除非被挑戰者搶走）。</li>
            </ul>
          </section>

          <section>
            <h3>挑戰</h3>
            <p>卡牌放置後，其他玩家可以花 <strong>1 個代幣</strong>發起挑戰：</p>
            <ul>
              <li>原本放置<strong>正確</strong> → 挑戰者失去代幣，卡牌留在原位。</li>
              <li>原本放置<strong>錯誤</strong>，挑戰者猜對正確位置 → 挑戰者搶走卡牌到自己的時間線！</li>
              <li>原本放置<strong>錯誤</strong>，挑戰者也猜錯 → 挑戰者失去代幣，卡牌丟棄。</li>
            </ul>
            <p>不挑戰的話，正確的卡牌直接留下，錯誤的卡牌直接丟棄。</p>
          </section>

          <section>
            <h3>代幣</h3>
            <ul>
              <li>每位玩家開局 <strong>2 個代幣</strong>，最多持有 5 個。</li>
              <li><strong>猜對歌名</strong> → +1 代幣。</li>
              <li><strong>換歌</strong> → -1 代幣（跳過當前歌曲，抽新的一首）。</li>
              <li><strong>發起挑戰</strong> → -1 代幣。</li>
            </ul>
          </section>

          <section>
            <h3>勝利條件</h3>
            <p>當一輪結束時（所有玩家各玩過一次），檢查是否有玩家的卡牌數量達到目標：</p>
            <ul>
              <li><strong>一位玩家</strong>達標 → 該玩家獲勝！</li>
              <li><strong>多位玩家</strong>同時達標且卡牌數相同 → 進入<strong>平手延長賽</strong>，繼續比到分出勝負。</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ visible: boolean }>()
defineEmits<{ close: [] }>()
</script>

<style scoped>
.rules-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  padding: 16px;
}

.rules-card {
  position: relative;
  background: rgba(var(--surface), 0.95);
  border: 1px solid rgba(var(--accent-rgb), 0.15);
  border-radius: 16px;
  padding: clamp(20px, 3vh, 36px) clamp(20px, 3vw, 40px);
  max-width: 520px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 1.6em;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  border-radius: 4px;
  transition: all 0.15s;
}

.close-btn:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
}

.rules-title {
  color: var(--accent);
  font-size: clamp(1.1em, 2vw, 1.4em);
  font-weight: 700;
  text-align: center;
  margin-bottom: 20px;
}

.rules-body {
  color: rgba(255, 255, 255, 0.8);
  font-size: clamp(0.8em, 1.2vw, 0.92em);
  line-height: 1.7;
}

section {
  margin-bottom: 18px;
}

h3 {
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.05em;
  font-weight: 700;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

ol, ul {
  padding-left: 20px;
  margin: 6px 0;
}

li {
  margin-bottom: 4px;
}

strong {
  color: var(--accent);
}

.fade-enter-active { transition: all 0.3s ease-out; }
.fade-leave-active { transition: all 0.2s ease-in; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
