# 🎵 Listen Up!（金曲猜歌王）

一個基於 [Hitster](https://hitstergame.com/) 桌遊規則的多人音樂猜歌遊戲。玩家聽歌猜歌名，並依發行年份把卡牌插入自己的時間線，率先插滿指定張數者獲勝。前端 Vue 3 + TypeScript，後端 Express + TypeScript，透過 Fly.io 部署為單一服務。

## 專案特性

- **本地同樂**：一台裝置、一個畫面，2-20 人輪流操作即可開玩，不需要每人各自登入
- **房號續玩**：每場遊戲有 4 碼房號，中斷後可用房號重新載入遊戲狀態
- **猜歌 → 放卡 → 挑戰**：符合 Hitster 規則的三段式回合（見下方〈遊戲規則〉）
- **挑戰機制**：其他玩家可花代幣挑戰當前玩家的卡牌放置位置，猜對可直接搶卡
- **代幣系統**：猜對歌名、換歌、挑戰都會消耗或獲得代幣；可選擇開啟「代幣換分」擴充規則
- **平手延長賽（deuce）**：多人同時達標時自動進入延長賽直到分出勝負
- **標籤過濾**：依年代、語言等標籤篩選歌單
- **龐大歌曲庫**：`backend/data/music_new.json` 收錄 3645 首華語歌曲（涵蓋 1940-2026），透過 `song-crawler/` 工具鏈自動蒐集與驗證

## 專案結構

```
listen-up/
├── frontend/                      # Vue 3 + TypeScript + Vite
│   └── src/
│       ├── components/
│       │   ├── GameSetup.vue      # 進場畫面：設定人數/勝利條件/擴充規則/標籤、房號續玩
│       │   ├── QuickGame.vue      # 主遊戲畫面（猜歌、放卡、挑戰、回合結束）
│       │   ├── SongGuessPanel.vue / CardPlacementPanel.vue / ChallengePanel.vue / RoundEndPanel.vue
│       │   ├── PlayerSeat.vue / TableLayout.vue / TimelineCard.vue / CenterDeck.vue / VideoWindow.vue
│       │   └── GameHeader.vue / GameOverScreen.vue / RulesModal.vue / CosmicBackground.vue
│       │   （GameBoard.vue、HelloWorld.vue 為舊版遺留元件，App.vue 未使用）
│       ├── stores/gameStore.ts    # Pinia 全域狀態
│       ├── api/client.ts          # Axios API 客戶端
│       └── types/index.ts
│
├── backend/                       # Express 5 + TypeScript
│   └── src/
│       ├── types.ts               # Game / Player / Music / GamePhase 等型別
│       ├── database.ts            # JSON 檔案持久化（游戲存 /data 或本地，音樂讀 music_new.json）
│       ├── validation.ts
│       ├── gameLogic.ts           # 核心規則：猜歌、放卡、挑戰、換歌、勝負判定
│       ├── api.ts                 # Express 路由
│       ├── spotify.ts             # Spotify API 輔助（供 song-crawler 共用邏輯參考）
│       └── server.ts              # 入口，同時 serve 前端靜態檔（SPA fallback）
│   └── data/
│       ├── music_new.json         # 目前遊戲實際讀取的歌曲庫（3645 首，來自 YouTube 播放清單爬蟲）
│       ├── music.json             # 較早期、已用 Spotify 資料驗證過的子集（352 首），目前未被後端讀取
│       ├── music_new_failed.json  # 爬蟲/驗證失敗的項目，供人工複查
│       └── games.json             # 遊戲狀態（自動產生，本機開發用；正式環境掛載在 Fly volume `/data`）
│
├── song-crawler/
│   ├── yt-playlist-crawler.js      # 主要工具：給一個 YouTube 播放清單網址，爬歌並寫入 music_new.json（遊戲實際讀取的檔案）
│   ├── check-music.js              # 檢視 music_new.json 資料
│   ├── youtube-crawler.js / verify.js / verify-year.js / restore-youtube-ids.js
│   │                               # 操作的是 music.json（未被後端讀取的舊子集），僅供維護該份參考資料用
│   └── spotify.js / llm.js / playlist.js / config.js
│
├── generate_100_songs.js / add_chinese_songs.js / songs_data_verified.json
│                                   # 早期一次性資料產生腳本，已被 song-crawler/ 取代，僅供參考
│
├── .kiro/specs/music-guessing-game/   # 最初的需求規格文件（requirements/design/tasks）
├── Dockerfile                     # 三階段建置：前端 → 後端 → 產出 image
├── fly.toml                       # Fly.io 部署設定
└── .github/workflows/fly-deploy.yml   # push 到 main 自動部署到 Fly.io
```

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端框架 | Vue 3（Composition API）+ TypeScript + Vite |
| 狀態管理 | Pinia |
| HTTP 客戶端 | Axios |
| 後端框架 | Express 5 + TypeScript（`ts-node` 開發、`tsc` 編譯） |
| 資料儲存 | JSON 檔案（`games.json` / `music_new.json`），正式環境掛載 Fly volume |
| 資料產生/驗證 | Node.js 腳本 + Google Gemini（`@google/genai`）+ Spotify Web API |
| 部署 | Docker（多階段建置）＋ Fly.io，GitHub Actions 自動部署 |

## 快速開始

```bash
npm run install-all   # 安裝根目錄 + backend + frontend 依賴
npm run dev            # 同時啟動後端 (:3000) 與前端 (:5173)
```

開啟 http://localhost:5173 即可開玩。詳細步驟、疑難排解、如何新增歌曲請見 [QUICK_START.md](./QUICK_START.md)。

## 遊戲規則

> 卡牌上的年份為歌曲的**上架/發行年份**（依 `music_new.json` 中的 `year` 欄位，多數取自 YouTube 上架資訊）。

### 開局設定（GameSetup 畫面）

1. 設定玩家人數（2-20 人）與勝利所需卡牌數（2-20 張，或「無限」）
2. 輸入每位玩家名稱
3. 可選擇開啟「代幣換分」擴充規則：每 N 個代幣折算 1 分（N 可調整）
4. 選擇音樂標籤過濾歌單（不選 = 全部）
5. 也可以直接輸入房號「加入」既有的進行中遊戲

### 每回合流程

每位玩家的回合依序經歷以下階段：

1. **SONG_GUESS（猜歌）** — 播放歌曲，當前玩家可選擇：
   - 輸入歌名嘗試搶答：猜對 → +1 代幣，可繼續放卡；猜錯 → 無懲罰，直接進入放卡
   - 「跳過」→ 直接進入放卡，不嘗試猜歌名
   - 花 1 代幣「換歌」→ 放棄本首歌，重抽一首
2. **CARD_PLACEMENT（放卡）** — 將這首歌的卡牌插入自己時間線上的任一位置；此時系統**不會**立即告知對錯
3. **CHALLENGE（挑戰）** — 其他玩家可花 1 代幣挑戰這次放置，並指出他們認為正確的位置：
   - 若原放置**正確**且被挑戰 → 挑戰者失去代幣，卡牌照舊留在當前玩家時間線上
   - 若原放置**錯誤**且挑戰者猜對位置 → 挑戰者**搶走卡牌**，插入自己的時間線
   - 若原放置**錯誤**且挑戰者也猜錯 → 卡牌丟棄，挑戰者也失去代幣
   - 若無人挑戰 → 放對則卡牌留下，放錯則卡牌直接丟棄
4. **ROUND_END（回合結束）** — 揭曉答案（歌名、演唱者、年份、專輯封面），進入下一位玩家回合

### 代幣系統

- 初始代幣：每位玩家開局獲得 2 個（未開啟「代幣換分」時上限 5 個，開啟後上限提高）
- 獲得代幣：猜對歌名 +1
- 花費代幣：換歌 -1、挑戰他人放置 -1
- 開啟「代幣換分」擴充規則時，代幣也會折算進總分，一併納入勝負判定

### 勝利條件

- 每輪所有玩家都完成一輪後檢查是否有人達到設定的卡牌數（或换算後的分數）
- 唯一領先且達標者獲勝
- 多人同時達標且同分 → 進入 **deuce（延長賽）**，繼續遊戲直到某輪結束後只剩單一領先者

## API 端點

```
POST   /api/games                         建立遊戲房間
GET    /api/games/room/:roomCode          依房號查詢遊戲（續玩用）
GET    /api/games/:gameId                 取得遊戲狀態
POST   /api/games/:gameId/players         新增玩家
POST   /api/games/:gameId/start           開始遊戲
GET    /api/games/:gameId/music           取得當前歌曲（只回傳 youtubeId/spotifyId，不含答案）
GET    /api/games/:gameId/music/reveal    揭曉當前歌曲完整資訊（title/artist/year/albumArt）
POST   /api/games/:gameId/guess           提交歌名猜測
POST   /api/games/:gameId/skip-song-guess 跳過猜歌，直接進入放卡
POST   /api/games/:gameId/card-placement  提交卡牌放置位置
POST   /api/games/:gameId/challenge       挑戰當前放置
POST   /api/games/:gameId/skip-challenge  無人挑戰，揭曉放置結果
POST   /api/games/:gameId/change-song     花 1 代幣換歌
POST   /api/games/:gameId/next-round      進入下一輪
GET    /api/music/tags                    取得所有音樂標籤
GET    /api/health                        健康檢查
```

## 資料模型（節錄，詳見 `backend/src/types.ts`）

```typescript
Music {
  id: string
  title: string
  artist: string
  year: number
  spotifyId: string
  youtubeId: string
  albumArt: string
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
}

GameRound {
  roundNumber: number
  currentPlayer: string
  musicId: string
  phase: 'song_guess' | 'card_placement' | 'challenge' | 'round_end'
  usedMusicIds: string[]
  pendingCard?: Card          // SONG_GUESS 之後、CARD_PLACEMENT 前的暫存卡牌
  challengeCard?: Card        // CARD_PLACEMENT 之後、等待挑戰揭曉的卡牌
  placementWrong?: boolean    // 後端預先算好，前端不會提前看到
  startingPlayerId: string
  turnIndex: number
}
```

## 部署

- **Fly.io**：`fly.toml` 定義 app `listen-up-purple-pond-1943`（東京 nrt），256MB VM，掛載持久化 volume `/data` 存放 `games.json`，閒置自動關機、有請求自動開機
- **Docker**：三階段建置（見 `Dockerfile`）— 分別建 frontend dist 與 backend dist，最終 image 只含後端編譯產物、`public/`（前端靜態檔）與音樂資料，`CMD node dist/server.js`；後端同時 serve `/api/*` 與前端 SPA
- **CI/CD**：`.github/workflows/fly-deploy.yml` — push 到 `main` 即自動 `flyctl deploy --remote-only`

## 已知落差 / 後續可做

- 目前沒有自動化測試（單元測試、整合測試皆缺）；`backend/test-all.mjs` 與 `backend/src/test-*.ts` 是手動跑的探索性腳本，不是測試套件
- `music_new.json` 中有相當比例的歌曲 `spotifyId` 為空字串（`music_new_failed.json` 記錄了驗證失敗的項目），可用 `song-crawler/verify.js`、`verify-year.js` 持續校正歌名/藝人/年份
- `frontend/src/components/GameBoard.vue`、`HelloWorld.vue` 是舊版流程留下的未使用元件，可考慮清理
- 根目錄的 `generate_100_songs.js`、`add_chinese_songs.js`、`songs_data_verified.json` 是 `song-crawler/` 出現前的一次性腳本，功能已被取代

## 授權

MIT License
