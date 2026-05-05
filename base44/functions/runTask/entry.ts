import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

const MODEL_PRICING = {
  "anthropic/claude-sonnet-4": { input: 3.0, output: 15.0 },
  "openai/gpt-4o": { input: 2.5, output: 10.0 },
  "openai/gpt-4o-mini": { input: 0.15, output: 0.60 },
  "google/gemini-2.5-flash": { input: 0.15, output: 0.60 },
  "google/gemini-2.5-pro": { input: 1.25, output: 10.0 },
  "deepseek/deepseek-chat": { input: 0.14, output: 0.28 },
};

const FALLBACK_CHAINS = {
  "anthropic/claude-sonnet-4": ["openai/gpt-4o", "deepseek/deepseek-chat"],
  "openai/gpt-4o": ["anthropic/claude-sonnet-4", "deepseek/deepseek-chat"],
  "google/gemini-2.5-flash": ["openai/gpt-4o-mini", "deepseek/deepseek-chat"],
  "deepseek/deepseek-chat": ["openai/gpt-4o-mini", "google/gemini-2.5-flash"],
  "openai/gpt-4o-mini": ["deepseek/deepseek-chat", "google/gemini-2.5-flash"],
};

const DEFAULT_AGENT_PROMPTS = {
  "Planner": "You are a project planner. Break down complex goals into actionable steps. Be specific and practical.",
  "Researcher": "You are a research analyst. Collect, organize, and verify information. Provide sources and data. Do not fabricate information.",
  "Writer": "You are a professional writer. Transform input into clear, persuasive text. Focus on structure and readability.",
  "Coder": "You are a software engineer. Write clean, runnable, well-commented code. Include error handling.",
  "Reviewer": "You are a quality reviewer. Check for accuracy, logic gaps, and quality issues. Suggest fixes.",
  "Operator": "You are an operations expert. Execute specific actions. Output concrete executable steps.",
};

const HIGH_COST_THRESHOLD = 0.05;

function calculateCost(model, usage) {
  const price = MODEL_PRICING[model] || { input: 1.0, output: 3.0 };
  const pt = usage?.prompt_tokens || 0;
  const ct = usage?.completion_tokens || 0;
  return (pt * price.input / 1_000_000) + (ct * price.output / 1_000_000);
}

async function callOpenRouter(model, systemPrompt, userPrompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + OPENROUTER_API_KEY,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://tentaos.com",
      "X-Title": "TentaOS"
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error("OpenRouter " + model + ": " + response.status + " " + err);
  }
  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    model: data.model || model
  };
}

async function callWithFallback(model, systemPrompt, userPrompt, maxRetries) {
  const retries = maxRetries || 2;
  let lastError = null;
  
  // Try primary model with retries
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await callOpenRouter(model, systemPrompt, userPrompt);
      result.retry_count = attempt;
      result.fallback_used = false;
      return result;
    } catch (err) {
      lastError = err;
      console.log("Attempt " + (attempt + 1) + " failed for " + model + ": " + err.message);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  
  // Try fallback chain
  const fallbacks = FALLBACK_CHAINS[model] || ["openai/gpt-4o-mini"];
  for (const fb of fallbacks) {
    try {
      console.log("Trying fallback: " + fb);
      const result = await callOpenRouter(fb, systemPrompt, userPrompt);
      result.fallback_used = true;
      result.original_model = model;
      result.retry_count = 0;
      return result;
    } catch (e) {
      console.log("Fallback failed: " + fb + " - " + e.message);
    }
  }
  throw new Error("All models failed. Last: " + lastError.message);
}

async function performWebSearch(base44, query) {
  console.log("Web search: " + query);
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: 'Search the internet for the most recent and relevant information about: "' + query + '"\n\nReturn results as JSON with:\n- answer: comprehensive summary (2-3 paragraphs)\n- results: array of top 5 findings with title, source, content (100-200 words), date\n\nFocus on REAL, CURRENT information. Cite sources. Today is ' + new Date().toISOString().split('T')[0] + '.',
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        answer: { type: 'string' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              source: { type: 'string' },
              content: { type: 'string' },
              date: { type: 'string' }
            }
          }
        }
      }
    }
  });
  return result;
}

