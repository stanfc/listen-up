# 🎵 金曲猜歌王

一个基于 Hitster 桌游规则的本地多人音乐猜歌游戏，采用 Vue.js + Express.js 架构。

## 项目特性

- ✅ **多人游戏**: 支持 2-8 人同时游戏
- ✅ **音乐猜测**: 猜歌名、猜年份，获取音乐卡牌
- ✅ **卡牌排序**: 按时间顺序排列卡牌，达到目标数量即获胜
- ✅ **代币系统**: 通过代币获得游戏优势（延长播放、年份提示）
- ✅ **标签过滤**: 按不同风格/年代过滤音乐
- ✅ **类型安全**: 使用 TypeScript 确保代码质量
- ✅ **响应式设计**: 优美的用户界面，支持各种屏幕

## 项目结构

```
猜歌王/
├── frontend/                 # Vue.js 前端
│   ├── src/
│   │   ├── components/      # Vue 组件
│   │   │   ├── GameSetup.vue
│   │   │   └── GameBoard.vue
│   │   ├── stores/          # Pinia 状态管理
│   │   │   └── gameStore.ts
│   │   ├── api/             # API 客户端
│   │   │   └── client.ts
│   │   ├── types/           # TypeScript 类型定义
│   │   │   └── index.ts
│   │   ├── App.vue
│   │   └── main.ts
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                 # Express.js 后端
│   ├── src/
│   │   ├── types.ts         # 类型定义
│   │   ├── database.ts      # 数据持久化
│   │   ├── validation.ts    # 数据验证
│   │   ├── gameLogic.ts     # 游戏逻辑
│   │   ├── api.ts           # API 路由
│   │   └── server.ts        # 服务器入口
│   ├── data/
│   │   ├── music.json       # 音乐数据库
│   │   └── games.json       # 游戏状态（自动生成）
│   ├── package.json
│   └── tsconfig.json
│
└── .kiro/                   # 需求规格文档
    └── specs/
        └── music-guessing-game/
            ├── requirements.md
            ├── design.md
            └── tasks.md
```

## 快速开始

### 环境要求
- Node.js >= 16
- npm >= 8

### 步骤 1: 安装后端依赖

```bash
cd backend
npm install
```

### 步骤 2: 启动后端服务

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 运行

输出示例：
```
Server is running on http://localhost:3000
Health check: http://localhost:3000/api/health
```

### 步骤 3: 在另一个终端安装前端依赖

```bash
cd frontend
npm install
```

### 步骤 4: 启动前端开发服务器

```bash
npm run dev
```

前端将在 `http://localhost:5173` 运行

### 步骤 5: 打开浏览器

访问 `http://localhost:5173` 开始游戏！

## 游戏规则

### 游戏流程

1. **创建房间**: 设置玩家数量、获胜所需卡牌数、音乐风格
2. **加入玩家**: 每个玩家输入自己的名称
3. **开始游戏**: 系统随机决定玩家顺序
4. **猜歌名**: 当前玩家听音乐片段并猜歌曲名称
5. **猜年份**: 猜对歌名后，猜测发行年份
6. **排列卡牌**: 正确猜测年份后，将卡牌插入时间线的合适位置
7. **获胜**: 首位达到设定卡牌数量（按年份正确排序）的玩家获胜

### 代币系统

- **初始代币**: 每位玩家开始时获得 2 个代币
- **获得代币**: 正确猜测歌曲名称获得 1 个代币
- **使用代币**: 可用于获得年份提示或延长音乐播放时间
- **失去代币**: 卡牌排序错误时失去代币；无代币时失去最旧卡牌

## API 端点

### 游戏管理

```
POST /api/games                      # 创建游戏房间
GET  /api/games/:gameId              # 获取游戏状态
POST /api/games/:gameId/players      # 添加玩家
POST /api/games/:gameId/start        # 开始游戏
POST /api/games/:gameId/next-round   # 开始下一轮
```

### 游戏操作

```
GET  /api/games/:gameId/music        # 获取当前音乐
POST /api/games/:gameId/guess        # 提交歌名或年份猜测
POST /api/games/:gameId/card-placement  # 提交卡牌排序
```

### 数据查询

```
GET  /api/music/tags                 # 获取所有音乐标签
GET  /api/health                     # 健康检查
```

## 核心功能实现

### 后端特性

✅ **游戏房间管理** - 创建房间、管理玩家、追踪游戏状态
✅ **音乐数据库** - 本地 JSON 存储，支持标签过滤
✅ **游戏逻辑** - 猜测验证、年份判定、卡牌排序、代币系统
✅ **数据验证** - 输入验证、错误处理、异常管理
✅ **本地持久化** - 使用 JSON 文件模拟数据库

### 前端特性

✅ **组件化架构** - 使用 Vue 3 Composition API
✅ **状态管理** - Pinia store 管理全局游戏状态
✅ **API 集成** - Axios 与后端通信
✅ **响应式 UI** - 美观的游戏界面
✅ **错误处理** - 用户友好的错误提示

## 数据模型

### 游戏对象

```typescript
Game {
  id: string                    # 游戏 ID
  roomCode: string             # 房间代码
  status: 'waiting'|'playing'|'finished'
  config: GameConfig           # 游戏配置
  players: Player[]            # 玩家列表
  currentRound: GameRound      # 当前轮次
  createdAt: string           # 创建时间
  updatedAt: string           # 更新时间
  finishedAt?: string         # 结束时间
  winner?: string             # 获胜者 ID
}
```

### 音乐对象

```typescript
Music {
  id: string
  title: string               # 歌曲名称
  artist: string              # 艺术家
  year: number               # 发行年份
  s3Key: string              # 音乐文件路径
  previewStart: number       # 预览开始时间（秒）
  previewDuration: number    # 预览时长（秒）
  tags: string[]             # 标签（风格、年代等）
  difficulty: 'easy'|'medium'|'hard'
}
```

## 测试游戏

### 测试场景

1. **基本流程**: 创建 2 人游戏，完成一个完整回合
2. **多人游戏**: 4 人游戏，测试玩家轮转
3. **错误处理**: 输入无效数据，测试验证功能
4. **边界情况**: 玩家数量限制、卡牌排序验证

### 调试提示

- 使用浏览器开发者工具的 Network 标签查看 API 请求
- 在后端 `data/games.json` 中查看游戏状态
- 后端控制台显示详细的操作日志

## 下一步开发

### 计划中的功能

- [ ] 音乐库管理界面
- [ ] 游戏暂停/恢复
- [ ] 玩家离线重连
- [ ] 游戏重放记录
- [ ] 排行榜和统计
- [ ] 多语言支持
- [ ] 音频可视化
- [ ] AWS 部署集成

### 性能优化

- 实现音乐文件缓存
- 优化组件渲染性能
- 添加虚拟滚动（如果卡牌很多）
- CDN 加速音乐文件

### 安全性改进

- 添加房间密码保护
- 实现玩家认证
- API 限流和防滥用
- 数据加密存储

## 开发记录

### 已完成（第 1-3 阶段）

✅ Vue 3 + TypeScript 项目设置
✅ Express.js 后端框架
✅ 数据模型和类型定义
✅ 游戏逻辑核心实现
✅ RESTful API 端点
✅ Pinia 状态管理
✅ 前端主界面组件

### 待完成（第 4-7 阶段）

- [ ] 代币系统完整实现
- [ ] 卡牌拖拽排序 UI
- [ ] 完整的错误处理
- [ ] 单元测试和端对端测试
- [ ] 性能优化和调试
- [ ] 文档完善

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**享受游戏！🎉🎵**
