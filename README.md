# 🎵 金曲猜歌王

一個基於 Hitster 桌遊規則的本地多人音樂猜歌遊戲，採用 Vue.js + Express.js 架構。

## 專案特性

- ✅ **多人遊戲**: 支援 2-8 人同時遊戲
- ✅ **音樂猜測**: 猜歌名、猜年份，獲取音樂卡牌
- ✅ **卡牌排序**: 按時間順序排列卡牌，達到目標數量即獲勝
- ✅ **代幣系統**: 透過代幣獲得遊戲優勢（延長播放、年份提示）
- ✅ **標籤過濾**: 按不同風格/年代過濾音樂
- ✅ **類型安全**: 使用 TypeScript 確保程式碼品質
- ✅ **響應式設計**: 優美的使用者介面，支援各種螢幕

## 專案結構

```
猜歌王/
├── frontend/                 # Vue.js 前端
│   ├── src/
│   │   ├── components/      # Vue 元件
│   │   │   ├── GameSetup.vue
│   │   │   └── GameBoard.vue
│   │   ├── stores/          # Pinia 狀態管理
│   │   │   └── gameStore.ts
│   │   ├── api/             # API 客戶端
│   │   │   └── client.ts
│   │   ├── types/           # TypeScript 類型定義
│   │   │   └── index.ts
│   │   ├── App.vue
│   │   └── main.ts
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                 # Express.js 後端
│   ├── src/
│   │   ├── types.ts         # 類型定義
│   │   ├── database.ts      # 資料持久化
│   │   ├── validation.ts    # 資料驗證
│   │   ├── gameLogic.ts     # 遊戲邏輯
│   │   ├── api.ts           # API 路由
│   │   └── server.ts        # 伺服器入口
│   ├── data/
│   │   ├── music.json       # 音樂資料庫
│   │   └── games.json       # 遊戲狀態（自動產生）
│   ├── package.json
│   └── tsconfig.json
│
└── .kiro/                   # 需求規格文件
    └── specs/
        └── music-guessing-game/
            ├── requirements.md
            ├── design.md
            └── tasks.md
```

## 快速開始

### 環境要求
- Node.js >= 16
- npm >= 8

### 步驟 1: 安裝後端依賴

```bash
cd backend
npm install
```

### 步驟 2: 啟動後端服務

```bash
npm run dev
```

伺服器將在 `http://localhost:3000` 執行

輸出範例：
```
Server is running on http://localhost:3000
Health check: http://localhost:3000/api/health
```

### 步驟 3: 在另一個終端安裝前端依賴

```bash
cd frontend
npm install
```

### 步驟 4: 啟動前端開發伺服器

```bash
npm run dev
```

前端將在 `http://localhost:5173` 執行

### 步驟 5: 開啟瀏覽器

造訪 `http://localhost:5173` 開始遊戲！

## 遊戲規則

> **注意**: 本遊戲中卡牌上的年份為該歌曲的 **YouTube 上架年份**，而非原始發行年份。

### 遊戲設定

1. **建立房間**: 設定玩家數量（2-8 人）、獲勝所需卡牌數、音樂標籤（年代/風格）
2. **輸入玩家名稱**: 每位玩家輸入自己的名稱
3. **開始遊戲**: 系統隨機決定玩家順序，每位玩家獲得 1 張起始卡牌與 2 個代幣

### 每回合流程

每位玩家的回合依序經歷以下四個階段：

#### 1. 猜歌階段
- 系統播放一首歌曲（僅播放音訊），所有玩家一起聽
- 主持玩家可以選擇：
  - **「顯示影片」** — 顯示 YouTube 影片揭曉答案
  - **「[玩家名] 猜對」** — 某位玩家猜對歌名，該玩家獲得 +1 代幣
  - **「無人猜對」** — 沒有人猜對，不獎勵代幣
  - **「換歌」** — 花費 1 代幣換一首新歌

#### 2. 放置卡牌階段
- 該首歌曲成為一張新卡牌，當前玩家需將卡牌插入自己的時間線中
- 時間線上的卡牌必須按照 **YouTube 上架年份** 由早到晚排列
- 玩家選擇一個位置插入卡牌（此時不會立即揭曉對錯）

#### 3. 挑戰階段
- 其他玩家可以花費 **1 個代幣**挑戰該放置：
  - 若放置**正確**，挑戰者失去 1 代幣，卡牌留在原位
  - 若放置**錯誤**且挑戰者指出正確位置，挑戰者**搶走該卡牌**加入自己的時間線
  - 若放置**錯誤**但挑戰者也指錯位置，雙方都失敗，卡牌丟棄且挑戰者失去代幣
- 若無人挑戰：放置正確則卡牌加入時間線，放置錯誤則卡牌丟棄

#### 4. 回合結束
- 揭曉答案（歌名、演唱者、YouTube 上架年份）
- 進入下一位玩家的回合

### 勝利條件

