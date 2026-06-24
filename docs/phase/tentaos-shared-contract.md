# TentaOS — 共享契约(Cursor 与 Codex 必须一致)

> 这是前后端的"合同"。Cursor 按这个调用,Codex 按这个实现。任何一方想改字段名/形状,必须两份文档同步改。两份开发文档都内嵌了本契约,保证各自独立可读。

## REST 端点

| 方法 | 路径 | 入参 | 返回 | 起始 Phase |
|------|------|------|------|-----------|
| GET | `/api/health` | — | `{status, version, uptime, activeTasks}` | 已有 |
| POST | `/api/plan` | `{intent, preferences?}` | `{plan_id, steps:Step[]}` | P3 |
| POST | `/api/task` | `{intent, plan_id?, preferences?}` | `{task_id}` | 已有 |
| GET | `/api/tasks` | `?status=` | `{tasks:TaskSummary[]}` | 已有 |
| GET | `/api/task/:id` | — | `{task:FullTask}` | 已有(需扩展) |
| POST | `/api/task/:id/stop` | — | `{ok}` | 已有 |
| GET | `/api/task/:id/diff` | — | `{files:[{path,patch}]}` | P5 |
| GET | `/api/screenshot` | `?task=&step=&raw?` | `{image}`; `raw=1` returns PNG bytes | 已有(加 step) |
| GET | `/api/approvals` | — | `{approvals:Approval[]}` | 已有 |
| POST | `/api/approvals/:id` | `{approved, feedback?}` | `{ok}` | 已有 |
| POST | `/api/task/:id/rollback` | `{checkpoint_id}` | `{ok}` | P9 |
| GET / PUT | `/api/preferences` | `{rules[]}` | `{rules[]}` | P10 |
| GET / POST | `/api/templates` | `{name, steps[]}` | `{templates[]}` | P10 |
| GET | `/api/demo/showcase` | — | `{showcase_version,demo_tasks:DemoShowcaseItem[],heavy_demo_tasks:DemoShowcaseItem[],investor_default_order:string[]}` | Demo |
| GET | `/api/demo/token-comparison` | — | `{measurement_type,demos:[{id,title,persona,model_plan,token_comparison,run_request}]}` | Demo |
| GET | `/api/demo/heavy-tasks` | — | same as `/api/demo/token-comparison` | Demo |
| GET | `/api/demo/showcase/:id` | — | `{demo:DemoShowcaseItem}` | Demo |
| GET | `/api/demo/showcase/:id/token-comparison` | — | `{demo_id,title,persona,model_plan,token_comparison,token_usage}` | Demo |
| POST | `/api/demo/showcase/:id/run` | `{preferences?, start?}` | task demo: `{task_id,plan_id,demo_id}`; agent demo: `{agent}` | Demo |
| POST | `/api/demo/query` | `{query, preferences?, artifact?}` | `{task_id,plan_id,query_mode:'open',search_enabled}` | Demo |
| GET / POST | `/api/artifacts` | `{title?, type?, content, task_id?}` | `{artifacts:Artifact[]}` / `{artifact}` | P11 |
| GET / PUT | `/api/artifacts/:id` | `{title?, type?, content?}` | `{artifact}` | P11 |
| GET | `/api/artifacts/:id/export` | `?format=md|txt|html|json` | file download | P11 |
| GET / POST | `/api/agents` | `{name, objective, model?, tools?, channels?}` | `{agents:PersistentAgent[]}` / `{agent}` | P11 |
| GET | `/api/agents/:id` | — | `{agent:PersistentAgent}` | P11 |
| POST | `/api/agents/:id/start` | — | `{agent:PersistentAgent}` | P11 |
| POST | `/api/agents/:id/pause` | — | `{agent:PersistentAgent}` | P11 |
| POST | `/api/agents/:id/stop` | — | `{agent:PersistentAgent}` | P11 |
| GET | `/api/agents/:id/memory` | — | `{memory:AgentMemory[]}` | P11 |
| POST | `/api/task/:id/fork` | `{strategies:[]}` | `{fork_ids:[]}` | P12 |
| GET | `/api/task/:id/forks` | — | `{forks:Fork[]}` | P12 |
| POST | `/api/task/:id/merge` | `{fork_id}` | `{ok}` | P14 |
| GET | `/api/metrics` | `?range=` | `{cost,latency,successRate,...}` | P16 |
| GET | `/api/usage` | `?status=&limit=` | `{usage:UsageRecord[],records:UsageRecord[],tasks:UsageRecord[],summary,count}` | P16/Demo |
| GET | `/api/billing/usage` | `?status=&limit=` | same as `/api/usage` | P20 compat |
| POST | `/api/auth/*` | — | — | P19 |
| `/api/billing/*` | — | — | — | P20 |

## 核心数据形状

