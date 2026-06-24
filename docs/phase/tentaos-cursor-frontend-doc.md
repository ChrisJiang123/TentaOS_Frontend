# TentaOS 前端实施文档 — 给 Cursor(Phase 1→20)

> 使用方式:一次只做一个 Phase,做完 `npm run build` 通过 → commit → 我截图确认 → 下一个。
> 全文与「Codex 后端文档」「验收文档」按 Phase 编号对齐,共用《共享契约》里的 API/WS 名称——**不要自创字段名**。
> 通用规则:不新增重型依赖;不重写 `src/components/ui/`;沿用现有 `statusConfig` 的状态色/图标;改动前 commit;状态色全站统一。

---

## Phase 1 — Pipeline 数据模型(地基,先做,无 UI)

**目标:** 建立全站统一的数据对象。后面所有界面都吃它。

**新建文件**
- `src/types/pipeline.ts` — 按《共享契约》定义 `Step / Check / Evidence / Pipeline / Fork / Approval / TaskSummary / FullTask` 的 TS 类型
- `src/lib/derivePipeline.js` — `derivePipeline(apiTask) → Pipeline`:把 `GET /api/task/:id` 的返回映射成 Pipeline 对象;`mode` 由调用方传入;`forks` 暂留空
- `src/lib/pipelineStatus.js` — 单一来源的 `statusConfig`(color/icon/label),供 TaskCard、StepStream、Run View 共用;从现有 TaskCard 抽出来

**DoD:** build 通过;`derivePipeline` 有单元测试(喂一个 mock task JSON,断言输出 Pipeline 结构正确)。

**不要:** 不碰任何 UI;不创建新页面。

---

## Phase 2 — Command Bar + 教学空状态 + 提交反馈

**目标:** 用户一进来就知道在哪输入、怎么上手;提交后有明确反馈(成功/失败)。

**编辑文件**
- `src/components/pipeline/PipelineChat.jsx`(或新建 `CommandBar.jsx`)
  - 大输入框 + placeholder 举例
  - **教学空状态**:输入框下方 3 个示例任务卡片,点击把文本填入输入框(例:"把这个仓库的测试跑通"、"给落地页加一个邮箱订阅表单"、"检查并修复 lint 错误")
  - 提交:`submitTask(intent)` → loading 态 → 成功 toast + 跳 Run View;失败**红色 toast**(引入 `useToast`)
- `src/pages/Dashboard.jsx`:确保未开始任何任务时,主区呈现 Command Bar + 示例,而不是空白

**用到:** `POST /api/task`(已有)

**DoD:** 新用户进入 → 看到输入框 + 3 个可点示例 → 提交后有 toast → 成功跳转 Run View;Engine 断开时提交 → 红色 toast(不静默)。

**不要:** 不做语音输入、不做多模态上传(后置)。

---

## Phase 3 — Plan Preview(管线"预览模式")

**目标:** 意图 → 看 AI 打算怎么干(带风险+验证)→ 确认再启动。

**新建/编辑**
- `src/components/pipeline/PlanPreview.jsx`
  - 提交意图后调 `POST /api/plan` 拿 `steps[]`,用 `derivePipeline` 构造 `Pipeline{mode:'preview'}`
  - 渲染步骤列表,每步显示:序号 · 标题 · 工具图标 · **风险标签**(low/medium/high 配色) · **验证判据文案**("完成后跑 `npm test` 验证")
  - 操作:删除步骤、跳过步骤(先不做指令编辑)
  - high-risk 步骤明显标记(红边 + "需审批"角标)
  - 底部主按钮 **Launch** → `POST /api/task {intent, plan_id}` → 跳 Run View
- 复用 `pipelineStatus.js` 的配色

**用到:** `POST /api/plan`(P3 新增) → 若后端尚未就绪,前端先用 `POST /api/task` 直接执行并在 Run View 里展示同样的 step 结构,保留 PlanPreview 组件待后端 ready 接上