function addLog(logs, level, agent, action, detail, extra) {
  logs.push({
    timestamp: new Date().toISOString(),
    level: level,
    agent: agent,
    action: action,
    detail: (detail || '').substring(0, 1000),
    type: extra?.type || 'info',
    model: extra?.model || '',
    tokens: extra?.tokens || 0,
    cost: extra?.cost || 0,
    input_preview: (extra?.input_preview || '').substring(0, 300),
    output_preview: (extra?.output_preview || '').substring(0, 500),
    fallback: extra?.fallback || null,
  });
}

async function checkApprovalNeeded(base44, task, step, stepCost, pipelineRunId) {
  // Check if step needs approval based on cost or action type
  const needsApproval = step.needs_approval || stepCost > HIGH_COST_THRESHOLD;
  if (!needsApproval) return false;
  
  // Create approval record
  await base44.asServiceRole.entities.Approval.create({
    task_id: task.id,
    task_title: task.title,
    pipeline_run_id: pipelineRunId,
    step_id: step.step_id,
    step_index: step._index,
    action_type: stepCost > HIGH_COST_THRESHOLD ? 'high_cost' : 'critical_action',
    summary: step.role + ': ' + step.task,
    risk_level: stepCost > 0.1 ? 'high' : 'medium',
    preview_data: 'Model: ' + step.recommended_model + '\nEstimated cost: $' + (step.estimated_cost_usd || 0).toFixed(4),
    estimated_cost: stepCost,
    status: 'pending',
    agent_name: step.role,
    model_used: step.recommended_model,
  });
  
  // Update task and pipeline status
  await base44.asServiceRole.entities.Task.update(task.id, {
    status: 'awaiting_approval',
    current_step_index: step._index,
  });
  
  await base44.asServiceRole.entities.PipelineRun.update(pipelineRunId, {
    status: 'awaiting_approval',
  });
  
  return true;
}

async function waitForApproval(base44, taskId, stepId, maxWaitMs) {
  const maxWait = maxWaitMs || 300000; // 5 min default
  const start = Date.now();
  const pollInterval = 3000;
  
  while (Date.now() - start < maxWait) {
    const approvals = await base44.asServiceRole.entities.Approval.filter({
      task_id: taskId,
      step_id: stepId,
    });
    const approval = approvals[0];
    if (!approval) return 'approved'; // no approval needed
    
    if (approval.status === 'approved' || approval.status === 'auto_approved') return 'approved';
    if (approval.status === 'rejected') return 'rejected';
    if (approval.status === 'revision_requested') return 'revision';
    
    await new Promise(r => setTimeout(r, pollInterval));
  }
  return 'expired';
}