```ts
TokenUsage = { input_tokens, prompt_tokens?, output_tokens, completion_tokens?, total_tokens }
ModelUsed = { id, model, normalized_model?, planned?, observed? }
ModelCall = { id, step_id, index, title, agent_role?, model, normalized_model?, action_type?, purpose?, why_model?, estimated, observed, usage?:TokenUsage|null, cost?, estimated_usage?:TokenUsage|null, estimated_cost? }
ModelPlan = { strategy, orchestration_reason?, agents:[{role,model,responsibility}], models:string[], model_count, step_count, calls:ModelCall[], why_tentaos?:string[] }
TokenComparison = {
  measurement_type:'estimated_counterfactual',
  disclaimer,
  with_tentaos:{strategy,input_tokens,prompt_tokens,output_tokens,completion_tokens,total_tokens,estimated_cost_usd,model_count,step_count,models:string[],model_calls:ModelCall[]},
  without_tentaos:{strategy,model,input_tokens,prompt_tokens,output_tokens,completion_tokens,total_tokens,estimated_cost_usd,assumption},
  savings:{token_saved,token_saved_pct,cost_saved_usd,cost_saved_pct},
  observed_tentaos:{available,input_tokens,output_tokens,total_tokens,cost_usd}
}
Step = {
  id, index, title, tool:'terminal'|'browser'|'file'|'model',
  action, risk:'low'|'medium'|'high',
  status:'pending'|'running'|'passed'|'failed'|'skipped'|'awaiting_approval',
  verification: { type:'test'|'build'|'http'|'file_exists'|'diff_match'|'manual',
                  expression, result?:'pass'|'fail', detail? },
  evidence: [{ type:'screenshot'|'terminal'|'diff'|'log', ref, label? }],
  model?, normalized_model?, agent_role?, why_model?, token_estimate?:TokenUsage,
  estimated_cost?, estimated_cost_usd?,
  checkpointId?
}
TaskStatus = 'queued'|'planning'|'running'|'awaiting_approval'|'completed'|'failed'|'cancelled'
TaskSummary = { id, title, intent, status:TaskStatus, steps_completed, steps_total, created_date, actual_cost? }
FullTask = TaskSummary & { steps:Step[], verification_summary?, search_results?, sources?:Source[], artifacts?:Artifact[], forks?, model_plan?:ModelPlan, models_used?:ModelUsed[], model_calls?:ModelCall[], model_count?:number, token_comparison?:TokenComparison, token_usage? }
Source = { title, url, content?, published_date? }
UsageRecord = { id, task_id, title, intent, status:'completed'|'failed'|'cancelled', query_mode?, demo_id?, answer, answer_preview, answer_source?, answer_model?, models_used?:ModelUsed[], model_count?, model_calls?:ModelCall[], model_plan?:ModelPlan|null, token_comparison?:TokenComparison|null, token_usage?, investor_metrics?, source_count, artifact_count, step_count, steps_completed, cost, duration_ms, created_at, completed_at, updated_at }
UsageSummary = { total, completed, failed, cancelled, total_tasks, completed_tasks, failed_tasks, cancelled_tasks, total_cost, total_duration_ms, avg_duration_ms, estimated_with_tentaos_tokens?, estimated_without_tentaos_tokens?, estimated_token_saved?, estimated_token_saved_pct?, estimated_with_tentaos_cost_usd?, estimated_without_tentaos_cost_usd?, estimated_cost_saved_usd?, estimated_cost_saved_pct? }
Artifact = { id, task_id?, title, type:'md'|'txt'|'html'|'json'|'code', status:'ready', content, version, editable, export_formats:string[], created_at, updated_at }
AgentMemory = { id, timestamp, type, text }
PersistentAgent = { id, name, objective, status:'created'|'initializing'|'running'|'paused'|'stopped'|'failed', model, tools:string[], channels:string[], memory?:AgentMemory[], tick_count, last_heartbeat_at?, next_tick_at?, persistent:true }
DemoShowcaseItem = { id, kind:'task'|'agent', title, audience_hook, persona?, showcase_tier?, complexity?, intent?, preferences?, agent_request?, model_plan?:ModelPlan, models_used?:ModelUsed[], model_count?, model_calls?:ModelCall[], token_comparison?:TokenComparison, token_usage?, investor_metrics?, plan_request?, task_request?, run_request, expected_ui:string[], acceptance_checks:string[], story_beats:string[], success_fields:string[] }
Approval = { id, task_id, step_id, action, risk, reason, expected_impact:{files?:[],commands?:[]} }
Fork = { id, task_id, strategy, pipeline:{steps:Step[],status}, score?, isWinner? }
```

## WebSocket 事件(全部携带 `task_id`;fork 事件额外带 `fork_id`)

