# Frontend fixes evidence (cold start)

Source spec: `tentaos-cursor-frontend-fixes.md` (9 tasks).  
Date: 2026-06-05.

## Task checklist

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | i18n — default `en`, no mixed copy on hot paths | Done | `src/i18n/strings.ts`, `useStrings()`, CommandBar / RunView / Dashboard / run/* |
| 2 | Success toast auto-dismiss 3s | Done | `src/components/ui/use-toast.jsx` — `TOAST_SUCCESS_MS = 3000`, `setTimeout` dismiss |
| 3 | Enter submit + IME `isComposing` | Done | `CommandBar.jsx` `onKeyDown` |
| 4 | Run status bar hides on terminal | Done | `RunStatusBar.jsx` — `TERMINAL_STATUSES` → `return null` in live mode |
| 5 | Remove all user-visible “beta” | Done | grep below (0 in `src/`) |
| 6 | Remove global EmergencyStop; keep per-task Stop | Done | `Dashboard.jsx` — no `<EmergencyStop />`; `RunStatusBar` + `engineClient.stopTask` |
| 7 | Keep Diagnostics | Done | Sidebar `/diagnostics`, route in `App.jsx` |
| 8 | Claude-like layout + TentaOS evidence | Done | Persistent `Sidebar`, RunView grid + verification on steps |
| 9 | Dashboard buttons audit | Done | table below |

---

## Task 9 — Dashboard & nav: button → expected → actual

| Control | Expected | Actual (after fix) |
|---------|----------|-------------------|
| Command Bar **Run task** | Submit to Engine → toast → TaskDetail or plan preview | `submitEngineTask` / `createPlan` via `CommandBar` |
| Example task cards | Fill textarea | `fillExample()` |
| Template picker | Open plan preview from template | `onPlanReady` → `PlanPreview` |
| Quick Actions **New Task** | Focus Command Bar | `onNewTask` → focus `[data-testid="command-bar"]` |
| Quick Actions **Pipeline** | Navigate Pipeline Studio | `Link` → `/PipelineStudio` |
| Quick Actions **Agents** | Navigate Agents | `Link` → `/Agents` |
| Quick Actions **Approvals** | Navigate Approvals | `Link` → `/Approvals` |
| Template selector cards | Submit template goal | `templateLaunch` mutation + toast |
| Runs filter tabs | Filter task list | `filter` state |
| Search | Filter by title/goal | `search` state |
| Task card row | Open run view | `TaskCard` → `/TaskDetail?id=…` |
| Empty state “Focus Command Bar” | Focus input | button `onClick` |
| Advanced **Design pipeline** | Plan preview (not no-op toast) | `createPlan` → `setPlanPreview` |
| Sidebar **Diagnostics** | Diagnostics page | `/diagnostics` |
| ~~Global EmergencyStop~~ | Removed | No render on Dashboard |

**Pipeline Studio:** empty state → honest CTA “Go to Dashboard”; with tasks → step list + TaskDetail link (not `queryFn: () => []` dead page).

---

## Task 5 — `beta` grep (user-visible `src/`)

```bash
rg -i 'beta|内测' src --glob '*.{jsx,js,tsx,ts}'
# Expected: no matches
```

**Result (2026-06-05):** `Grep src` → **0 matches** for `beta|Beta|内测`.

---

## Automated verification

```bash
npm run test:derive-pipeline
npm run test:phase2
npm run test:phase4-9
npm run test:phase10-20
npm run build
npm run test:e2e -- tests/tentaos-pipeline-engine.spec.ts
```

**Result (2026-06-05):**

```
npm run test:derive-pipeline  → derive-pipeline.test.mjs: all assertions passed
npm run test:phase2           → phase2-command-bar.test.mjs: all static checks passed
npm run test:phase4-9         → phase4-9-run-view.test.mjs: passed
npm run test:phase10-20       → phase10-20-advanced.test.mjs: passed
npm run build                 → vite build OK
```

---

## Manual checks (investor demo)

1. **Language:** Settings → English; open Dashboard, Run View, Approvals — single language per screen.
2. **Toast:** Submit task → “Task submitted” toast gone within ~3s.
3. **IME:** Chinese input — Enter confirms composition, does not submit; plain Enter submits.
4. **Status bar:** Complete a task → sticky run bar disappears; Final answer / verification remain.
5. **Beta:** Landing hero has no “Now in Beta”.
6. **Stop:** No floating global kill-all; Run View **Stop** calls `POST /api/task/:id/stop` (backend must honor).
7. **Diagnostics:** Sidebar **Diagnostics** opens health/engine panel.

Screenshots: capture Dashboard, Run View (terminal), Approvals, Metrics, Landing — attach to PR or demo deck.

---

## Key files changed

- `src/i18n/strings.ts`, `src/i18n/useStrings.js`, `src/lib/LanguageContext.jsx`
- `src/components/ui/use-toast.jsx`
- `src/components/pipeline/CommandBar.jsx`, `PipelineChat.jsx`
- `src/components/run/RunStatusBar.jsx`, `RunView.jsx`, evidence/verification cards
- `src/pages/Dashboard.jsx`, `Landing.jsx`
- `src/components/layout/Sidebar.jsx`, `MobileNav.jsx`
