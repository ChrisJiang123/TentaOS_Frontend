import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { approval_id, decision, note } = await req.json();
  if (!approval_id || !decision) {
    return Response.json({ error: 'approval_id and decision are required' }, { status: 400 });
  }

  if (!['approved', 'rejected', 'revision_requested'].includes(decision)) {
    return Response.json({ error: 'Invalid decision' }, { status: 400 });
  }

  // Update approval
  await base44.asServiceRole.entities.Approval.update(approval_id, {
    status: decision,
    decided_by: user.email,
    decision_note: note || '',
  });

  // Get approval details
  const approvals = await base44.asServiceRole.entities.Approval.filter({ id: approval_id });
  const approval = approvals[0];

  if (approval && approval.task_id) {
    try {
      if (decision === 'approved') {
        // Update task status - the running pipeline will detect approval and continue
        await base44.asServiceRole.entities.Task.update(approval.task_id, {
          status: 'running',
        });
        if (approval.pipeline_run_id) {
          await base44.asServiceRole.entities.PipelineRun.update(approval.pipeline_run_id, {
            status: 'running',
          });
        }

        // Add to execution log
        const tasks = await base44.asServiceRole.entities.Task.filter({ id: approval.task_id });
        if (tasks[0]) {
          const log = tasks[0].execution_log || [];
          log.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            agent: 'Human',
            action: 'Approved',
            detail: 'Step approved by ' + user.email + (note ? ': ' + note : ''),
            type: 'approval',
          });
          await base44.asServiceRole.entities.Task.update(approval.task_id, {
            execution_log: log,
          });
        }
      } else if (decision === 'rejected') {
        await base44.asServiceRole.entities.Task.update(approval.task_id, {
          status: 'cancelled',
        });
        if (approval.pipeline_run_id) {
          await base44.asServiceRole.entities.PipelineRun.update(approval.pipeline_run_id, {
            status: 'failed',
          });
        }
      }
    } catch (e) {
      console.log('Could not update task:', e.message);
    }
  }

  return Response.json({
    success: true,
    approval_id,
    decision,
    task_id: approval?.task_id,
  });
});