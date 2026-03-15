# 🚀 快速启动指南

## 一行命令启动（推荐）

```bash
# 在项目根目录打开两个终端窗口
# 终端 1：启动后端
cd backend && npm install && npm run dev

# 终端 2：启动前端
cd frontend && npm install && npm run dev
```

## 分步启动

### 步骤 1: 启动后端服务器

```bash
cd backend

# 首次运行：安装依赖
npm install

# 启动服务器
npm run dev
```

**预期输出:**
```
Server is running on http://localhost:3000
Health check: http://localhost:3000/api/health
```

如果出现错误，请确保：
- Node.js 版本 >= 16
- 端口 3000 未被占用
- 没有缺失的 npm 包

### 步骤 2: 启动前端开发服务器

```bash
cd frontend

# 首次运行：安装依赖
npm install

# 启动开发服务器
npm run dev
```

**预期输出:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 步骤 3: 打开浏览器

访问 **http://localhost:5173**，开始游戏！

## 🎮 开始你的第一局游戏

1. **创建游戏房间**
   - 点击"创建游戏"
   - 选择玩家数量（建议 2-4 人）
   - 选择获胜卡牌数（建议 5 张）
   - 选择音乐标签（可多选，建议至少选 2 个）
   - 点击"创建游戏"

2. **添加玩家**
   - 看到房间号（例如：ABCD）后，输入玩家名称
   - 点击"添加玩家"
   - 重复上一步，直到所有玩家加入

3. **开始游戏**
   - 当玩家数量 >= 2 时，点击"开始游戏"
   - 系统会自动显示第一首歌曲

4. **玩游戏**
   - 听音乐片段
   - 猜歌曲名称
   - 如果正确，猜发行年份
   - 如果正确，将卡牌放在时间线的正确位置
   - 首位达到设定卡牌数量的玩家获胜！

## 🐛 故障排除

### 问题：后端无法启动

**错误**: `Address already in use :::3000`
- **原因**: 端口 3000 已被占用
- **解决**:
  - 杀死占用端口的进程：`lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9`
  - 或改用其他端口：`PORT=3001 npm run dev`

**错误**: `Cannot find module 'express'`
- **原因**: 缺失 npm 依赖
- **解决**: 运行 `npm install`

### 问题：前端无法连接后端

**错误**: `POST http://localhost:3000/api/games 404`
- **原因**: 后端服务未运行或不在 3000 端口
- **解决**:
  - 检查后端是否正在运行
  - 检查后端使用的端口是否与前端代理配置一致
  - 查看浏览器开发者工具的 Network 标签

**错误**: `Failed to load music`
- **原因**: 音乐 URL 不正确
- **解决**: 这是测试版本，音乐文件需要手动添加（见下文）

### 问题：游戏无法运行

**错误**: 创建游戏后页面不动
- **原因**: API 请求超时或错误
- **解决**:
  - 打开浏览器 DevTools（F12）
  - 查看 Console 标签找错误信息
  - 查看 Network 标签检查 API 请求
  - 查看后端控制台找错误日志

**错误**: 猜测总是失败
- **原因**: 歌曲名称拼写错误或大小写不匹配
- **解决**:
  - 查看 `backend/data/music.json` 了解确切的歌曲名称
  - 系统会自动忽略大小写和特殊字符

## 📚 API 测试

### 测试健康检查

```bash
curl http://localhost:3000/api/health
# 返回: {"status":"ok"}
```

### 测试创建游戏

```bash
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "maxPlayers": 4,
    "winningCards": 5,
    "musicTags": ["80s", "pop"]
  }'

# 返回: {"gameId":"game-xxx","roomCode":"ABCD"}
```

### 测试获取音乐标签

```bash
curl http://localhost:3000/api/music/tags
# 返回: {"tags":["60s","70s","80s","2000s","2010s","pop","rock","dance","hip-hop"]}
```

## 💾 数据持久化

### 查看游戏数据

```bash
# 查看当前所有游戏
cat backend/data/games.json | jq '.'

# 查看特定游戏
cat backend/data/games.json | jq '.["game-xxx"]'
```

### 查看音乐数据库

```bash
# 列出所有音乐
cat backend/data/music.json | jq '.[]'

# 查看特定音乐
cat backend/data/music.json | jq '.[] | select(.id == "music-001")'
```

### 重置游戏数据

```bash
# 删除所有游戏数据
rm backend/data/games.json

# 下次启动时会自动创建新的空数据库
```

## 🎵 添加自己的音乐

编辑 `backend/data/music.json`，添加新歌曲：

```json
{
  "id": "music-013",
  "title": "你的歌曲名称",
  "artist": "艺术家名称",
  "year": 2024,
  "s3Key": "music/your-song.mp3",
  "previewStart": 30,
  "previewDuration": 15,
  "tags": ["tag1", "tag2"],
  "difficulty": "medium"
}
```

**字段说明**:
- `id`: 唯一标识符（使用 `music-NNN` 格式）
- `title`: 歌曲名称
- `artist`: 艺术家名称
- `year`: 发行年份
- `s3Key`: 音乐文件路径（在测试中暂不使用）
- `previewStart`: 预览开始时间（秒）
- `previewDuration`: 预览时长（秒）
- `tags`: 标签数组（用于过滤）
- `difficulty`: 难度等级（easy/medium/hard，影响年份容差）

## 🔧 开发工具

### VS Code 推荐扩展

- ESLint - 代码质量检查
- Vetur - Vue 语言支持
- TypeScript Vue Plugin - Vue 中的 TypeScript 支持
- Thunder Client - API 测试

### 浏览器开发者工具

- **Network 标签**: 监控所有 API 请求
- **Console 标签**: 查看错误和日志
- **Application 标签**: 查看本地存储和 Cookies
- **Vue DevTools**: 调试 Vue 组件状态（需要安装浏览器扩展）

## 📖 快速参考

| 命令 | 目的 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm test` | 运行测试 |

## 🆘 获取帮助

1. **查看日志**
   - 后端日志: 查看后端终端输出
   - 前端日志: F12 打开 DevTools，查看 Console
   - API 日志: Network 标签查看请求和响应

2. **查看文档**
   - 详细说明: 看 README.md
   - 实现指南: 看 IMPLEMENTATION_GUIDE.md
   - 需求规格: 看 .kiro/specs/music-guessing-game/

3. **调试技巧**
   - 添加 `console.log()` 语句
   - 使用浏览器 DevTools 设置断点
   - 使用 VS Code 调试器

## ✅ 成功检查清单

- [ ] 后端运行在 http://localhost:3000
- [ ] 前端运行在 http://localhost:5173
- [ ] 能打开游戏网页
- [ ] 能创建游戏房间
- [ ] 能添加玩家
- [ ] 能启动游戏
- [ ] 能听到音乐（或看到播放器）
- [ ] 能提交猜测
- [ ] 游戏能正常流转

---

**准备好开始了吗？现在就启动你的游戏！🎉🎵**


接下來你要做的事情:  
  1.寫一個腳本，每次列出music 中的第k~k+10 項title，artest，年份     
  2. 你要不同重複以下 loop 直到看完整分文件 -> 跑腳本看 title        
  artist, 年份，將三個資訊改為完全正確，你需要不停用 websearch 確認 