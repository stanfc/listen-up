# 🚀 快速启动 - 金曲猜歌王

## ⚡ 30 秒开始游戏

### 第 1 步: 启动后端
```bash
cd backend
npm install
npm run dev
```
**等待看到**: `Server is running on http://localhost:3000`

### 第 2 步: 启动前端 (新终端)
```bash
cd frontend
npm install
npm run dev
```
**等待看到**: `Local: http://localhost:5173/`

### 第 3 步: 打开浏览器
访问 **http://localhost:5173**

**就这样！** 打开即玩，无需任何配置！🎉

---

## 🎮 游戏说明

### 预设玩家
游戏自动创建 **4 个玩家**:
- 玩家1
- 玩家2
- 玩家3
- 玩家4

### 游戏流程
1. **听歌** 🎵 - 音乐自动播放
2. **猜歌名** 🎤 - 当前玩家输入歌曲名称
3. **猜年份** 📅 - 猜对后输入发行年份
4. **放卡牌** 🃏 - 在时间线上放置卡牌
5. **轮流** ⏭️ - 依次轮流，首位达到 5 张卡牌的玩家获胜！

### 玩家指示
- **绿色背景** = 当前玩家轮到了
- 当前玩家可以输入猜测
- 其他玩家等待

### 代币系统
- 每位玩家开始时有 **2 个代币** 💰
- 正确猜歌名 → 获得 **1 个代币**
- 卡牌排序错误 → 失去 **1 个代币**

---

## 🎵 更换音乐

编辑 `backend/data/music.json`，添加你的歌曲：

```json
{
  "id": "music-100",
  "title": "你的歌曲",
  "artist": "艺术家",
  "year": 2024,
  "s3Key": "music/your-song.mp3",
  "previewStart": 30,
  "previewDuration": 15,
  "tags": ["pop", "2020s"],
  "difficulty": "medium"
}
```

然后重启后端。

---

## 🎛️ 自定义设置

编辑 `frontend/src/components/QuickGame.vue` 中的 `initializeGame()` 函数:

```typescript
// 改变玩家数量
const presetPlayers = ['玩家1', '玩家2', '玩家3']  // 改成 3 个玩家

// 改变获胜卡牌数
winningCards: 3,  // 改成 3 张卡牌

// 改变音乐标签
musicTags: ['80s', 'pop'],  // 只选择 80s 和 pop
```

---

## 🐛 常见问题

### Q: 如何修改玩家名称？
编辑 `QuickGame.vue` 中的 `presetPlayers` 数组。

### Q: 如何改变玩家人数？
删除或添加 `presetPlayers` 数组中的名称。

### Q: 如何只玩特定类型的音乐？
修改 `musicTags` 数组，比如只要 `['80s', 'pop']`。

### Q: 如何改变获胜条件？
修改 `winningCards: 5` 的数字。

### Q: 游戏卡住了怎么办？
- 检查浏览器 F12 Console 有没有红色错误
- 检查后端服务是否还在运行
- 刷新页面重试

---

## 📱 在朋友家用

1. 用笔记本电脑启动游戏
2. 把笔记本连接到电视或大屏幕
3. 朋友们围坐在一起
4. 开始游戏！🎮

---

## ✅ 检查清单

- [ ] 后端运行在 localhost:3000
- [ ] 前端运行在 localhost:5173
- [ ] 浏览器打开了网页
- [ ] 看到 4 个玩家卡片
- [ ] 听到音乐自动播放
- [ ] 当前玩家名字有绿色背景
- [ ] 能输入歌曲名称
- [ ] 可以开始游戏了！

---

**现在开始吧！🎵🎮🎉**