**DoD:** 输入意图 → 看到带风险/验证标注的可读管线 → 能删/跳过步骤 → Launch 进入 Run View。

**不要:** 不做拖拽排序、不做分支/条件、不做节点画布。预览 = 看 + 删/跳过。

---

## Phase 4 — Run View 实时模式(全产品高光)

**目标:** 亲眼看到 AI 干活,状态脊椎永远可见。

**编辑** `src/pages/TaskDetail.jsx` + `src/components/dashboard/StepStream.jsx`
- 顶部状态条:标题 · 当前状态(映射状态机) · 进度 step X/Y · **Stop 按钮**(`POST /api/task/:id/stop`)
- 进页面 `GET /api/task/:id` → `Pipeline{mode:'live'}` 初始渲染
- 建立 WS(用现有 engineClient),按《共享契约》事件表更新对应 step:
  - `step_started` → 该步 running + 高亮 + 自动滚入视野
  - `terminal_output` → 该步证据追加文本
  - `browser_action` → 该步证据加截图缩略图
  - `step_completed`/`step_failed` → 改状态
  - `task_completed`/`task_failed` → 管线收尾
- **WS 断开兜底**:每 4s 轮询 `GET /api/task/:id` 合并状态

**DoD:** 提交任务 → 步骤逐个亮起 → 终端/截图实时进来 → 中途刷新页面状态正确恢复。

**不要:** 不为每种事件做花哨动画;一致状态色 + 自动滚动即可。

---

## Phase 5 — 证据面板(截图 / 终端 / diff)

**目标:** 每一步的证据可见、可查。

**新建** `src/components/run/EvidencePanel.jsx`(Run View 右侧)
- 三个分区/Tab:**截图**(点缩略图开大图)、**终端**(等宽字体日志)、**文件 diff**
- diff 来自 `GET /api/task/:id/diff`,用简单的 +/- 行高亮(可用轻量 diff 渲染,别引入重库)
- 默认跟随当前 running 步骤;用户点任意步骤 → 面板切到那步的证据(为 replay 打基础)

**用到:** `GET /api/task/:id/diff`(P5 新增)、`GET /api/screenshot?task=&step=`

**DoD:** 运行中能看到截图/终端实时更新;完成后能点任意步骤查看其证据 + 看到改了哪些文件的 diff。

**不要:** 不做 IDE 级 diff 编辑;只读展示。

---

## Phase 6 — 验证摘要(evidence-backed 的体现)

**目标:** "完成"必须挂着客观验证结果。

**编辑** Run View + StepStream
- 监听 `verification_result` 事件 → 在该步显示 ✓/✗ + 判据(如 "✓ npm test passed")
- `task_completed` 携带 `verification_summary` → 顶部显示摘要卡:哪些 check 过了(test/build/http/diff)、最终 diff 链接、总耗时、成本
- **铁律:`verification.result` 为空时,该步显示"待验证";整任务任一关键 check 未过,不显示绿色"完成"**

**用到:** `verification_result` 事件 + `task_completed.verification_summary`

**DoD:** 任务完成时看到"什么被验证了"卡片;某步验证失败时该步显示红色 ✗ 且整体不标"成功"。

**不要:** 不让前端自己判断成功/失败,一切以后端 `verification.result` 为准。

---

## Phase 7 — Runs 列表 + Replay 模式

**目标:** 找到任何任务;历史任务可逐步回放证据。

**编辑** `src/pages/Dashboard.jsx` 或新建 `src/pages/Runs.jsx`
- 用现有 TaskCard(已可点击)
- 状态筛选 tab:进行中 / 已完成 / 失败
- 进行中卡片实时更新(WS 或 5s 轮询)
- 教学空状态:"还没有任务,创建第一个" + 跳 Command Bar
- 点历史任务 → Run View 以 `mode:'replay'` 打开:同一渲染组件,数据来自 `GET /api/task/:id`,用户点步骤看当时证据(非实时)

**DoD:** 刷新历史都在;进行中会动;点历史能逐步回看证据。

