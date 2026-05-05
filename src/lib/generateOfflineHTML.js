/**
 * Generates a fully self-contained offline HTML version of the TentaOS Dashboard.
 * Returns a complete HTML string that can be saved as a .html file and opened in any browser.
 */
export function generateOfflineHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TentaOS Dashboard — Offline</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #06060B; color: #fff; min-height: 100vh; }
  a { color: #00E5FF; text-decoration: none; }
  .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
  
  /* Header */
  .header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 32px; }
  .logo { font-size: 20px; font-weight: 700; }
  .logo span { color: #00E5FF; }
  .badge { font-size: 10px; padding: 2px 8px; border-radius: 9999px; background: rgba(0,229,255,0.1); color: #00E5FF; border: 1px solid rgba(0,229,255,0.2); }
  
  /* Stats */
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; }
  .stat-label { font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 4px; }
  .stat-value { font-size: 24px; font-weight: 600; }
  .stat-value.blue { color: #3B82F6; }
  .stat-value.green { color: #10B981; }
  .stat-value.amber { color: #F59E0B; }
  .stat-value.purple { color: #8B5CF6; }
  
  /* Section title */
  h1 { font-size: 24px; font-weight: 600; margin-bottom: 4px; }
  .subtitle { font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 24px; }
  
  /* Layout */
  .main-grid { display: grid; grid-template-columns: 1fr 280px; gap: 24px; }
  
  /* Task input */
  .task-input { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; margin-bottom: 20px; }
  .task-input textarea { width: 100%; background: transparent; border: none; color: #fff; font-size: 14px; resize: none; outline: none; font-family: inherit; }
  .task-input textarea::placeholder { color: rgba(255,255,255,0.25); }
  .task-input .actions { display: flex; justify-content: flex-end; margin-top: 8px; }
  .btn { padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
  .btn-primary { background: #00E5FF; color: #06060B; }
  .btn-primary:hover { background: rgba(0,229,255,0.8); }
  
  /* Tabs */
  .tabs { display: flex; gap: 4px; margin-bottom: 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 3px; width: fit-content; }
  .tab { padding: 6px 14px; font-size: 12px; border-radius: 6px; color: rgba(255,255,255,0.5); cursor: pointer; border: none; background: none; }
  .tab.active { background: rgba(255,255,255,0.08); color: #fff; }
  
  /* Task cards */
  .task-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; margin-bottom: 8px; transition: background 0.2s; cursor: pointer; }
  .task-card:hover { background: rgba(255,255,255,0.04); }
  .task-card .title { font-size: 14px; font-weight: 500; margin-bottom: 8px; }
  .task-card .meta { display: flex; align-items: center; gap: 12px; font-size: 11px; color: rgba(255,255,255,0.3); }
  .status { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 500; }
  .status.running { background: rgba(59,130,246,0.1); color: #3B82F6; }
  .status.completed { background: rgba(16,185,129,0.1); color: #10B981; }
  .status.queued { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5); }
  .status.planning { background: rgba(139,92,246,0.1); color: #8B5CF6; }
  .progress-bar { height: 3px; background: rgba(255,255,255,0.06); border-radius: 2px; margin-top: 10px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
  .progress-fill.blue { background: #3B82F6; }
  .progress-fill.green { background: #10B981; }
  
  /* Agents sidebar */
  .sidebar-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; }
  .sidebar-header { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.7); }
  .agent-row { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.03); display: flex; align-items: center; gap: 10px; }
  .agent-avatar { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
  .agent-info { flex: 1; }
  .agent-name { font-size: 13px; font-weight: 500; }
  .agent-model { font-size: 10px; color: rgba(255,255,255,0.4); }
  .agent-stats { font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 4px; }
  .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
  .dot.active { background: #10B981; }
  .dot.inactive { background: rgba(255,255,255,0.15); }
  
  /* Responsive */
  @media (max-width: 768px) {
    .stats { grid-template-columns: repeat(2, 1fr); }
    .main-grid { grid-template-columns: 1fr; }
  }
  
  /* Watermark */
  .watermark { text-align: center; padding: 32px; font-size: 11px; color: rgba(255,255,255,0.15); border-top: 1px solid rgba(255,255,255,0.04); margin-top: 48px; }
</style>
</head>
<body>

<div class="header">
  <div class="logo">Tenta<span>OS</span></div>
  <span class="badge">Offline Preview</span>
</div>

<div class="container">
  <h1>Dashboard</h1>
  <p class="subtitle">Launch tasks, monitor agents, approve actions</p>
  
  <!-- Stats -->
  <div class="stats">
    <div class="stat-card">
      <div class="stat-label">Active Tasks</div>
      <div class="stat-value blue">3</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Completed</div>
      <div class="stat-value green">12</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Pending Approvals</div>
      <div class="stat-value amber">2</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Cost</div>
      <div class="stat-value purple">$4.82</div>
    </div>
  </div>
  
  <div class="main-grid">
    <div>
      <!-- Task Input -->
      <div class="task-input">
        <textarea rows="2" placeholder="Describe your task and let AI agents handle the rest..."></textarea>
        <div class="actions">
          <button class="btn btn-primary" onclick="alert('This is an offline preview. Launch the full web app for live functionality.')">⚡ Launch Task</button>
        </div>
      </div>
      
      <!-- Tabs -->
      <div class="tabs">
        <button class="tab active">All</button>
        <button class="tab">Active</button>
        <button class="tab">Completed</button>
      </div>
      
      <!-- Tasks -->
      <div class="task-card">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span class="title">Research AI trends and write a summary report</span>
          <span class="status running">● Running</span>
        </div>
        <div class="meta">
          <span>🤖 researcher, writer</span>
          <span>⏱ 2m 34s</span>
          <span>💰 $0.23</span>
        </div>
        <div class="progress-bar"><div class="progress-fill blue" style="width:65%"></div></div>
      </div>
      
      <div class="task-card">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span class="title">Generate marketing copy for landing page</span>
          <span class="status planning">● Planning</span>
        </div>
        <div class="meta">
          <span>🤖 planner, writer</span>
          <span>⏱ 0m 12s</span>
          <span>💰 $0.02</span>
        </div>
        <div class="progress-bar"><div class="progress-fill blue" style="width:15%"></div></div>
      </div>
      
      <div class="task-card">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span class="title">Debug authentication middleware</span>
          <span class="status running">● Running</span>
        </div>
        <div class="meta">
          <span>🤖 coder, reviewer</span>
          <span>⏱ 5m 01s</span>
          <span>💰 $0.41</span>
        </div>
        <div class="progress-bar"><div class="progress-fill blue" style="width:80%"></div></div>
      </div>
      
      <div class="task-card">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span class="title">Competitive analysis — SaaS pricing landscape</span>
          <span class="status completed">✓ Completed</span>
        </div>
        <div class="meta">
          <span>🤖 researcher</span>
          <span>⏱ 8m 22s</span>
          <span>💰 $0.67</span>
        </div>
        <div class="progress-bar"><div class="progress-fill green" style="width:100%"></div></div>
      </div>
      
      <div class="task-card">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span class="title">Create onboarding email sequence</span>
          <span class="status completed">✓ Completed</span>
        </div>
        <div class="meta">
          <span>🤖 writer, reviewer</span>
          <span>⏱ 4m 10s</span>
          <span>💰 $0.35</span>
        </div>
        <div class="progress-bar"><div class="progress-fill green" style="width:100%"></div></div>
      </div>

      <div class="task-card">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span class="title">Refactor database schema documentation</span>
          <span class="status queued">○ Queued</span>
        </div>
        <div class="meta">
          <span>🤖 coder, writer</span>
          <span>⏱ —</span>
          <span>💰 $0.00</span>
        </div>
      </div>
    </div>
    
    <!-- Agents Sidebar -->
    <div>
      <div class="sidebar-card">
        <div class="sidebar-header">🤖 Active Agents</div>
        
        <div class="agent-row">
          <div class="agent-avatar" style="background:rgba(59,130,246,0.15);color:#3B82F6;">P</div>
          <div class="agent-info">
            <div class="agent-name">Planner <span class="dot active"></span></div>
            <div class="agent-model">gpt-4o</div>
            <div class="agent-stats">24 tasks · $1.20</div>
          </div>
        </div>
        
        <div class="agent-row">
          <div class="agent-avatar" style="background:rgba(139,92,246,0.15);color:#8B5CF6;">R</div>
          <div class="agent-info">
            <div class="agent-name">Researcher <span class="dot active"></span></div>
            <div class="agent-model">gpt-4o</div>
            <div class="agent-stats">18 tasks · $0.95</div>
          </div>
        </div>
        
        <div class="agent-row">
          <div class="agent-avatar" style="background:rgba(16,185,129,0.15);color:#10B981;">C</div>
          <div class="agent-info">
            <div class="agent-name">Coder <span class="dot active"></span></div>
            <div class="agent-model">claude-sonnet</div>
            <div class="agent-stats">15 tasks · $1.10</div>
          </div>
        </div>
        
        <div class="agent-row">
          <div class="agent-avatar" style="background:rgba(245,158,11,0.15);color:#F59E0B;">W</div>
          <div class="agent-info">
            <div class="agent-name">Writer <span class="dot active"></span></div>
            <div class="agent-model">gpt-4o-mini</div>
            <div class="agent-stats">21 tasks · $0.48</div>
          </div>
        </div>
        
        <div class="agent-row">
          <div class="agent-avatar" style="background:rgba(239,68,68,0.15);color:#EF4444;">O</div>
          <div class="agent-info">
            <div class="agent-name">Operator <span class="dot inactive"></span></div>
            <div class="agent-model">gpt-4o</div>
            <div class="agent-stats">8 tasks · $0.62</div>
          </div>
        </div>
        
        <div class="agent-row">
          <div class="agent-avatar" style="background:rgba(6,182,212,0.15);color:#06B6D4;">V</div>
          <div class="agent-info">
            <div class="agent-name">Reviewer <span class="dot active"></span></div>
            <div class="agent-model">claude-sonnet</div>
            <div class="agent-stats">12 tasks · $0.47</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="watermark">
    TentaOS Dashboard — Offline Preview · Generated ${new Date().toISOString().split('T')[0]} · tentaos.com
  </div>
</div>

</body>
</html>`;
}