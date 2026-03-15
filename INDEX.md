# 📑 项目文件索引

快速查找项目文件和文档。

## 🚀 快速导航

| 用途 | 文件 | 说明 |
|------|------|------|
| **快速开始** | [START.md](./START.md) | 3 分钟启动游戏 |
| **项目说明** | [README.md](./README.md) | 完整项目介绍 |
| **实现细节** | [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) | 架构和实现指南 |
| **完成总结** | [COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md) | 项目完成情况 |
| **需求文档** | [.kiro/specs](./kiro/specs/) | 官方需求规格 |

## 📁 目录结构速查

### 后端文件

```
backend/
├── src/
│   ├── 🖥️ server.ts              - 服务器入口 (启动监听)
│   ├── 🛣️  api.ts                - API 路由 (11个端点)
│   ├── 🎮 gameLogic.ts           - 游戏逻辑 (核心算法)
│   ├── 💾 database.ts            - 数据操作 (JSON 持久化)
│   ├── ✓ validation.ts           - 数据验证 (输入检查)
│   └── 📝 types.ts               - 类型定义 (数据结构)
├── data/
│   ├── 🎵 music.json             - 音乐库 (12 首歌)
│   └── 🎮 games.json             - 游戏状态 (自动生成)
├── 📦 package.json
└── ⚙️ tsconfig.json
```

### 前端文件

```
frontend/
├── src/
│   ├── 📦 App.vue                - 主应用 (页面切换)
│   ├── 🚀 main.ts                - 入口文件 (初始化)
│   ├── components/
│   │   ├── 🎮 GameSetup.vue      - 房间创建 (226行)
│   │   └── 🎯 GameBoard.vue      - 游戏界面 (285行)
│   ├── stores/
│   │   └── 📊 gameStore.ts       - Pinia store (220行)
│   ├── api/
│   │   └── 🌐 client.ts          - API 客户端 (80行)
│   └── types/
│       └── 📝 index.ts           - 类型定义 (180行)
├── 📦 package.json
├── ⚙️ vite.config.ts
├── ⚙️ tsconfig.json
└── 🔧 .env
```

### 文档文件

```
根目录
├── 📖 README.md                  - 项目说明 (450行)
├── 🚀 START.md                   - 快速启动 (300行)
├── 🔧 IMPLEMENTATION_GUIDE.md    - 实现指南 (600行)
├── 📊 COMPLETION_SUMMARY.md      - 完成总结 (400行)
├── 📑 INDEX.md                   - 本文件
└── 📦 package.json               - 根项目配置

.kiro/specs/music-guessing-game/
├── 📋 requirements.md            - 8 个需求规格
├── 🏗️  design.md                 - 系统设计
└── ✅ tasks.md                   - 任务列表
```

## 🎯 按用途查找

### 我想...

#### 运行游戏
👉 [START.md](./START.md)
- 第 1 步：启动后端
- 第 2 步：启动前端
- 第 3 步：打开浏览器

#### 了解项目
👉 [README.md](./README.md)
- 项目特性
- 游戏规则
- 项目结构
- API 文档