- 當所有玩家都完成一輪後，系統檢查是否有人達到設定的卡牌數量
- 若有**唯一一位**玩家擁有最多卡牌且達標 → 該玩家**獲勝**
- 若多位玩家同時達標且卡牌數相同 → 進入**平手延長賽**，繼續遊戲直到分出勝負

### 代幣系統

- **初始代幣**: 每位玩家開始時獲得 2 個代幣（上限 5 個）
- **獲得代幣**: 猜對歌名獲得 +1 代幣
- **花費代幣**: 挑戰其他玩家的放置（1 代幣）、換歌（1 代幣）

## API 端點

### 遊戲管理

```
POST /api/games                      # 建立遊戲房間
GET  /api/games/:gameId              # 取得遊戲狀態
POST /api/games/:gameId/players      # 新增玩家
POST /api/games/:gameId/start        # 開始遊戲
POST /api/games/:gameId/next-round   # 開始下一輪
```

### 遊戲操作

```
GET  /api/games/:gameId/music        # 取得當前音樂
POST /api/games/:gameId/guess        # 提交歌名或年份猜測
POST /api/games/:gameId/card-placement  # 提交卡牌排序
```

### 資料查詢

```
GET  /api/music/tags                 # 取得所有音樂標籤
GET  /api/health                     # 健康檢查
```

## 核心功能實作

### 後端特性

✅ **遊戲房間管理** - 建立房間、管理玩家、追蹤遊戲狀態
✅ **音樂資料庫** - 本地 JSON 儲存，支援標籤過濾
✅ **遊戲邏輯** - 猜測驗證、年份判定、卡牌排序、代幣系統
✅ **資料驗證** - 輸入驗證、錯誤處理、例外管理
✅ **本地持久化** - 使用 JSON 檔案模擬資料庫

### 前端特性

✅ **元件化架構** - 使用 Vue 3 Composition API
✅ **狀態管理** - Pinia store 管理全域遊戲狀態
✅ **API 整合** - Axios 與後端通訊
✅ **響應式 UI** - 美觀的遊戲介面
✅ **錯誤處理** - 使用者友善的錯誤提示

## 資料模型

### 遊戲物件

```typescript
Game {
  id: string                    # 遊戲 ID
  roomCode: string             # 房間代碼
  status: 'waiting'|'playing'|'finished'
  config: GameConfig           # 遊戲設定
  players: Player[]            # 玩家列表
  currentRound: GameRound      # 當前輪次
  createdAt: string           # 建立時間
  updatedAt: string           # 更新時間
  finishedAt?: string         # 結束時間
  winner?: string             # 獲勝者 ID
}
```

### 音樂物件

```typescript
Music {
  id: string
  title: string               # 歌曲名稱
  artist: string              # 藝術家
  year: number               # 發行年份
  s3Key: string              # 音樂檔案路徑
  previewStart: number       # 預覽開始時間（秒）
  previewDuration: number    # 預覽時長（秒）
  tags: string[]             # 標籤（風格、年代等）
  difficulty: 'easy'|'medium'|'hard'
}
```

## 測試遊戲

### 測試情境

1. **基本流程**: 建立 2 人遊戲，完成一個完整回合
2. **多人遊戲**: 4 人遊戲，測試玩家輪轉
3. **錯誤處理**: 輸入無效資料，測試驗證功能
4. **邊界情況**: 玩家數量限制、卡牌排序驗證

### 除錯提示

- 使用瀏覽器開發者工具的 Network 標籤查看 API 請求
- 在後端 `data/games.json` 中查看遊戲狀態
- 後端主控台顯示詳細的操作日誌

## 下一步開發

### 計畫中的功能

- [ ] 音樂庫管理介面
- [ ] 遊戲暫停/恢復
- [ ] 玩家離線重連
- [ ] 遊戲重播記錄
- [ ] 排行榜和統計
- [ ] 多語言支援
- [ ] 音訊視覺化
- [ ] AWS 部署整合

### 效能最佳化

- 實作音樂檔案快取
- 最佳化元件渲染效能
- 新增虛擬捲動（如果卡牌很多）
- CDN 加速音樂檔案

### 安全性改善

- 新增房間密碼保護
- 實作玩家認證
- API 限流和防濫用
- 資料加密儲存

## 開發記錄

### 已完成（第 1-3 階段）

✅ Vue 3 + TypeScript 專案設定
✅ Express.js 後端框架
✅ 資料模型和類型定義
✅ 遊戲邏輯核心實作
✅ RESTful API 端點
✅ Pinia 狀態管理
✅ 前端主介面元件

### 待完成（第 4-7 階段）

- [ ] 代幣系統完整實作
- [ ] 卡牌拖曳排序 UI
- [ ] 完整的錯誤處理
- [ ] 單元測試和端對端測試
- [ ] 效能最佳化和除錯
- [ ] 文件完善

## 授權條款

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request！

---

**享受遊戲！🎉🎵**
