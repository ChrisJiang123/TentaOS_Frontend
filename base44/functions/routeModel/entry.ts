import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MODEL_CAPABILITIES = {
  "anthropic/claude-sonnet-4": {
    writing: 0.95, reasoning: 0.92, coding: 0.90, translation: 0.85, search: 0.80, simple: 0.85,
    speed: 0.60, cost_per_1k_tokens: 0.009,
    display_name: "Claude Sonnet 4",
    best_for: ["Long-form writing", "Deep analysis", "Complex reasoning", "Creative content"],
    tier: "premium"
  },
  "openai/gpt-4o": {
    writing: 0.88, reasoning: 0.90, coding: 0.92, translation: 0.93, search: 0.85, simple: 0.88,
    speed: 0.70, cost_per_1k_tokens: 0.00625,
    display_name: "GPT-4o",
    best_for: ["Multimodal", "Translation", "Tool calling", "General tasks"],
    tier: "standard"
  },
  "google/gemini-2.5-flash": {
    writing: 0.75, reasoning: 0.78, coding: 0.80, translation: 0.80, search: 0.92, simple: 0.90,
    speed: 0.95, cost_per_1k_tokens: 0.000375,
    display_name: "Gemini 2.5 Flash",
    best_for: ["Quick summary", "Data extraction", "Classification", "High throughput"],
    tier: "economy"
  },
  "deepseek/deepseek-chat": {
    writing: 0.82, reasoning: 0.88, coding: 0.93, translation: 0.75, search: 0.75, simple: 0.85,
    speed: 0.80, cost_per_1k_tokens: 0.00021,
    display_name: "DeepSeek Chat",
    best_for: ["Code generation", "Math", "Logic reasoning", "Best value"],
    tier: "economy"
  },
  "openai/gpt-4o-mini": {
    writing: 0.70, reasoning: 0.72, coding: 0.75, translation: 0.78, search: 0.75, simple: 0.88,
    speed: 0.92, cost_per_1k_tokens: 0.000375,
    display_name: "GPT-4o Mini",
    best_for: ["Simple tasks", "Classification", "Formatting", "Cost sensitive"],
    tier: "economy"
  },
  "google/gemini-2.5-pro": {
    writing: 0.90, reasoning: 0.91, coding: 0.88, translation: 0.88, search: 0.90, simple: 0.85,
    speed: 0.55, cost_per_1k_tokens: 0.005625,
    display_name: "Gemini 2.5 Pro",
    best_for: ["Long context", "Multi-step reasoning", "Research", "Data analysis"],
    tier: "premium"
  }
};

function classifyTask(description) {
  const desc = description.toLowerCase();
  const keywords = {
    writing: ["write", "draft", "article", "report", "blog", "essay", "文章", "撰写", "报告", "文案", "写", "content"],
    coding: ["code", "implement", "script", "debug", "function", "api", "代码", "编程", "函数", "bug", "program"],
    reasoning: ["analyze", "compare", "evaluate", "strategy", "分析", "推理", "比较", "评估", "策略", "plan"],
    translation: ["translate", "翻译", "转换", "中文", "英文", "language"],
    search: ["search", "find", "research", "look up", "搜索", "查找", "调研", "竞品", "market", "trend"],
    simple: ["classify", "tag", "format", "summarize", "分类", "标签", "格式化", "总结", "摘要", "list"],
  };

  const scores = {};
  for (const [type, words] of Object.entries(keywords)) {
    scores[type] = words.filter(w => desc.includes(w)).length;
  }
  const maxType = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return maxType[1] > 0 ? maxType[0] : "reasoning";
}

function estimateComplexity(description) {
  let score = 0.5;
  if (description.length > 300) score += 0.15;
  else if (description.length > 150) score += 0.08;
  if (/详细|深度|comprehensive|detailed|thorough|complete|全面/.test(description)) score += 0.15;
  if (/对比|多个|compare|multiple|versus|vs/.test(description)) score += 0.1;
  if (/简单|quick|简短|brief|short|simple/.test(description)) score -= 0.2;
  if (/step.by.step|multi|chain|pipeline/.test(description)) score += 0.1;
  return Math.max(0, Math.min(1, score));
}

function routeTask(description, budgetMode, estimatedTokens) {
  const taskType = classifyTask(description);
  const complexity = estimateComplexity(description);
  const tokens = estimatedTokens || 2000;

  const scores = {};
  for (const [model, caps] of Object.entries(MODEL_CAPABILITIES)) {
    const qualityScore = caps[taskType] || 0.7;
    const costScore = 1 - (caps.cost_per_1k_tokens / 0.01);
    const speedScore = caps.speed;

    let weights;
    if (budgetMode === 'minimum') weights = { quality: 0.15, cost: 0.65, speed: 0.2 };
    else if (budgetMode === 'maximum') weights = { quality: 0.75, cost: 0.05, speed: 0.2 };
    else weights = { quality: 0.5, cost: 0.3, speed: 0.2 };

    let score = qualityScore * weights.quality + costScore * weights.cost + speedScore * weights.speed;

    // Complexity gate — don't use weak models for hard tasks
    if (complexity > 0.7 && caps.tier === 'economy') score *= 0.4;
    if (complexity < 0.3 && caps.tier === 'premium') score *= 0.8; // overkill penalty

    scores[model] = score;
  }

  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([model, score]) => ({
      model,
      display_name: MODEL_CAPABILITIES[model].display_name,
      score: Math.round(score * 100),
      reason: MODEL_CAPABILITIES[model].best_for[0],
      estimated_cost: MODEL_CAPABILITIES[model].cost_per_1k_tokens * (tokens / 1000),
      best_for: MODEL_CAPABILITIES[model].best_for,
      tier: MODEL_CAPABILITIES[model].tier,
    }));

  const recommended = sorted[0];
  const explanation = "Task classified as '" + taskType + "' (complexity " + Math.round(complexity * 100) + "%). " +
    "Recommended " + recommended.display_name + " (score " + recommended.score + "/100, " + recommended.tier + " tier), " +
    "est. cost $" + recommended.estimated_cost.toFixed(4) + ". " +
    "Alternatives: " + sorted.slice(1, 3).map(a => a.display_name + " (" + a.score + ")").join(", ") + ".";

  return {
    recommended,
    alternatives: sorted.slice(1, 3),
    all_models: sorted,
    task_type: taskType,
    complexity,
    explanation,
    budget_mode: budgetMode || 'balanced',
  };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { description, budget_mode, estimated_tokens } = await req.json();
  if (!description) return Response.json({ error: 'description is required' }, { status: 400 });

  const result = routeTask(description, budget_mode, estimated_tokens);

  return Response.json({
    success: true,
    routing: result,
    available_models: Object.entries(MODEL_CAPABILITIES).map(([id, m]) => ({
      id,
      display_name: m.display_name,
      best_for: m.best_for,
      cost_per_1k: m.cost_per_1k_tokens,
      tier: m.tier,
    })),
  });
});