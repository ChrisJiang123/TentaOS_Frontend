# TentaOS Engine 后端接口需求（前端 Phase 1–9 已完成）

> **状态（2026-06-05）**：后端 P1–9 已在 `https://engine.tentaos.com` 完成对齐与自测（`npm run test:shared-contract` 公网/本地 PASS）；前端 Phase 1–9 + 10–20 已对接，见 `docs/ENGINE_BACKEND_READY.md`。  
> 给后端/Codex 的实现清单。字段名与路径为**合同**，请勿自创别名。  
> 前端仓库：`TentaOS_Frontend`，契约源：`tentaos-shared-contract.md`。

---

## 一、优先级（建议实现顺序）

| 优先级 | Phase | 能力 | 阻塞前端什么 |
|--------|-------|------|----------------|
| P0 | 已有 | health / 提交任务 / 任务列表 | 无法启动 |
| P1 | P3 | `POST /api/plan` | 计划预览只能用本地 fallback |
| P1 | P4 | `GET /api/task/:id` 扩展 + WS 步骤事件 | Run View 无法实时 |
| P2 | P4 | `POST /api/task/:id/stop` | 无法急停 |
| P2 | P5 | `GET /api/task/:id/diff` + `GET /api/screenshot` | 证据面板 diff/截图为空 |
| P2 | P6 | `verification_result` + `task_completed.verification_summary` | 验证摘要/完成态不正确 |
| P2 | P8 | 审批 REST + WS `approval_required` / `auto_approved` | 审批流不可用 |
| P2 | P9 | `checkpoint_created` + `POST /api/task/:id/rollback` | 无法回滚 |

---

## 二、全局约定

1. **路径**：任务详情优先 `GET /api/task/:id`（单数）。前端兼容 `GET /api/tasks/:id`，但请尽快统一到契约路径。
2. **响应包裹**：可 `{ task: FullTask }` 或直接返回 task 对象；前端会 unwrap。
3. **时间戳**：ISO 8601 字符串。
4. **金额**：美元，`number`。
5. **WS 与 HTTP**：WS 断开时，前端每 **4 秒** 轮询 `GET /api/task/:id` 恢复状态；**HTTP 是唯一真相源**，WS 仅加速。
6. **验证铁律**：`verification.result` 为空 = 未验证；仅 `pass` / `fail` 为有结论。前端**不会**在无 result 时把步骤标成「验证通过」。
7. **CORS**：允许前端源；本地开发 `http://localhost:3000`。

---

## 三、REST API

### 1. `GET /api/health`（已有）

