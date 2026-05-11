# TentaOS Dashboard & Cortex Pipeline — QA

**自动化（仓库内）**

| 脚本 | 覆盖 | Automated coverage |
|------|------|---------------------|
| `npm run test:qa-smoke` | HTTP：`/Dashboard`、`/dashboard`、`/pipeline`、小写别名等 → 200 且 HTML 含 `<div id="root">`；**并在 `npm run build` 之后**扫描 `dist/assets/*.js` 是否含稳定 `data-testid` / 文案标记 | **yes**（HTTP + bundle 子集） |
| 浏览器逐点点 Pipeline 画布 / Toast | 见下方 **Manual browser checklist** | **manual only** |
| Playwright / Cypress | 未安装 | **not covered** |

**环境变量**

- `QA_BASE_URL`：预览或 dev 根 URL（默认 `http://127.0.0.1:4173`）。
- `QA_SKIP_HTTP=1`：跳过 HTTP 路由探测，仅做 **bundle marker** 检查（适合 CI 只跑 `build` + smoke 子集）。

**Windows PowerShell 示例**

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
# 新终端
$env:QA_BASE_URL="http://127.0.0.1:4173"; npm run test:qa-smoke
```

**状态图例**

| 状态 | 含义 |
|------|------|
| **working** | 行为明确，用户可感知结果 |
| **mocked** | 无后端或失败时使用本地/mock，并有 **Toast** 或文案说明 |
| **disabled intentionally** | 禁用 + **Tooltip** 或明确原因 |
| **needs backend** | 需 Engine 或第三方服务才能变为 fully working |

---

## 路由

| route | 预期 | Automated coverage | 状态 |
|-------|------|-------------------|------|
| `/Dashboard` 或 `/dashboard` | 非空白；`data-testid="dashboard-page"` | yes（HTTP+bundle） | **working** |
| `/PipelineStudio` 或 `/pipeline` | Cortex Pipeline 三栏 | yes | **working** |
| `/Agents`、`/agents` | Agent 列表 | yes | **mocked** |
| `/Approvals`、`/approvals` | 审批列表 | yes | **mocked** / **needs backend** |
| `/Models`、`/models` | 模型列表 | yes | **mocked** |
| `/Pricing`、`/pricing` | 方案卡 | yes | **mocked** |
| `/Billing`、`/billing` | 计费占位 | yes | **mocked** |
| `/Triggers`、`/triggers` | 触发器列表 | yes | **mocked** |
| `/Settings`、`/settings` | 设置 + Engine 信息 | yes | **working** / **needs backend** |

---

## Manual browser checklist（Phase 2.5）

> 在已登录、可访问 Engine 或纯离线 mock 环境下执行；控制台应无未处理红色异常。

1. 打开 `/Dashboard`，确认非白屏，`dashboard-page` 存在（DevTools）。
2. 确认 **Token Saved** 或百分比（如 `60%`）在 KPI 区可见（`dashboard-kpi-token-saved`）。
3. 确认 KPI 卡片、Cortex / Tentacle、Trace、Cost 区域有内容或合理空态。
4. 打开 `/pipeline`（或 `/PipelineStudio`），标题 **Cortex Pipeline**。
5. 点击 **Start with Cortex Template**（`start-cortex-template`）。
6. 画布上出现多个节点（`pipeline-node-card`）。
7. 点击 **Validate**（`validate-pipeline`）。
8. 右侧 **Last Validate** 出现摘要（Engine 或 mock）。
9. 点击 **Dry Run**（`dry-run-pipeline`）。
10. 右侧 **Last Dry Run** 出现结果。
11. 点击 **Save**（`save-pipeline`），应出现 Toast：**Pipeline saved locally.**
12. （可选）清空画布后 Save 应禁用，Tooltip：**Add nodes before saving.**
13. 点击 **Generate Template**（`generate-template-pipeline`），输入短标签，画布应出现确定性 mock 节点 + Toast。
14. 侧边栏依次进入 Agents / Approvals / Models / Pricing / Billing / Triggers / Settings，无白屏。
15. Dashboard 中 **直接提交引擎** 在 Engine 不可用时应有 **destructive Toast**（非仅 console）。

| # | Automated coverage |
|---|---------------------|
| 1–4 | manual only |
| 5–13 | manual only（bundle 仅验证字符串存在） |
| 14 | manual only（HTTP smoke 不执行 React） |
| 15 | manual only |

---

## Pipeline — 按钮与 `data-testid`

| 按钮 / 区域 | `data-testid` | 预期 | Automated coverage | 状态 |
|-------------|---------------|------|---------------------|------|
| 页面根 | `pipeline-page` | 三栏布局 | yes | **working** |
| 画布 | `pipeline-canvas` | 可平移 / 拖放 | manual only | **working** |
| 节点卡片 | `pipeline-node-card` | 每节点一张卡 | yes | **working** |
| Proof 条 | `proof-status-pill` | Proof / Rollback / Trace 文案 | yes | **working**（演示文案） |
| Start with Cortex Template | `start-cortex-template` | 载入模板节点 | manual only | **mocked** |
| Validate | `validate-pipeline` | API + mock 兜底 + 右侧摘要 | manual only | **mocked** / **needs backend** |
| Dry Run | `dry-run-pipeline` | 同上 | manual only | **mocked** / **needs backend** |
| Clear | `clear-pipeline` | 清空；无节点时禁用 + Tooltip | manual only | **working** / **disabled intentionally** |
| Generate Template | `generate-template-pipeline` | 本地确定性 mock + Toast | manual only | **mocked** |
| Save | `save-pipeline` | **localStorage** + 成功 Toast；无节点禁用 + Tooltip | manual only | **mocked**（仅本机） |
| Run | — | 禁用 + Tooltip：需 pipeline runtime | manual only | **disabled intentionally** |
| 左侧 + 新工作流 | — | 禁用 + Tooltip | manual only | **disabled intentionally** |
| Delete node | `pipeline-btn-delete-node` | 删除选中 | manual only | **working** |

---

## Dashboard — 其他

| 项 | Automated coverage | 状态 |
|----|-------------------|------|
| `dashboard-page` | yes | **working** |
| KPI / 概览（`getDashboardPanelBundle`） | manual only | **mocked** / **needs backend** |
| Engine 健康行 | manual only | **working**；失败时 `dashboard-health-error` |
| PipelineChat 提交失败 | manual only | **mocked**（Toast，非仅 console） |
| EmergencyStop | manual only | **needs backend**；失败 Toast |
| ApprovalDialog | manual only | **needs backend**；失败 Toast 且对话框保持 |

---

## 其他页面 — 抽样

| 页面 | 控件 | Automated coverage | 状态 |
|------|------|-------------------|------|
| Approvals | Approve / Reject / Revise | manual only | **mocked** / **needs backend** |
| Billing | Cancel Subscription | manual only | **disabled intentionally**（未接 billing provider） |
| Models | Add Model | manual only | **mocked** |
| Triggers | New Trigger | manual only | **disabled intentionally** |
| Agents | New Agent | manual only | **disabled intentionally** |
| Pricing | 付费 CTA | manual only | **mocked** |

---

## 质量门槛

- [ ] 浏览器控制台无未捕获异常（扩展干扰除外）。
- [ ] `npm run lint` 通过。
- [ ] `npm run typecheck` 通过。
- [ ] `npm run build` 通过。
- [ ] `npm run test:qa-smoke`（已 `build`；预览可选）通过。

---

## 仍需后端的能力（汇总）

| 能力 | 说明 |
|------|------|
| `GET /api/dashboard/*` | 仪表盘分块 API（已有 mock 兜底） |
| `POST /api/pipeline/validate`、`dry-run` | 已有 mock 兜底 |
| Pipeline **Run**、服务端 **Save** | 需 Engine pipeline runtime / 持久化 |
| **Billing provider**、Cancel 订阅 | Paddle/Stripe 等接入后把 `billingProviderConnected` + `onCancelSubscription` 接到 `SubscriptionCard` |
| Agents / Triggers CRUD | 管理 API |
| AI 真生成工作流 | 非「Generate Template」本地 mock |
