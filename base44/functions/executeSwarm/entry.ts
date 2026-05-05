import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

const MODEL_PRICING = {
  "anthropic/claude-sonnet-4": { input: 3.0, output: 15.0 },
  "openai/gpt-4o": { input: 2.5, output: 10.0 },
  "openai/gpt-4o-mini": { input: 0.15, output: 0.60 },
  "google/gemini-2.5-flash": { input: 0.15, output: 0.60 },
  "deepseek/deepseek-chat": { input: 0.14, output: 0.28 },
};

function calculateCost(model, usage) {
  const price = MODEL_PRICING[model] || { input: 1.0, output: 3.0 };
  return ((usage?.prompt_tokens || 0) * price.input / 1_000_000) + ((usage?.completion_tokens || 0) * price.output / 1_000_000);
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
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error("OpenRouter " + model + ": " + response.status);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    model: data.model || model,
  };
}

// Swarm execution: parallel candidates + critic ranking
async function executeSwarm(task, models, keepTopN) {
  const candidates = await Promise.all(
    models.map(async (model, index) => {
      const prompt = task + "\n\nYou are candidate #" + (index + 1) + ". Provide a unique, differentiated approach.";
      const result = await callOpenRouter(model, "You are a strategic consultant. Provide creative and practical solutions.", prompt);
      const cost = calculateCost(result.model, result.usage);
      return {
        candidate_id: "candidate_" + (index + 1),
        model_used: result.model,
        model_display: model,
        content: result.content,
        tokens_used: result.usage?.total_tokens || 0,
        cost_usd: cost,
        preview: result.content.substring(0, 300),
      };
    })
  );

  // Critic ranking using Claude
  const criticPrompt = "You are an expert evaluator. Below are " + candidates.length + " candidate proposals.\n" +
    "Rate each on: Feasibility (1-10), Innovation (1-10), Cost-effectiveness (1-10), Risk (1-10 lower=riskier).\n" +
    "Return JSON: { \"rankings\": [{ \"candidate_index\": 0, \"total_score\": 85, \"feasibility\": 8, \"innovation\": 9, \"cost_effectiveness\": 8, \"risk\": 7, \"reason\": \"...\" }] }\n\n" +
    candidates.map((c, i) => "=== Candidate #" + (i + 1) + " (Model: " + c.model_display + ") ===\n" + c.content).join("\n\n");

  const criticResult = await callOpenRouter(
    "anthropic/claude-sonnet-4",
    "You are a strict evaluator. Output only valid JSON.",
    criticPrompt
  );

  let rankings;
  try {
    let criticText = criticResult.content.trim();
    if (criticText.startsWith('```')) {
      criticText = criticText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }
    rankings = JSON.parse(criticText);
  } catch (e) {
    // If parsing fails, return all candidates
    return { candidates, rankings: null, critic_cost: 0 };
  }

  const criticCost = calculateCost("anthropic/claude-sonnet-4", criticResult.usage);
  const sortedRankings = (rankings.rankings || []).sort((a, b) => b.total_score - a.total_score);
  const topIndices = sortedRankings.slice(0, keepTopN || 2).map(r => r.candidate_index);
  const winners = topIndices.map(i => candidates[i]).filter(Boolean);

  return {
    candidates,
    rankings: sortedRankings,
    winners,
    critic_cost: criticCost,
    critic_tokens: criticResult.usage?.total_tokens || 0,
  };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { task_id, task_description, models, keep_top_n } = await req.json();
  if (!task_description) {
    return Response.json({ error: 'task_description is required' }, { status: 400 });
  }

  const swarmModels = models || [
    "anthropic/claude-sonnet-4",
    "openai/gpt-4o",
    "deepseek/deepseek-chat",
    "google/gemini-2.5-flash",
    "openai/gpt-4o-mini"
  ];

  const result = await executeSwarm(task_description, swarmModels, keep_top_n || 2);

  const totalCost = result.candidates.reduce((s, c) => s + c.cost_usd, 0) + (result.critic_cost || 0);
  const totalTokens = result.candidates.reduce((s, c) => s + c.tokens_used, 0) + (result.critic_tokens || 0);

  // Update task if provided
  if (task_id) {
    try {
      await base44.asServiceRole.entities.Task.update(task_id, {
        tokens_used: totalTokens,
        actual_cost: parseFloat(totalCost.toFixed(4)),
      });
    } catch (e) { /* ignore */ }
  }

  return Response.json({
    success: true,
    swarm_result: result,
    total_cost: totalCost,
    total_tokens: totalTokens,
  });
});