#### 理解实现
👉 [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- 技术栈
- 游戏流程
- 数据模型
- 测试场景

#### 查看完成情况
👉 [COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md)
- 功能完成度
- 架构设计
- 技术指标
- 后续计划

#### 查看需求规格
👉 [.kiro/specs/music-guessing-game/](./kiro/specs/music-guessing-game/)
- requirements.md - 8 个用户故事
- design.md - 系统设计
- tasks.md - 实现任务

## 📊 文件大小参考

| 文件 | 行数 | 大小 | 说明 |
|------|------|------|------|
| backend/src/api.ts | 330 | ~12 KB | 最大的后端文件 |
| frontend/src/components/GameBoard.vue | 285 | ~10 KB | 最复杂的组件 |
| backend/src/gameLogic.ts | 280 | ~11 KB | 游戏逻辑核心 |
| IMPLEMENTATION_GUIDE.md | 600+ | ~25 KB | 最详细的文档 |
| backend/data/music.json | 400+ | ~12 KB | 12 首歌曲数据 |
| README.md | 450+ | ~18 KB | 项目说明文档 |

## 🔍 代码搜索快速指南

### 找游戏逻辑

```bash
# 搜索"创建游戏"
grep -r "createNewGame" backend/src/
# 位置: backend/src/gameLogic.ts:56

# 搜索"猜测处理"
grep -r "processSongGuess" backend/src/
# 位置: backend/src/gameLogic.ts:105

# 搜索"卡牌排序"
grep -r "processCardPlacement" backend/src/
# 位置: backend/src/gameLogic.ts:190
```

### 找 API 端点

```bash
# 搜索所有 POST 端点
grep -r "app.post" backend/src/api.ts
# 结果: 6 个 POST 端点

# 搜索所有 GET 端点
grep -r "app.get" backend/src/api.ts
# 结果: 4 个 GET 端点
```

### 找组件

```bash
# 列出所有 Vue 组件
find frontend/src -name "*.vue" -type f

# 搜索特定事件处理
grep -r "@click" frontend/src/components/
```

## 💡 常用操作

### 修改配置

**游戏规则配置**
- 位置: `backend/data/music.json`
- 修改项: 歌曲数据、难度、标签

**API 配置**
- 位置: `frontend/.env`
- 修改项: `VITE_API_URL`

**服务器配置**
- 位置: `backend/src/server.ts`
- 修改项: 端口号 (当前 3000)

**前端配置**
- 位置: `frontend/vite.config.ts`
- 修改项: 代理、别名、构建选项

### 添加新功能

**添加新 API 端点**
1. 在 `backend/src/api.ts` 中添加路由
2. 在 `backend/src/gameLogic.ts` 中实现逻辑
3. 在 `backend/src/validation.ts` 中添加验证
4. 在 `frontend/src/api/client.ts` 中添加方法
5. 在 `frontend/src/stores/gameStore.ts` 中添加 action

**添加新 Vue 组件**
1. 在 `frontend/src/components/` 中创建 `.vue` 文件
2. 在 `frontend/src/App.vue` 中导入和使用
3. 使用 `useGameStore()` 访问全局状态
4. 使用 `apiService` 调用后端 API

**添加新音乐**
1. 编辑 `backend/data/music.json`
2. 添加新对象，遵循现有格式
3. 前端会自动加载

### 调试技巧

**查看后端日志**
```bash
# 启动后端时查看控制台输出
cd backend && npm run dev
# 所有 API 调用和错误都会打印
```

**查看前端日志**
```bash
# 打开浏览器 DevTools (F12)
# 查看 Console 标签
# 查看 Network 标签中的 API 请求
```

**查看游戏状态**
```bash
# 查看当前游戏的 JSON
cat backend/data/games.json | jq '.'
```

## 📱 文件依赖关系

```
App.vue
├── GameSetup.vue
│   ├── gameStore (Pinia)
│   │   └── apiService
│   │       └── axios
│   └── types/index.ts
└── GameBoard.vue
    ├── gameStore (Pinia)
    │   └── apiService
    │       └── axios
    ├── types/index.ts
    └── HTML5 Audio Element
```

## 🎓 学习路径

### 初级 (了解项目)
1. 阅读 [README.md](./README.md) - 了解项目概况
2. 运行 [START.md](./START.md) - 启动项目
3. 玩一局游戏 - 体验功能

### 中级 (理解实现)
1. 阅读 [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
2. 查看后端 API 实现 (`backend/src/api.ts`)
3. 查看前端状态管理 (`frontend/src/stores/gameStore.ts`)
4. 查看游戏逻辑 (`backend/src/gameLogic.ts`)

### 高级 (修改和扩展)
1. 添加新 API 端点
2. 实现新游戏功能
3. 编写测试用例
4. 部署到生产环境

## 🆘 常见问题速查

| 问题 | 解决方案 | 文件 |
|------|--------|------|
| 如何启动项目？ | 看 START.md | [START.md](./START.md) |
| API 有哪些端点？ | 看 README.md API 部分 | [README.md](./README.md#api-端点) |
| 如何修改规则？ | 编辑 music.json 或 gameLogic.ts | backend/src/ |
| 如何添加功能？ | 看 IMPLEMENTATION_GUIDE.md | [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md#后续开发指南) |
| 出错怎么办？ | 看 START.md 故障排除 | [START.md](./START.md#-故障排除) |

## 📞 获取帮助

**查看文档**
- 快速开始: [START.md](./START.md)
- 详细说明: [README.md](./README.md)
- 实现指南: [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- 完成总结: [COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md)

**查看代码**
- 后端 API: `backend/src/api.ts`
- 游戏逻辑: `backend/src/gameLogic.ts`
- 前端组件: `frontend/src/components/`
- 状态管理: `frontend/src/stores/gameStore.ts`

**查看日志**
- 后端: 启动后端时的控制台输出
- 前端: 浏览器 DevTools Console 标签
- 网络: 浏览器 DevTools Network 标签

---

**祝你开发愉快！🎵**

最后更新: 2026-03-14