**不要:** 不做全文搜索/标签;状态筛选 + 时间排序足够。

---

## Phase 8 — Approvals(行内 + 队列 + 风险展示)

**目标:** 高风险操作停下等人拍板,不打断心流。

**编辑** `src/components/dashboard/ApprovalDialog.jsx` + 新建 `src/pages/Approvals.jsx`
- **行内审批**(主):`approval_required` 事件 → 在 Run View 对应步骤上展开卡片:要做什么 · 风险原因 · **预期影响**(要改的文件/命令,来自 `expected_impact`) · 批准/拒绝(可填理由)→ `POST /api/approvals/:id`
- **审批队列**(辅):独立页汇总所有待审批
- 导航 Approvals 入口有待审批时显示**红点角标**(轮询 `GET /api/approvals` 或 WS 计数)
- `auto_approved` 事件 → 该步显示 "auto-approved (low risk)"

**DoD:** 触发 high-risk → 任务停在 awaiting_approval → 行内卡片可批准/拒绝 → 批准继续/拒绝停止;导航红点亮起。

**不要:** 不做多级审批/指派审批人。

---

## Phase 9 — 急停 + 回滚/检查点

**目标:** commit-safe。任何时候能停、能回退到任一检查点。

**编辑** Run View + EvidencePanel
- Stop 按钮已在 P4;此处加确认弹窗
- 监听 `checkpoint_created` → 在对应步骤标一个"检查点"锚点
- 每个检查点旁加 **Rollback to here** 按钮 → 确认弹窗 → `POST /api/task/:id/rollback {checkpoint_id}`
- 回滚后 Run View 刷新状态

**用到:** `POST /api/task/:id/rollback`(P9 新增)+ `checkpoint_created` 事件

**DoD:** 运行中能急停;完成/失败后能回滚到任一检查点并看到状态回退。

**不要:** 不做分支式撤销树;线性回滚到检查点即可。

---

## Phase 10 — 执行偏好 + 计划存为模板(可控的个性化)

**目标:** 用户的长期偏好塑造每次 AI 规划;调好的计划可复用。

**编辑** `src/pages/Settings.jsx` + PlanPreview
- Settings 加 **执行偏好** 区:一组规则开关/输入(例:"部署前必须先跑测试""碰生产环境必须人工审批""优先模型 = Claude")→ `PUT /api/preferences`
- 提交任务/规划时把 preferences 一起传(`POST /api/plan` / `POST /api/task` 的 `preferences`)
- PlanPreview 加 **存为模板**:`POST /api/templates {name, steps}`;Command Bar 加"从模板开始"下拉(`GET /api/templates`)

**用到:** `/api/preferences`、`/api/templates`(P10 新增)

**DoD:** 设了偏好后,新任务的计划遵守这些规则;能把一个计划存成模板并下次调出。

**不要:** 不做模板市场/分享;本地账户级即可。

---

## Phase 11 — Fork 数据模型接口(留钩子,无独立 UI)

**目标:** 前端为 fork 留好渲染钩子,等后端 ready。

**编辑** `derivePipeline` + 类型
- 让 `Pipeline.forks` 能被填充并解析为 `Fork[]`
- Run View 加一个判断:`if (task.forks?.length) → 渲染 ForkLanes,else → 单管线`(ForkLanes 占位组件先返回单管线)

**DoD:** 有 forks 字段时不报错;无则行为不变。

**不要:** 还不写泳道 UI。

---

## Phase 12 — Fork 泳道总览

**目标:** 同一意图的 N 条并行管线并排展示。

**新建** `src/components/run/ForkLanes.jsx`
- 顶部:intent + N 条 fork 状态总览
- 主区:N 条管线**并排泳道**,每条复用 P4 的 StepStream 渲染(这就是复用同一组件的回报)
- 监听 `fork_started` / `fork_step_*` 事件,按 `fork_id` 路由到对应泳道

**用到:** `POST /api/task/:id/fork`、`GET /api/task/:id/forks`、fork WS 事件

