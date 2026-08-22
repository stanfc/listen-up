# 🚀 快速開始

## 環境需求

- Node.js >= 18（後端用 Express 5 / `@google/genai`，建議使用近期 LTS）
- npm >= 8

## 啟動本機開發環境

```bash
# 第一次：安裝所有依賴（根目錄 + backend + frontend）
npm run install-all

# 啟動後端 (:3000) 與前端 (:5173)
npm run dev
```

也可以分開兩個終端機啟動：

```bash
# 終端 1
cd backend && npm run dev
# 看到 "Server is running on http://localhost:3000" 即成功

# 終端 2
cd frontend && npm run dev
# 看到 "Local: http://localhost:5173/" 即成功
```

開啟 http://localhost:5173，在設定畫面填入玩家人數與名稱後按「開始遊戲」即可開玩；也可以輸入既有房號「加入」繼續一場中斷的遊戲。

## 疑難排解

**後端啟動失敗：`Address already in use :::3000`**
```bash
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
# 或改用其他 port
PORT=3001 npm run dev
```

**前端呼叫 API 失敗 / 404**
- 確認後端有在跑，且監聽 3000 port（`vite.config.ts` 已將 `/api` proxy 到 `http://localhost:3000`）
- 打開瀏覽器 DevTools → Network 看實際的請求與回應

**猜歌名總是判定錯誤**
- 比對系統會忽略大小寫與標點符號，但歌名必須與 `backend/data/music_new.json` 內的 `title` 相符

## 新增/修改歌曲

遊戲實際讀取的歌曲庫是 `backend/data/music_new.json`（不是 `music.json`）。手動新增一筆：

```json
{
  "id": "music-9999",
  "title": "歌曲名稱",
  "artist": "演出者",
  "year": 2024,
  "spotifyId": "",
  "youtubeId": "YouTube 影片 ID",
  "albumArt": "",
  "tags": ["2020s", "華語"],
  "difficulty": "easy"
}
```

改完存檔後重啟後端即可生效。

若要大量新增，用 `song-crawler/yt-playlist-crawler.js` ——這是唯一會寫進 `music_new.json`（遊戲實際讀取的檔案）的工具，其他 `song-crawler/` 腳本（`index.js`／`npm start`、`verify.js`、`verify-year.js`、`youtube-crawler.js`）操作的都是 `music.json`，**不會**影響遊戲內容，只用於維護那份較早期、已用 Spotify 資料驗證過但目前未被後端讀取的子集：

```bash
brew install yt-dlp   # 一次性，這個腳本用 yt-dlp 爬播放清單，不需要 API 金鑰

cd song-crawler
node yt-playlist-crawler.js "https://www.youtube.com/playlist?list=xxxxxxxx"

# 可選參數
node yt-playlist-crawler.js "<URL>" --from 50        # 跳過前 50 首
node yt-playlist-crawler.js "<URL>" --random 20      # 隨機抽 20 首
node yt-playlist-crawler.js "<URL>" --tags 華語,經典  # 額外加標籤
```

會逐首用 `yt-dlp` 查上傳年份，依年代/年份自動產生 tags 與難度，每 10 首自動存檔一次到 `music_new.json`；查不到年份的記在 `music_new_failed.json`，可手動補。`spotifyId`/`albumArt` 這條管線不會填（空字串），不影響遊戲進行，只有回合結束揭曉畫面的專輯封面會空白。

## 資料存放位置

- 本機開發：遊戲狀態存在 `backend/data/games.json`（首次啟動自動建立）
- 正式環境（Fly.io）：`games.json` 改存在掛載的 volume `/data`，重新部署不會遺失

```bash
cat backend/data/games.json | jq '.'   # 查看目前所有遊戲
rm backend/data/games.json             # 清空（下次啟動自動重建空檔）
```

## 建置與部署

```bash
npm run build   # 分別建置 backend (tsc) 與 frontend (vite build)
```

部署走 GitHub Actions：push 到 `main` 會自動觸發 `flyctl deploy --remote-only`（見 `.github/workflows/fly-deploy.yml`）。手動部署：

```bash
flyctl deploy --remote-only
```

## 更多資訊

完整的專案介紹、遊戲規則、API 文件、架構說明請見 [README.md](./README.md)。