**响应示例：**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 12345,
  "activeTasks": 2,
  "pending_approvals": 1
}
```
`pending_approvals` 可选，有则 Dashboard 可显示待审批数。

---

### 2. `POST /api/plan`（Phase 3 — 需新增）

**请求：**
```json
{
  "intent": "把这个仓库的测试跑通",
  "preferences": {}
}
```
`preferences` 可选，Phase 10 再用。

**响应：**
```json
{
  "plan_id": "plan-uuid-xxx",
  "steps": [ /* Step[]，见第四节 */ ]
}
```

**要求：**
- 每步必须有 `risk`（low/medium/high）、`verification.expression`（如 `npm test`）
- high-risk 步骤前端会标「需审批」
- 未实现时可返回 404，前端会用本地 fallback 计划（但 Launch 仍依赖真实 `POST /api/task`）

---

### 3. `POST /api/task`（已有 — 需扩展入参）

**请求（契约 + 兼容）：**
```json
{
  "intent": "把这个仓库的测试跑通",
  "message": "把这个仓库的测试跑通",
  "plan_id": "plan-uuid-xxx",
  "preferences": {}
}
```
- `intent`：**必填**（契约字段）
- `message`：与 `intent` 相同即可（**兼容旧版**，前端两个都会发）
- `plan_id`：可选，来自 Plan Preview Launch
- `preferences`：可选

**响应（至少其一）：**
```json
{ "task_id": "task-uuid-xxx" }
```
或
```json
{ "ok": true, "task_id": "task-uuid-xxx" }
```
或
```json
{ "ok": true, "task": { "id": "task-uuid-xxx", "status": "queued", ... } }
```

---

### 4. `GET /api/tasks`（已有 — 建议支持筛选）

**Query：** `?status=running|completed|failed`（可选）

**响应：**
```json
{
  "tasks": [
    {
      "id": "task-uuid",
      "title": "Run npm test...",
      "intent": "把这个仓库的测试跑通",
      "status": "running",
      "steps_completed": 1,
      "steps_total": 3,
      "created_date": "2026-06-05T10:00:00.000Z",
      "actual_cost": 0.12
    }
  ]
}
```

**任务 status 枚举（任务级）：**  
`queued` | `planning` | `running` | `paused` | `awaiting_approval` | `completed` | `failed` | `cancelled`

---

### 5. `GET /api/task/:id`（已有 — **必须扩展**，Phase 4–9 核心）

**响应：**
```json
{
  "task": {
    "id": "task-uuid",
    "title": "简短标题",
    "intent": "用户原始意图",
    "status": "running",
    "steps_completed": 1,
    "steps_total": 3,
    "created_date": "2026-06-05T10:00:00.000Z",
    "actual_cost": 0.05,
    "plan_id": "plan-uuid",
    "steps": [ /* Step[] */ ],
    "verification_summary": {
      "checks": [
        { "type": "test", "result": "pass", "detail": "npm test passed" }
      ],
      "duration_ms": 120000,
      "cost": 0.42,
      "final_diff_ref": "optional-ref"
    },
    "forks": []
  }
}
```

**Step 结构（契约，字段名请一致）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 步骤 ID（或 `step_id`，前端会映射到 `id`） |
| `index` | number | 从 0 开始 |
| `title` | string | 步骤标题 |
| `tool` | enum | `terminal` \| `browser` \| `file` \| `model` |
| `action` | string? | 要执行的操作描述 |
| `risk` | enum | `low` \| `medium` \| `high` |
| `status` | enum | `pending` \| `running` \| `passed` \| `failed` \| `skipped` \| `awaiting_approval` |
| `verification` | object | 见下 |
| `evidence` | array? | `[{ type, ref, label? }]` |
| `checkpoint_id` | string? | 检查点 ID（或 `checkpointId`） |

**verification 对象：**
```json
{
  "type": "test",
  "expression": "npm test",
  "result": "pass",
  "detail": "npm test passed"
}
```
- `type`: `test` | `build` | `http` | `file_exists` | `diff_match` | `manual`
- `result`: 仅 `pass` | `fail`；**未完成验证时不要带此字段**

**兼容旧字段（可逐步废弃）：**
- 步骤在 `pipeline.steps` 而非顶层 `steps` → 前端两种都读
- `step_id`, `role`, `task`(string), `workflow_nodes` → 前端有映射

---

### 6. `POST /api/task/:id/stop`（Phase 4 — 需实现）

**请求：** 空 body 或 `{}`

**响应：**
```json
{ "ok": true }
```

**行为：** 任务进入 `cancelled` 或 `failed`；进行中的步骤应停止。  
**兼容：** 前端在 404 时会 fallback `POST /api/stop`（全局停），请优先实现 per-task 路径。

---

### 7. `GET /api/task/:id/diff`（Phase 5 — 需新增）

**响应：**
```json
{
  "files": [
    {
      "path": "src/foo.ts",
      "patch": "@@ -1,3 +1,4 @@\n-old\n+new\n"
    }
  ]
}
```

**要求：**
- `path` 为工作区内相对路径，**不要**包含 `..` 或 `/etc` 等系统路径
- `patch` 为 unified diff 文本或类 git diff 行（前端按 `+`/`-` 高亮）

---

### 8. `GET /api/screenshot`（Phase 5 — 需支持 step 参数）

**Query：**
```
?task={task_id}&step={step_id}
```

**响应（任选一种）：**
- 直接返回 `image/png` 二进制
- 或 JSON：`{ "image": "https://...或 base64..." }`

前端请求 URL 示例：  
`{ENGINE_URL}/api/screenshot?task=xxx&step=yyy&t={timestamp}`

WS 事件 `browser_action` 也可带 `screenshot_ref`（URL），前端会优先展示。

---

### 9. `GET /api/approvals`（Phase 8 — 需对齐形状）

**响应：**
```json
{
  "approvals": [
    {
      "id": "approval-uuid",
      "task_id": "task-uuid",
      "step_id": "step-2",
      "action": "npm publish",
      "risk": "high",
      "reason": "将发布到 npm registry",
      "status": "pending",
      "expected_impact": {
        "files": ["package.json", "dist/index.js"],
        "commands": ["npm publish"]
      }
    }
  ]
}
```

`status`: `pending` | `approved` | `rejected`（或等价）

---

### 10. `POST /api/approvals/:id`（Phase 8 — 已有，需对齐）

**请求：**
```json
{
  "approved": true,
  "feedback": "可选拒绝理由"
}
```

**响应：**
```json
{ "ok": true }
```

**行为：**
- `approved: true` → 任务/步骤继续执行
- `approved: false` → 任务停止或步骤 `failed`
- 应发 WS `approval_resolved`

---

### 11. `POST /api/task/:id/rollback`（Phase 9 — 需新增）

**请求：**
```json
{
  "checkpoint_id": "cp-uuid-or-step-checkpoint-id"
}
```

**响应：**
```json
{ "ok": true }
```

**行为：**
- 工作区与任务状态回退到该检查点
- 回滚后 `GET /api/task/:id` 应反映新状态（步骤、status、verification 等）
- 失败返回 4xx/5xx + `{ "error": "..." }`，前端会 toast，不留半状态

---

## 四、WebSocket

**连接：** 与 HTTP 同 host，路径 `/ws`（前端默认 `ws://host/ws`）。