**DoD:** 一个意图发起 fork → 看到 2-3 条泳道并行各自跑步骤。

**不要:** fork 数先固定 2-3;不做无限可配置。

---

## Phase 13 — Fork 记分卡

**目标:** 每条 fork 由客观验证聚合出一个 score。

**编辑** ForkLanes
- 每条泳道底部 **验证记分卡**:列出该 fork 的 check 结果(test/build/http) → 聚合 score
- 监听 `fork_scored` → 更新分数;`fork_completed` → 锁定
- 系统高亮**最高分** fork(但不自动合并)

**DoD:** 各泳道跑完显示记分卡 + 综合分;最优 fork 被高亮。

**不要:** score 不能是模型自评,必须来自后端客观 check。

---

## Phase 14 — 择优合并 + 反事实存档(护城河)

**目标:** 人工确认后合并赢家;其余存为数据。

**编辑** ForkLanes
- 获胜 fork 上 **Merge** 按钮 → 高风险时弹人工确认 → `POST /api/task/:id/merge {fork_id}`
- 监听 `merge_completed` → 显示合并结果 + 最终 diff
- UI 说明:落败 fork 已存为反事实执行数据(给用户"数据在沉淀"的感知)

**用到:** `POST /api/task/:id/merge`

**DoD:** 选定最优 fork → 人工确认 → 合并 → 看到合并后的最终 diff。

**不要:** 不允许跳过人工确认直接合并 high-risk。

---

## Phase 15 — 执行时间线 / 跨 fork 证据账本

**目标:** 一个统一时间线回看整次执行(含所有 fork 的证据)。

**新建** `src/components/run/Timeline.jsx`
- 横向时间线:每个事件(step、审批、检查点、fork 分叉、合并)一个节点,点击跳对应证据
- replay 模式下可拖动游标回看任意时刻

**DoD:** 完成的任务能在时间线上逐事件回看,含 fork 分叉与合并点。

**不要:** 不做视频式逐帧;事件级即可。

---

## Phase 16 — 可观测面板(成本/延迟/成功率)

**新建** `src/pages/Metrics.jsx`
- 从 `GET /api/metrics` 取数,展示:任务成功率、平均延迟、累计成本、fork 胜率、各模型表现
- 用 recharts(已在可用库)做几张简单图

**DoD:** 看到近 7/30 天的成功率、成本、延迟趋势。

**不要:** 不做自定义报表构建器。

---

## Phase 17 —(前端配合)权限与密钥 UI

**编辑** Settings
- API key / 密钥的安全输入(不回显明文)、权限范围展示
- 配合后端 P17 的权限模型,展示当前任务被授予的能力(文件/网络/终端范围)

**DoD:** 用户能看到并管理 Engine 被授予的权限范围与密钥。

---

## Phase 18 —(前端配合)可靠性视图

**编辑** Metrics
- 展示长测/压测结果:长任务成功率、超时率、重试次数

**DoD:** 能看到可靠性指标趋势。

---

## Phase 19 — 多用户与持久化(去 localStorage)

**目标:** 从单机 localStorage 走向真账户。

**编辑**
- 接入后端 auth(P19):登录/登出、token 管理
- Engine URL、偏好、模板从 localStorage 迁到账户级(后端存储)
- AuthContext 改为真实鉴权(替换当前的 health-check 占位)

**DoD:** 多设备登录同一账户看到同样的任务/偏好/模板。

**不要:** 一次性迁移,保留 localStorage 回退直到后端稳定。

---

## Phase 20 — Billing / Creem 接入

**编辑** Billing/Pricing 页(之前移出主流程的,此时正式接)
- 接 `/api/billing/*`:套餐、用量计费、额度门槛
- 用量超限时在 Command Bar 友好提示并引导升级

**DoD:** 能查看用量、升级套餐;超额有明确提示。

**不要:** 计费逻辑在后端,前端只展示与引导。

---

## 总纪律
严格 1→20 顺序;每 Phase build + commit + 截图确认;状态色统一;不重写 UI 库;不自创契约字段。
