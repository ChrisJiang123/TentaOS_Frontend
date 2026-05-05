import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all tasks and approvals
    const [tasks, approvals, agents] = await Promise.all([
      base44.entities.Task.list('-created_date', 100),
      base44.entities.Approval.list(),
      base44.entities.Agent.list(),
    ]);

    const activeTasks = tasks.filter(t => ['running', 'planning', 'paused', 'awaiting_approval'].includes(t.status));
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingApprovals = approvals.filter(a => a.status === 'pending');
    const totalCost = tasks.reduce((sum, t) => sum + (t.actual_cost || 0), 0);
    const totalTokens = tasks.reduce((sum, t) => sum + (t.tokens_used || 0), 0);

    // Agent stats
    const agentStats = agents.map(a => ({
      id: a.id,
      name: a.name,
      role: a.role,
      tasks_completed: a.tasks_completed || 0,
      total_cost: a.total_cost || 0,
      is_active: a.is_active,
    }));

    return Response.json({
      tasks: {
        total: tasks.length,
        active: activeTasks.length,
        completed: completedTasks.length,
        queued: tasks.filter(t => t.status === 'queued').length,
        failed: tasks.filter(t => t.status === 'failed').length,
      },
      approvals: {
        total: approvals.length,
        pending: pendingApprovals.length,
        approved: approvals.filter(a => a.status === 'approved').length,
        rejected: approvals.filter(a => a.status === 'rejected').length,
      },
      cost: {
        total: parseFloat(totalCost.toFixed(4)),
        average_per_task: completedTasks.length > 0 ? parseFloat((totalCost / completedTasks.length).toFixed(4)) : 0,
      },
      tokens: {
        total: totalTokens,
      },
      agents: agentStats,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});