Deno.serve(async (req) => {
  let taskId = null;
  let base44 = null;

  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    taskId = body.task_id;
    const pipelineData = body.pipeline;
    const resumeFromStep = body.resume_from_step; // For resuming after approval

    if (!taskId) return Response.json({ error: 'task_id is required' }, { status: 400 });

    const tasks = await base44.asServiceRole.entities.Task.filter({ id: taskId });
    const task = tasks[0];
    if (!task) return Response.json({ error: 'Task not found' }, { status: 404 });

    const executionLog = task.execution_log || [];

    // Update status to planning
    await base44.asServiceRole.entities.Task.update(taskId, {
      status: 'planning',
      started_at: task.started_at || new Date().toISOString(),
    });

    addLog(executionLog, 'info', 'System', 'Task Started', 'Initializing pipeline for: ' + task.goal, { type: 'think' });

    // Step 1: Generate or use provided pipeline
    let pipeline;
    if (pipelineData && pipelineData.steps) {
      pipeline = pipelineData;
      addLog(executionLog, 'info', 'Planner', 'Pipeline Loaded', 'Using pre-designed pipeline: ' + (pipeline.pipeline_name || 'custom'), { type: 'think' });
    } else {
      addLog(executionLog, 'info', 'Planner', 'Designing Pipeline', 'Analyzing goal and generating execution plan...', { type: 'think' });
      const interpreterResult = await callWithFallback(
        "anthropic/claude-sonnet-4",
        'You are TentaOS pipeline designer. Given a user goal, create a structured pipeline JSON.\nOutput ONLY valid JSON. The JSON must have: pipeline_name, description, steps array.\nEach step: step_id, role (Planner/Researcher/Writer/Coder/Reviewer/Operator), task, recommended_model, reason, input_from (null or previous step_id), output_type, estimated_tokens, estimated_cost_usd, needs_search (boolean), needs_approval (boolean for high-risk actions).\nModel guide: search->google/gemini-2.5-flash, writing->anthropic/claude-sonnet-4, code->deepseek/deepseek-chat, translation->openai/gpt-4o, simple->openai/gpt-4o-mini, review->anthropic/claude-sonnet-4.\nGenerate 3-6 steps. Output ONLY the JSON object.',
        "Goal: " + task.goal,
        2
      );
      let pipelineText = interpreterResult.content.trim();
      if (pipelineText.startsWith('```')) {
        pipelineText = pipelineText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      }
      pipeline = JSON.parse(pipelineText);
      addLog(executionLog, 'info', 'Planner', 'Pipeline Designed', pipeline.pipeline_name + ' — ' + pipeline.steps.length + ' steps, est $' + (pipeline.total_estimated_cost_usd || 0).toFixed(3), { type: 'output', model: interpreterResult.model });
    }

    // Create PipelineRun
    const pipelineRun = await base44.asServiceRole.entities.PipelineRun.create({
      task_id: taskId,
      pipeline_name: pipeline.pipeline_name || task.title,
      description: pipeline.description || '',
      mode: pipeline.mode || 'sequential',
      status: 'running',
      steps: pipeline.steps.map(s => ({ ...s, status: 'pending', output: '', tokens_used: 0, cost_usd: 0, duration_ms: 0, retry_count: 0 })),
      estimated_cost_usd: pipeline.total_estimated_cost_usd || 0,
      model_routing_mode: 'balanced',
    });

    const workflowNodes = pipeline.steps.map((step, i) => ({
      id: step.step_id || "step_" + (i + 1),
      label: step.task || 'Step ' + (i + 1),
      agent: step.role || 'Planner',
      model: step.recommended_model || 'auto',
      status: 'queued',
      duration_ms: 0,
      tokens: 0,
      cost: 0,
      retry_count: 0,
      error_message: '',
    }));

    await base44.asServiceRole.entities.Task.update(taskId, {
      status: 'running',
      steps_total: pipeline.steps.length,
      steps_completed: 0,
      estimated_cost: pipeline.total_estimated_cost_usd || 0,
      workflow_nodes: workflowNodes,
      workflow_id: pipelineRun.id,
      execution_log: executionLog,
    });

    // Step 2: Execute steps
    let totalTokens = 0;
    let totalCost = 0;
    const stepResults = {};
    const pipelineSteps = [...pipeline.steps];
    const startIndex = resumeFromStep || 0;

    for (let i = startIndex; i < pipelineSteps.length; i++) {
      const step = pipelineSteps[i];
      const stepId = step.step_id || "step_" + (i + 1);
      const role = step.role || 'Planner';
      const model = step.recommended_model || 'openai/gpt-4o-mini';
      step._index = i;

      // Check if approval is needed
      if (task.approval_required && step.needs_approval) {
        const blocked = await checkApprovalNeeded(base44, task, step, step.estimated_cost_usd || 0, pipelineRun.id);
        if (blocked) {
          addLog(executionLog, 'warn', role, 'Awaiting Approval', 'Step paused — waiting for human approval', { type: 'approval' });
          await base44.asServiceRole.entities.Task.update(taskId, { execution_log: executionLog });
          
          const decision = await waitForApproval(base44, taskId, stepId, 300000);
          if (decision === 'rejected') {
            addLog(executionLog, 'error', 'System', 'Step Rejected', 'Human rejected this step. Skipping.', { type: 'error' });
            workflowNodes[i].status = 'failed';
            workflowNodes[i].error_message = 'Rejected by user';
            await base44.asServiceRole.entities.Task.update(taskId, {
              workflow_nodes: workflowNodes,
              execution_log: executionLog,
            });
            continue;
          }
          if (decision === 'expired') {
            addLog(executionLog, 'warn', 'System', 'Approval Expired', 'Proceeding with auto-approval after timeout', { type: 'info' });
          }
          // Approved — continue
          await base44.asServiceRole.entities.Task.update(taskId, { status: 'running' });
          await base44.asServiceRole.entities.PipelineRun.update(pipelineRun.id, { status: 'running' });
        }
      }

      // Mark step running
      workflowNodes[i].status = 'running';
      addLog(executionLog, 'info', role, 'Step Started', step.task, { type: 'think', model: model });
      await base44.asServiceRole.entities.Task.update(taskId, {
        workflow_nodes: workflowNodes,
        execution_log: executionLog,
        current_step_index: i,
      });

      // Build input context
      let inputContext = '';
      if (step.input_from && stepResults[step.input_from]) {
        inputContext = "\n\nInput from previous step:\n" + stepResults[step.input_from];
      } else if (i > 0) {
        const prevId = pipelineSteps[i - 1].step_id || "step_" + i;
        if (stepResults[prevId]) {
          inputContext = "\n\nPrevious step output:\n" + stepResults[prevId];
        }
      }

      // Load custom agent prompt
      let systemPrompt = DEFAULT_AGENT_PROMPTS[role] || DEFAULT_AGENT_PROMPTS["Planner"];
      let agentTemp = 0.7;
      let agentRetries = task.max_retries || 2;
      try {
        const userAgents = await base44.asServiceRole.entities.Agent.filter({ role: role.toLowerCase() });
        const activeAgent = userAgents.find(a => a.is_active && a.system_prompt);
        if (activeAgent) {
          if (activeAgent.system_prompt) systemPrompt = activeAgent.system_prompt;
          if (activeAgent.temperature) agentTemp = activeAgent.temperature;
          if (activeAgent.max_retries) agentRetries = activeAgent.max_retries;
        }
      } catch (_) {}

      // Web search for Researcher
      let searchContext = '';
      if (role === 'Researcher' && step.needs_search !== false) {
        try {
          addLog(executionLog, 'info', role, 'Web Search', 'Searching internet for: ' + step.task.substring(0, 100), { type: 'tool_call' });
          const searchResults = await performWebSearch(base44, step.task + " " + task.goal);
          if (searchResults && searchResults.results) {
            searchContext = "\n\n=== REAL-TIME WEB SEARCH RESULTS ===\n";
            searchContext += "Summary: " + (searchResults.answer || '') + "\n\n";
            searchResults.results.forEach(function(r, idx) {
              searchContext += "[" + (idx + 1) + "] " + (r.title || '') + " (" + (r.source || '') + ")\n" + (r.content || '') + "\n\n";
            });
            searchContext += "=== END SEARCH RESULTS ===\nIMPORTANT: Use ONLY real information above. Cite sources [1][2] etc.\n";
            addLog(executionLog, 'info', role, 'Search Complete', searchResults.results.length + ' results found', { type: 'tool_call' });
          }
        } catch (searchErr) {
          addLog(executionLog, 'warn', role, 'Search Failed', searchErr.message, { type: 'error' });
        }
      }

      const userPrompt = "Task: " + step.task + "\n\nOverall goal: " + task.goal + searchContext + inputContext;

      // Execute with retry + fallback
      const startTime = Date.now();
      let result;
      try {
        result = await callWithFallback(model, systemPrompt, userPrompt, agentRetries);
      } catch (err) {
        // Step failed completely
        workflowNodes[i].status = 'failed';
        workflowNodes[i].error_message = err.message;
        addLog(executionLog, 'error', role, 'Step Failed', err.message, { type: 'error', model: model });
        
        await base44.asServiceRole.entities.Task.update(taskId, {
          workflow_nodes: workflowNodes,
          execution_log: executionLog,
        });
        continue; // Skip to next step instead of failing entire pipeline
      }
      const durationMs = Date.now() - startTime;
      const stepCost = calculateCost(result.model || model, result.usage);
      const stepTokens = result.usage?.total_tokens || 0;

      totalTokens += stepTokens;
      totalCost += stepCost;
      stepResults[stepId] = result.content;

      // Update node
      workflowNodes[i].status = 'completed';
      workflowNodes[i].duration_ms = durationMs;
      workflowNodes[i].tokens = stepTokens;
      workflowNodes[i].cost = parseFloat(stepCost.toFixed(6));
      workflowNodes[i].model = result.model || model;
      workflowNodes[i].retry_count = result.retry_count || 0;

      addLog(executionLog, 'info', role, step.task, result.content.substring(0, 500), {
        type: role === 'Researcher' ? 'tool_call' : 'output',
        model: result.model || model,
        tokens: stepTokens,
        cost: parseFloat(stepCost.toFixed(6)),
        input_preview: userPrompt.substring(0, 300),
        output_preview: result.content.substring(0, 500),
        fallback: result.fallback_used ? "Fallback from " + result.original_model : null,
      });

      // Update pipeline run
      const updatedSteps = pipelineSteps.map((s, idx) => ({
        ...s,
        status: idx <= i ? (workflowNodes[idx].status) : 'pending',
        output: idx <= i ? (stepResults[s.step_id || "step_" + (idx + 1)] || '').substring(0, 2000) : '',
        model_used: idx <= i ? workflowNodes[idx].model : '',
        tokens_used: idx <= i ? workflowNodes[idx].tokens : 0,
        cost_usd: idx <= i ? workflowNodes[idx].cost : 0,
        duration_ms: idx <= i ? workflowNodes[idx].duration_ms : 0,
        fallback_used: idx === i ? !!result.fallback_used : false,
        retry_count: idx === i ? (result.retry_count || 0) : 0,
      }));

      await base44.asServiceRole.entities.PipelineRun.update(pipelineRun.id, {
        steps: updatedSteps,
        total_tokens: totalTokens,
        total_cost_usd: parseFloat(totalCost.toFixed(6)),
      });

      await base44.asServiceRole.entities.Task.update(taskId, {
        steps_completed: i + 1,
        workflow_nodes: workflowNodes,
        execution_log: executionLog,
        tokens_used: totalTokens,
        actual_cost: parseFloat(totalCost.toFixed(4)),
      });

      // Update agent stats
      try {
        const agents = await base44.asServiceRole.entities.Agent.filter({ role: role.toLowerCase() });
        if (agents[0]) {
          await base44.asServiceRole.entities.Agent.update(agents[0].id, {
            total_tokens: (agents[0].total_tokens || 0) + stepTokens,
            total_cost: parseFloat(((agents[0].total_cost || 0) + stepCost).toFixed(4)),
          });
        }
      } catch (_) {}
    }

    // Complete
    const completedCount = workflowNodes.filter(n => n.status === 'completed').length;
    const failedCount = workflowNodes.filter(n => n.status === 'failed').length;
    const totalDuration = Date.now() - new Date(task.started_at || Date.now()).getTime();

    await base44.asServiceRole.entities.PipelineRun.update(pipelineRun.id, {
      status: failedCount === pipelineSteps.length ? 'failed' : 'completed',
      duration_ms: totalDuration,
      total_tokens: totalTokens,
      total_cost_usd: parseFloat(totalCost.toFixed(6)),
    });

    addLog(executionLog, 'info', 'System', 'Pipeline Complete', completedCount + '/' + pipelineSteps.length + ' steps completed. ' + totalTokens + ' tokens, $' + totalCost.toFixed(4) + (failedCount > 0 ? '. ' + failedCount + ' step(s) failed.' : ''), { type: 'output' });

    const artifacts = Object.entries(stepResults)
      .filter(([_, output]) => output && output.length > 100)
      .map(([stepId, _]) => ({ title: stepId + " output", type: 'text', url: '' }));

    await base44.asServiceRole.entities.Task.update(taskId, {
      status: failedCount === pipelineSteps.length ? 'failed' : 'completed',
      completed_at: new Date().toISOString(),
      steps_completed: completedCount,
      workflow_nodes: workflowNodes,
      execution_log: executionLog,
      tokens_used: totalTokens,
      actual_cost: parseFloat(totalCost.toFixed(4)),
      artifacts: artifacts.length > 0 ? artifacts : undefined,
    });

    // Update agent task counts
    try {
      const agentRoles = [...new Set(pipelineSteps.map(s => s.role?.toLowerCase()))];
      for (const role of agentRoles) {
        const agents = await base44.asServiceRole.entities.Agent.filter({ role });
        if (agents[0]) {
          await base44.asServiceRole.entities.Agent.update(agents[0].id, {
            tasks_completed: (agents[0].tasks_completed || 0) + 1,
          });
        }
      }
    } catch (_) {}

    return Response.json({
      success: true,
      task_id: taskId,
      pipeline_run_id: pipelineRun.id,
      steps_completed: completedCount,
      steps_failed: failedCount,
      total_tokens: totalTokens,
      total_cost: totalCost,
    });

  } catch (error) {
    console.error("runTask error:", error.message);
    if (taskId && base44) {
      try {
        await base44.asServiceRole.entities.Task.update(taskId, {
          status: 'failed',
          execution_log: [{
            timestamp: new Date().toISOString(),
            level: 'error',
            agent: 'System',
            action: 'Fatal Error',
            detail: error.message,
            type: 'error',
          }],
        });
      } catch (_) {}
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});