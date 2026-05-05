import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trigger_id, payload } = await req.json();

    if (!trigger_id) {
      return Response.json({ error: 'trigger_id is required' }, { status: 400 });
    }

    const triggers = await base44.entities.WorkflowTrigger.filter({ id: trigger_id });
    const trigger = triggers[0];

    if (!trigger) {
      return Response.json({ error: 'Trigger not found' }, { status: 404 });
    }
    if (!trigger.is_active) {
      return Response.json({ error: 'Trigger is disabled' }, { status: 400 });
    }

    const template = trigger.task_template || {};
    const task = await base44.entities.Task.create({
      title: template.title || `Auto: ${trigger.name}`,
      goal: template.goal || `Triggered by ${trigger.trigger_type}: ${trigger.name}`,
      status: 'queued',
      priority: template.priority || 'medium',
      pack: 'custom',
      assigned_agents: trigger.agent_id ? [trigger.agent_id] : [],
      steps_completed: 0,
      steps_total: 0,
      timeline: [{
        timestamp: new Date().toISOString(),
        agent: 'system',
        action: 'trigger_fired',
        detail: `Trigger "${trigger.name}" (${trigger.trigger_type}) fired` + (payload ? ` with payload: ${JSON.stringify(payload).slice(0, 200)}` : ''),
        type: 'info'
      }]
    });

    await base44.entities.WorkflowTrigger.update(trigger.id, {
      last_triggered: new Date().toISOString(),
      trigger_count: (trigger.trigger_count || 0) + 1
    });

    try {
      await base44.functions.invoke('runTask', { task_id: task.id });
    } catch (e) {
      console.log('runTask skipped:', e.message);
    }

    return Response.json({
      success: true,
      task_id: task.id,
      trigger_name: trigger.name,
      message: `Task "${task.title}" created from trigger "${trigger.name}"`
    });
  } catch (error) {
    console.error('processTrigger error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});