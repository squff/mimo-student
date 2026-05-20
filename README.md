# MiMo Student — 面向大学生的多模态 AI 学习生活助手

> 基于小米 MiMo 大模型，为大学生打造「学习 + 生活」一站式智能助手

---

## 项目简介

MiMo Student 是一款专为大学生群体设计的多模态 AI 助手应用，深度融合学习管理与校园生活场景。项目以**拍题解答、课程表管理、作业管家、食堂助手、考试冲刺、AI 对话**六大核心模块为载体，充分发挥 MiMo-V2-Omni 的视觉理解能力与 MiMo-V4-Flash 的推理能力，让 AI 真正融入大学生的日常学习与生活。

---

## 功能特性

### 学习场景

| 模块 | 功能 | 多模态能力 |
|------|------|------------|
| 拍题解答 | 拍照识题，AI 分步解析解题思路 | 拍照 → MiMo-V2-Omni 视觉识别 → MiMo-V4-Flash 推理 |
| 课程表管理 | 周视图展示，支持手动录入与拍照 OCR 自动提取 | 拍课表 → OCR 识别 → 结构化入库 |
| 作业管家 | 创建作业、跟踪进度、完成打卡，多状态流转 | 文本交互 |
| 考试冲刺 | AI 智能出题、闪卡复习、掌握度追踪，精准巩固薄弱知识点 | MiMo-V4-Flash 出题 + 推理 |

### 生活场景

| 模块 | 功能 | 多模态能力 |
|------|------|------------|
| 食堂助手 | 拍餐盘自动识别菜品，估算热量，生成营养周报 | 拍餐盘 → MiMo-V2-Omni 菜品识别 → 营养分析 |
| AI 对话 | SSE 流式对话，支持通用/拍题/菜品/课表四种模式智能路由 | 多模态输入 + 流式输出 |

### 统计面板

Dashboard 页面提供互动次数、作业进度、课程数量、题目练习等核心数据一览，帮助学生掌握学习状态。

---

## 技术架构

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js 14 + TypeScript) │
│                   Port: 3081                         │
├─────────────────────────────────────────────────────┤
│                   Backend (FastAPI + Python)          │
│                   Port: 8081                         │
├──────────────┬──────────────────┬────────────────────┤
│  SQLite      │  MiMo-V2-Omni   │  MiMo-V4-Flash     │
│  (aiosqlite) │  视觉理解模型     │  推理生成模型       │
│  7 张业务表   │  拍题/菜品/课表    │  解题/对话/出题     │
└──────────────┴──────────────────┴────────────────────┘
```

### 技术栈明细

- **后端**：FastAPI + SQLite (aiosqlite) + httpx + Pillow
- **前端**：Next.js 14 + TypeScript
- **AI 模型**：MiMo-V2-Omni（视觉理解）+ MiMo-V4-Flash（推理生成）
- **UI 设计**：石墨色暗色主题，专业且护眼
- **通信方式**：REST API + SSE 流式推送

### 数据库设计

共 7 张核心表：`interactions`（互动记录）、`homework`（作业管理）、`schedule`（课程表）、`diet_records`（饮食记录）、`exam_cards`（考试闪卡）、`knowledge_entities`（知识点实体）等。

---

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- MiMo API Key（从小米开放平台获取）

### 后端启动

```bash
cd backend
pip install -r requirements.txt
# 配置环境变量
cp .env.example .env  # 编辑 .env 填入 MIMO_API_KEY
python -m uvicorn main:app --host 0.0.0.0 --port 8081
```

### 前端启动

```bash
cd frontend
npm install
npm run dev  # 访问 http://localhost:3081
```

### 验证服务

```bash
curl http://localhost:8081/api/health
```

---

## 页面路由

| 路径 | 功能 |
|------|------|
| `/` | 重定向至控制台 |
| `/dashboard` | 统计面板 |
| `/camera` | 拍照识别（通用/菜品/课表/题目 四种模式） |
| `/homework` | 作业管理 |
| `/schedule` | 课程表 |
| `/diet` | 饮食记录 |
| `/exam` | 考试冲刺 |
| `/chat` | AI 对话（SSE 流式） |

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat` | AI 对话 |
| POST | `/api/chat/stream` | AI 对话（SSE 流式） |
| POST | `/api/vision` | 图片分析 |
| GET/POST | `/api/homework` | 作业 CRUD |
| GET/POST | `/api/schedule` | 课程 CRUD |
| POST | `/api/schedule/ocr` | 课表 OCR 识别 |
| GET/POST | `/api/diet` | 饮食记录 |
| GET/POST | `/api/exam` | 考试题目与错题本 |
| GET | `/api/stats` | 统计数据 |
| GET | `/api/health` | 健康检查 |

---

## Token 消耗分析

MiMo Student 针对 Token 使用进行了精细化设计，确保资源高效利用：

### 单用户日均消耗

| 场景 | 调用次数 | 单次 Token | 日消耗 |
|------|----------|-----------|--------|
| 拍题解答 | 20 次 | ~2,000 | ~40,000 |
| 学习管理（作业/对话） | 10 次 | ~1,000 | ~10,000 |
| 饮食识别 | 10 次 | ~1,500 | ~15,000 |
| 考试巩固（出题+解析） | 5 次 | ~3,000 | ~15,000 |
| **合计** | | | **~80,000** |

- **单用户月均**：约 240 万 Token
- **16 亿 Token 可用**：约 660 个月（单用户）
- **2000 用户规模月均**：约 4.8 亿 Token

### Token 效率优化策略

- SSE 流式输出减少等待时间，提升用户体验的同时复用连接
- 多模态路由智能分流，仅视觉任务调用 Omni 模型，纯文本任务使用 Flash 模型
- 课程表/饮食记录等结构化数据本地存储，仅在需要分析时触发 AI 调用

---

## 项目结构

```
MiMo-Student/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── database.py          # SQLite 数据库管理
│   ├── routers/
│   │   ├── chat.py          # 对话路由（含 SSE）
│   │   ├── vision.py        # 视觉分析路由
│   │   ├── homework.py      # 作业管理路由
│   │   ├── schedule.py      # 课程表路由
│   │   ├── diet.py          # 饮食记录路由
│   │   └── exam.py          # 考试冲刺路由
│   ├── services/
│   │   └── mimo_client.py   # MiMo API 调用封装
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/   # 统计面板
│   │   │   ├── camera/      # 拍照识别
│   │   │   ├── homework/    # 作业管理
│   │   │   ├── schedule/    # 课程表
│   │   │   ├── diet/        # 饮食记录
│   │   │   ├── exam/        # 考试冲刺
│   │   │   └── chat/        # AI 对话
│   │   ├── components/      # 通用组件
│   │   └── lib/             # 工具函数
│   ├── package.json
│   └── next.config.js
└── README.md
```

---

## 适用场景与用户价值

MiMo Student 精准切入大学生高频痛点：

1. **学习效率提升**：拍题即解，分步讲解，比搜索引擎找答案快 10 倍
2. **时间管理优化**：拍课表一键入库，作业进度一目了然
3. **健康管理**：食堂拍餐盘即可获取热量数据，培养健康饮食习惯
4. **备考利器**：AI 根据薄弱知识点精准出题，闪卡复习巩固记忆

---

## 许可证

MIT License

---

**MiMo Student** — 让 AI 成为每一位大学生的贴身学习伙伴
