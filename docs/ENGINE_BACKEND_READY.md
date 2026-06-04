# Engine 后端已就绪 — 前端对接说明

> **状态（2026-06-05）**：后端已按 `BACKEND_API_REQUIREMENTS_P1-P9.md` 对齐；公网 `https://engine.tentaos.com` shared-contract smoke 已通过。  
> Base URL：**https://engine.tentaos.com**

## P1–9 后端确认（本轮）

| 能力 | 状态 |
|------|------|
| `POST /api/plan` → `{ plan_id, steps }`（含 risk + verification.expression） | ✅ |
| `POST /api/task`（intent + message + plan_id）→ task_id | ✅ |
| `GET /api/tasks` + `?status=` | ✅ |
| `GET /api/task/:id` HTTP 真相源 → `{ task: FullTask }` | ✅ |
| WS：task/step/terminal/verification/approval/checkpoint/complete/fail | ✅ |
| `POST /api/task/:id/stop` → 最终 `cancelled` | ✅ |
| `GET /api/task/:id/diff`、`GET /api/screenshot` | ✅ |
| Approvals + rollback + verification_summary | ✅ |
| 完成态 `answer` / `final_answer` / `result` / `output_text` | ✅ 前端已接 |
| 任务 status 枚举与前端一致（含 `cancelled`） | ✅ |
| CORS：Vercel 前端 + ngrok header | ✅ |

## 前端已对齐的改动

- Health 使用 `inferred_ws_url` 配置 WebSocket（ConnectionGate / bootstrap）
- 截图 API 解析 `{ "image": "data:image/..." }`（EvidencePanel）
- 任务状态 `accepted` → `queued`；`cancelled` / `canceled` / `stopped` → `cancelled`
- `checkpointId` 与 `checkpoint_id` 双字段均映射到 `Step.checkpointId`
- 提交任务响应支持 `{ task_id, pipeline_id, status: "accepted" }`

## 核心接口（与后端一致）

| # | 方法 | 路径 | 说明 |
|---|------|------|------|
| 1 | GET | `/api/health` | 含 `inferred_ws_url` |
| 2 | POST | `/api/plan` | `{ intent, preferences }` → `{ plan_id, steps }` |
| 3 | POST | `/api/task` | `{ intent, plan_id?, preferences }` → `{ task_id, pipeline_id, status }` |
| 4 | GET | `/api/task/:id` | **刷新/断 WS 恢复真相源** |
| 5 | GET | `/api/tasks?status=` | 列表筛选 |
| 6 | POST | `/api/task/:id/stop` | 急停 |
| 7 | GET | `/api/task/:id/diff` | `{ files: [{ path, patch }] }` |
| 8 | GET | `/api/screenshot?task=&step=` | `{ image: "data:image/..." }` |
| 9 | GET/POST | `/api/approvals` | 队列 + 决策 |
| 10 | POST | `/api/task/:id/rollback` | `{ checkpoint_id }` |

## 最终回答字段（完成态，Engine 174624+）

任务完成前由 OpenRouter 合成最终回答；`GET /api/task/:id` 与 `task_completed` / `execution_completed` 事件字段一致。

读取顺序（`extractTaskAnswer`，**勿用** `task.output` / `result.output`）：

1. `task.answer`
2. `task.result?.answer`
3. `task.final_answer` / `output_text` / `response` / `result_text`
4. `task.result?.output_text` / `result.text`

真实模型回答：`answer_source === "openrouter"`，`answer_model` 如 `openai/gpt-4.1-mini`。

展示：`RunView`「最终回答」卡片（含 model 徽章）；`POST /api/approvals/:id` 幂等（重复 resolve 不 404）。

## 单任务停止 / 轮询 / 截图（前端实现对照）

```js
// 单任务停止
await fetch(`${ENGINE}/api/task/${taskId}/stop`, { method: 'POST' });

// 然后轮询真相源
const task = await fetch(`${ENGINE}/api/task/${taskId}`)
  .then((r) => r.json())
  .then((j) => j.task);

// 顶部状态条终态（mapped: completed | failed | cancelled）
const isTerminal = ['completed', 'failed', 'cancelled'].includes(task.status);

// browser 截图
const shot = await fetch(`${ENGINE}/api/screenshot?task=${taskId}&step=${stepId}`).then((r) => r.json());
// shot.image → data:image/png;base64,...
```

| 能力 | 前端入口 |
|------|----------|
| `POST /api/task/:id/stop` | `engineClient.stopTask` → `pipelineRuntimeStore.stopTask`（停止后轮询 `GET /api/task/:id` 直至终态） |
| `GET /api/task/:id` | `refreshFromHttp` / `fetchTaskById` + `unwrapEngineTaskPayload` → `derivePipeline` |
| 终态隐藏 Run 顶栏 | `RunStatusBar`：`isTerminalEngineStatus(pipeline.status)` |
| 截图 | `engineClient.fetchScreenshot` → `EvidencePanel` 使用 `data.image` |

## 验证规则（前后端一致）

- Plan 阶段：`step.verification.result` **不会出现**
- 执行后：仅 `pass` / `fail` 有效；无 result = 前端显示「待验证」
- WS 仅加速；断线后靠 `GET /api/task/:id` 每 4s 轮询

## 前端 Phase 10–20（已完成）

| Phase | 能力 | 入口 |
|-------|------|------|
| 10 | 执行偏好 + 模板 | Settings → 执行偏好；PlanPreview「存为模板」；CommandBar 模板下拉 |
| 11–14 | Fork 泳道 / 记分 / Merge | Run View（有 `forks` 时并排泳道） |
| 15 | 执行时间线 | Run View 完成/replay 模式 |
| 16–18 | 可观测 + 可靠性 | `/Metrics` |
| 17 | 权限与 API Key | Settings → 权限与密钥 |
| 19 | 登录 / token | Settings → 账户登录 |
| 20 | 额度门槛 | CommandBar 提交前 `checkTaskQuota` |

自验收：`npm run test:phase10-20` + `npm run build`

## 本地联调

```bash
# 使用公网 Engine（默认 production 已是 engine.tentaos.com）
npm run dev

# 或 .env.local
VITE_ENGINE_URL=https://engine.tentaos.com
VITE_WS_URL=wss://engine.tentaos.com/ws
```

## CORS

已支持：`https://tenta-os-frontend.vercel.app`、本地 dev、ngrok。