```
connection_established   { engine_status }
task_started             { task_id }
step_started             { task_id, step_id, index }
terminal_output          { task_id, step_id, chunk }
browser_action           { task_id, step_id, screenshot_ref, action }
search_started           { task_id, step_id, query }
search_results           { task_id, step_id, query, result_count, results }
search_failed            { task_id, step_id, query, error }
verification_result      { task_id, step_id, result:'pass'|'fail', detail }   // P6
step_completed           { task_id, step_id }
step_failed              { task_id, step_id, error }
approval_required        { task_id, step_id, approval_id, reason, expected_impact } // P8
approval_resolved        { task_id, step_id, approved }
auto_approved            { task_id, step_id, rule }                            // P8/P10
checkpoint_created       { task_id, step_id, checkpoint_id }                    // P9
task_completed           { task_id, verification_summary }
task_failed              { task_id, error }
usage_recorded           { task_id, usage:UsageRecord }
artifact_created         { task_id, artifact_id }                              // P11
artifact_updated         { artifact_id }                                        // P11
agent_started            { agent_id }
agent_heartbeat          { agent_id, tick_count, last_heartbeat_at }
agent_paused             { agent_id }
agent_stopped            { agent_id }
fork_started             { task_id, fork_id, strategy }                          // P12
fork_step_started/…      { task_id, fork_id, step_id }                          // P12
fork_completed           { task_id, fork_id }                                   // P13
fork_scored              { task_id, fork_id, score }                            // P13
merge_completed          { task_id, fork_id }                                   // P14
```

## 约定
- 所有时间戳 ISO 8601。所有金额单位美元 number。
- WS 断开前端必须能用 `GET /api/task/:id` 完整恢复状态(WS 只是加速,不是唯一真相源)。
- `verification.result` 为空 = 还没验证;`pass`/`fail` 才算有结论。**没有 result 不准显示"完成"。**
- `POST /api/task/:id/stop` is idempotent. For active tasks it must stop the current child process / Playwright runtime, persist terminal status `cancelled`, emit `task_failed`, and make `GET /api/task/:id` reflect the stopped state. Missing task returns `{error}`.
- `browser_action.screenshot_ref` must point to a real captured screenshot for browser steps. `GET /api/screenshot?task=&step=` returns `{image}` as a data URL; adding `raw=1` returns the PNG bytes for evidence download.
- `/api/stop` is a legacy kill-all backend endpoint. Frontend should depend on single-task `POST /api/task/:id/stop`.
- Generated content that the user may want to edit/export should be represented as an `Artifact`. Frontend edits through `PUT /api/artifacts/:id` and downloads through `/api/artifacts/:id/export`.
- Artifact export responses must set `Content-Disposition: attachment; filename="..."` plus a format-specific `Content-Type`; CORS must expose `Content-Disposition`, `Content-Type`, and `Content-Length` so frontend blob-download flows can use the real filename.
- Frontend export buttons must be real links or real blob downloads pointed at `GET /api/artifacts/:id/export?format=md|txt|html|json`. Do not render placeholder export buttons or client-only mock downloads.
- Long-running user-created agents are `PersistentAgent`s. They keep lifecycle state and memory in Engine state storage, can be started/paused/stopped, and emit heartbeat events while `running`.
- Investor-demo task buttons should prefer `GET /api/demo/showcase`. Each item includes `run_request` for one-click launch plus `expected_ui` / `acceptance_checks` for frontend QA. `POST /api/demo/showcase/:id/run` is optional convenience; frontend may also use the returned `plan_request` and `task_request` directly.
- Heavy investor demo menu should use `GET /api/demo/showcase` -> `heavy_demo_tasks` as the top one-click menu. `GET /api/demo/token-comparison` returns the PPT-friendly list of heavy demos with `model_plan` and `token_comparison` before running any task.
- Public investor screenshots should use frontend route `/investor-demo`. It must load real `heavy_demo_tasks`, run `POST /api/demo/showcase/:id/run`, recover task state from `GET /api/task/:id`, render `task.artifacts`, and show Usage rows from `GET /api/usage`.
- Heavy task detail and usage rows expose `models_used`, `model_calls`, `model_plan`, `token_comparison`, and `token_usage`. Frontend should not show only `answer_model` when `models_used` exists.
- `token_comparison.measurement_type === "estimated_counterfactual"` means `without_tentaos` is an estimated baseline, not a live bill. Label it as an estimate in UI/PPT. `observed_tentaos.available === true` is the only live-provider usage signal.
- Open investor search should prefer `POST /api/demo/query {query}`. It creates a normal task, so frontend should navigate to Task Detail with `task_id` and render `task.answer`, `task.sources`, `task.search_results`, and `task.artifacts`. Existing `POST /api/task {intent}` also auto-detects search-like questions, but `/api/demo/query` forces open-query mode and exportable artifacts.
- Usage page should read `GET /api/usage?limit=100` (or compatibility alias `GET /api/billing/usage?limit=100`). Every terminal task (`completed`/`failed`/`cancelled`) writes a `UsageRecord` with `task_id`, `status`, `answer`, `answer_preview`, cost/timing, and step counts. Use `usage_recorded` as a realtime hint, then refresh `/api/usage`; HTTP remains the truth source.
- Connection badge should use `GET /api/health`: `status === "ok"` and `details.engine.http_connected === true` means backend connected. `details.engine.realtime_status` is `"connected"` when this page has an active WS client and `"available"` when WS is available but no client is currently attached. Do not treat historical `ws_last_disconnect_at` or old task-detail 404s as global backend disconnects.