**通用规则：**
- 每条业务事件必须带 `task_id`
- payload 为 JSON，`type` 字段为事件名（或与前端约定 event 字段一致）
- fork 相关额外带 `fork_id`（Phase 12+，可先不实现）

### 事件列表（Phase 4–9 必需）

| 事件名 | Payload 字段 | 说明 |
|--------|----------------|------|
| `connection_established` | `engine_status` | 连接成功 |
| `task_started` | `task_id` | 任务开始 |
| `step_started` | `task_id`, `step_id`, `index?` | 步骤 running |
| `terminal_output` | `task_id`, `step_id`, `chunk` | 终端增量输出（字符串） |
| `browser_action` | `task_id`, `step_id`, `screenshot_ref?`, `action?` | 浏览器操作/截图 |
| `verification_result` | `task_id`, `step_id`, `result`, `detail?` | `result`: `pass` \| `fail` |
| `step_completed` | `task_id`, `step_id` | 步骤成功结束 |
| `step_failed` | `task_id`, `step_id`, `error?` | 步骤失败 |
| `approval_required` | `task_id`, `step_id`, `approval_id`, `reason`, `expected_impact` | 任务应 `awaiting_approval` |
| `approval_resolved` | `task_id`, `step_id`, `approved` | boolean |
| `auto_approved` | `task_id`, `step_id`, `rule` | 如 `"low risk"` |
| `checkpoint_created` | `task_id`, `step_id`, `checkpoint_id` | 检查点已创建 |
| `task_completed` | `task_id`, `verification_summary?` | 见下 |
| `task_failed` | `task_id`, `error?` | 任务失败 |

**`task_completed.verification_summary` 示例：**
```json
{
  "task_id": "xxx",
  "verification_summary": {
    "checks": [
      { "type": "test", "result": "pass", "detail": "npm test passed" },
      { "type": "build", "result": "pass", "detail": "npm run build ok" }
    ],
    "duration_ms": 95000,
    "cost": 0.38,
    "final_diff_ref": "optional"
  }
}
```

**`approval_required.expected_impact` 示例：**
```json
{
  "files": ["src/auth.ts"],
  "commands": ["rm -rf node_modules", "npm install"]
}
```

---

## 五、前端当前行为（便于联调）

| 场景 | 前端行为 |
|------|----------|
| 提交任务 | CommandBar → Plan（或 fallback）→ Launch → `POST /api/task` → 跳转 `/TaskDetail?id=` |
| Run View | `mount` 时 `GET /api/task/:id` + WS + 4s 轮询 |
| 刷新页面 | 再次 `GET /api/task/:id` 恢复 |
| 历史任务 | `/TaskDetail?id=xxx&mode=replay`，不轮询、不 WS |
| 审批 | 行内卡片 + `/Approvals` 队列；侧边栏红点 = pending 数量 |
| Stop | 确认弹窗 → `POST /api/task/:id/stop` |
| Rollback | 确认弹窗 → `POST /api/task/:id/rollback` → 再 GET 校验 |

---

## 六、后端自测清单（建议）

- [ ] `POST /api/plan` 返回带 risk/verification 的 steps
- [ ] `POST /api/task` 接受 `intent` + `plan_id`，返回 `task_id`
- [ ] `GET /api/task/:id` 返回完整 `steps[]` 且状态随执行变化
- [ ] WS 推送 `step_started` → `terminal_output` → `verification_result` → `step_completed`
- [ ] 某步验证 fail 时，`verification.result=fail`，且 `task_completed` 不应让前端显示「全部成功」
- [ ] high-risk 步触发 `approval_required`，`POST /api/approvals/:id` 批准后继续
- [ ] `checkpoint_created` 后 rollback，GET 任务状态确实回退
- [ ] `GET /api/task/:id/diff` 仅工作区内路径
- [ ] 断 WS 后仅依赖 GET，前端仍能恢复进度

---

## 七、后续 Phase（10–20）

> **前端**：Phase 10–20 已在仓库实现（偏好/模板/Fork/时间线/Metrics/Auth/Billing 门槛）。  
> **后端**：以下接口仍可按需补齐（前端有 localStorage / 本地估算回退）。

- `GET/PUT /api/preferences`
- `GET/POST /api/templates`
- `POST /api/task/:id/fork`、`GET .../forks`、`POST .../merge`
- `GET /api/metrics`
- `POST /api/auth/*`
- `/api/billing/*`（部分已有 `/api/billing/me`）

---

**联系人/仓库：** TentaOS_Frontend `docs/BACKEND_API_REQUIREMENTS_P1-P9.md`（本文件）
