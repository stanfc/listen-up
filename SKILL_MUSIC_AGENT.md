# Skill: 音樂搜尋 Agent

## 目標

你是一個音樂資料搜尋 Agent。你的任務是幫「金曲猜歌王」遊戲填充音樂資料庫。你需要搜尋歌曲的 YouTube 連結、發行年份、歌手、以及其他遊戲需要的資訊。

---

## 你需要產出的資料格式

每首歌必須符合以下 JSON 格式，存入 `backend/data/music.json`：

```json
{
  "id": "music-001",
  "title": "歌曲名稱",
  "artist": "歌手/樂團名",
  "year": 1984,
  "youtubeId": "dQw4w9WgXcQ",
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "previewStart": 30,
  "previewDuration": 30,
  "tags": ["80s", "pop"],
  "difficulty": "easy"
}
```

### 欄位說明

| 欄位 | 說明 |
|---|---|
| `id` | 唯一 ID，格式 `music-XXX`，遞增編號 |
| `title` | 歌曲正式名稱（原文，非翻譯） |
| `artist` | 歌手或樂團名稱 |
| `year` | **首次發行年份**（非 MV 上傳年份、非重製版年份） |
| `youtubeId` | YouTube 影片 ID（`watch?v=` 後面那段） |
| `youtubeUrl` | 完整 YouTube 連結 |
| `previewStart` | 建議播放起始秒數（避開前奏靜音段，選副歌或最有辨識度的段落） |
| `previewDuration` | 播放時長（秒），建議 20-30 秒 |
| `tags` | 標籤陣列，可包含年代、曲風、語言等（見下方標籤規範） |
| `difficulty` | `"easy"` / `"medium"` / `"hard"`，根據歌曲知名度判斷 |

### 標籤規範

**年代標籤**（必選一個）：
- `60s`, `70s`, `80s`, `90s`, `2000s`, `2010s`, `2020s`

**曲風標籤**（至少選一個）：
- `pop`, `rock`, `hip-hop`, `r&b`, `dance`, `electronic`, `country`, `jazz`, `classical`, `metal`, `indie`, `folk`, `funk`, `soul`, `reggae`, `latin`

**語言標籤**（必選一個）：
- `english`, `chinese`, `japanese`, `korean`, `spanish`, `french`, `other`

**其他可選標籤**：
- `one-hit-wonder`, `movie-soundtrack`, `anime`, `game-ost`, `christmas`, `classic-hit`

### 難度判斷標準

- **easy**: 幾乎所有人都聽過，前幾秒就能認出（如 Bohemian Rhapsody、月亮代表我的心）
- **medium**: 比較熟悉流行音樂的人會知道（如 Take On Me、浮誇）
- **hard**: 需要特定年代或特定曲風愛好者才會知道

---

## 搜尋流程

### Step 1: 確認歌曲資訊
1. 搜尋歌曲名稱 + 歌手
2. 確認**首次發行年份**（查 Wikipedia 或可靠音樂資料庫，不要用 YouTube 上傳年份）
3. 確認歌手正式名稱

### Step 2: 找 YouTube 連結
1. 優先選擇**官方 MV**（Official Music Video）
2. 若無官方 MV，選擇**官方音訊**（Official Audio）
3. 若都沒有，選擇觀看次數最高的版本
4. **避免**：Live 版、翻唱版、remix 版、歌詞影片（除非沒有其他選擇）

### Step 3: 決定播放起始點
1. **不要從 0 秒開始**（通常是前奏或靜音）
2. 優先選擇**副歌開頭**或**最有辨識度的旋律段落**
3. 如果副歌太容易猜，可以選第一段主歌
4. 確保選定的段落在 `previewStart` 到 `previewStart + previewDuration` 範圍內音樂是連續的

### Step 4: 分類標籤
1. 根據首次發行年份決定年代標籤
2. 根據曲風分類
3. 根據歌曲語言分類
4. 判斷難度

---

## 批次搜尋模式

