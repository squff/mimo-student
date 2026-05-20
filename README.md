# MiMo Student — 大学生的多模态AI学习生活助手

基于小米 MiMo 大模型的大学生 AI 助手，支持拍照识别、作业管理、课程表、饮食记录、考试冲刺、AI 对话。

## 功能模块

| 模块 | 功能 | MiMo 模型 |
|------|------|-----------|
| 拍照识别 | 通用/菜品/课表/题目识别 | MiMo-V2-Omni |
| 作业管理 | 创建/跟踪/提醒 | MiMo-V4-Flash |
| 课程表 | 拍课表自动提取+手动添加 | MiMo-V2-Omni |
| 饮食记录 | 拍餐盘识别+热量估算+营养报告 | MiMo-V2-Omni |
| 考试冲刺 | AI出题+闪卡复习+掌握度追踪 | MiMo-V4-Flash |
| AI对话 | 流式对话+多模块路由 | MiMo-V4-Flash |

## 技术栈

- **后端**: FastAPI + SQLite + httpx
- **前端**: Next.js 14 + TypeScript
- **AI核心**: MiMo-V2-Omni (多模态) + MiMo-V4-Flash (推理)
- **设计**: 石墨色暗色主题 + 蓝色强调色

## 启动

```bash
# 后端
pip install -r requirements.txt
cd frontend && npm install && npm run build
uvicorn backend.main:app --host 0.0.0.0 --port 8081

# 前端
cd frontend && npm start
```

## Token 消耗预估

- 日均 50 次交互 × 1600 Token = 8 万 Token/天
- 月消耗: ~240 万 Token
- 16 亿 Token 可用约 660 个月

## 项目链接

- GitHub: https://github.com/squff/mimo-student