當需要批次新增歌曲時，按以下格式接收指令：

```
新增以下歌曲：
1. Never Gonna Give You Up - Rick Astley
2. 月亮代表我的心 - 鄧麗君
3. STAY - The Kid LAROI & Justin Bieber
```

對每首歌執行上述搜尋流程，輸出完整的 JSON 陣列。

---

## 遊戲播放機制（重要！）

### 播放規則
- 遊戲中使用 **YouTube IFrame API** 播放音樂
- 播放時 **只播放音訊，不顯示影片畫面**（iframe 隱藏或設定為 1x1 像素）
- 玩家在 `SONG_GUESS` 和 `CARD_PLACEMENT` 階段**看不到歌名、歌手、影片畫面**
- 進入 `ROUND_END` 階段後才**揭露完整資訊**（歌名、歌手、年份，可選顯示 MV）

### 前端實作提示

```javascript
// 使用 YouTube IFrame API（音訊模式）
// 在 index.html 加入：
// <script src="https://www.youtube.com/iframe_api"></script>

let player;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('yt-player', {
    height: '1',       // 隱藏影片
    width: '1',        // 隱藏影片
    videoId: '',
    playerVars: {
      autoplay: 0,
      controls: 0,     // 不顯示控制列
      disablekb: 1,    // 停用鍵盤
      fs: 0,           // 不允許全螢幕
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

// 播放指定歌曲片段
function playSong(youtubeId, startSeconds, duration) {
  player.loadVideoById({
    videoId: youtubeId,
    startSeconds: startSeconds,
  });

  // 到時間自動停止
  setTimeout(() => {
    player.pauseVideo();
  }, duration * 1000);
}

// 揭露答案時顯示影片
function revealVideo() {
  const iframe = document.getElementById('yt-player');
  iframe.style.width = '560px';
  iframe.style.height = '315px';
}
```

### 後端 API 修改提示

`GET /api/games/:gameId/music` 回傳時：
- **猜測階段**：只回傳 `youtubeId`、`previewStart`、`previewDuration`（不回傳 title、artist、year）
- **揭露階段**：回傳完整資訊

---

## 資料品質檢查清單

新增每首歌時，確認：
- [ ] YouTube 連結有效（影片未被刪除、未被地區限制）
- [ ] 年份是**首次發行年份**，不是 MV 發布年份或精選輯年份
- [ ] `previewStart` 秒數對應到有辨識度的段落
- [ ] 標籤至少包含：1 個年代 + 1 個曲風 + 1 個語言
- [ ] 難度分類合理
- [ ] `youtubeId` 與 `youtubeUrl` 一致
- [ ] 無重複歌曲（檢查現有 music.json）

---

## 範例輸出

```json
[
  {
    "id": "music-001",
    "title": "Never Gonna Give You Up",
    "artist": "Rick Astley",
    "year": 1987,
    "youtubeId": "dQw4w9WgXcQ",
    "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "previewStart": 43,
    "previewDuration": 25,
    "tags": ["80s", "pop", "dance", "english", "classic-hit"],
    "difficulty": "easy"
  },
  {
    "id": "music-002",
    "title": "月亮代表我的心",
    "artist": "鄧麗君",
    "year": 1977,
    "youtubeId": "bv_cEeDlop0",
    "youtubeUrl": "https://www.youtube.com/watch?v=bv_cEeDlop0",
    "previewStart": 18,
    "previewDuration": 25,
    "tags": ["70s", "pop", "chinese", "classic-hit"],
    "difficulty": "easy"
  },
  {
    "id": "music-003",
    "title": "STAY",
    "artist": "The Kid LAROI & Justin Bieber",
    "year": 2021,
    "youtubeId": "kTJczUoc26U",
    "youtubeUrl": "https://www.youtube.com/watch?v=kTJczUoc26U",
    "previewStart": 15,
    "previewDuration": 25,
    "tags": ["2020s", "pop", "english"],
    "difficulty": "easy"
  }
]
```
