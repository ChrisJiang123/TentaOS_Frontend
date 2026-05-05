import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

const CHAT_INTERPRETER_PROMPT = `你是 TentaOS 的流水线设计师。用户会用自然语言描述他想让 AI 团队做的事。
你的任务是把它翻译成一个结构化的流水线定义。

输出格式（纯 JSON，不要 markdown 包裹）：

{
  "pipeline_name": "流水线名称",
  "description": "一句话描述",
  "steps": [
    {
      "step_id": "step_1",
      "role": "Researcher",
      "task": "搜集竞品信息",
      "recommended_model": "google/gemini-2.5-flash",
      "reason": "搜索类任务 Gemini 最快最便宜",
      "input_from": null,
      "output_type": "text",
      "estimated_tokens": 5000,
      "estimated_cost_usd": 0.01,
      "needs_search": true,
      "needs_approval": false
    }
  ],
  "total_estimated_cost_usd": 0.09,
  "estimated_duration_seconds": 120,
  "trigger": "manual"
}

重要规则：
1. 当 Researcher 步骤需要从互联网获取实时信息时，设置 needs_search: true。系统会自动调用实时网络搜索。
2. 对于高风险步骤（发送邮件、发布内容、花钱、删除数据、执行代码），设置 needs_approval: true。系统会暂停等待用户审批。
3. 每个步骤都必须包含 needs_search 和 needs_approval 字段。

模型选择指南（你必须遵循）：
- 搜索/检索/快速摘要 → google/gemini-2.5-flash（最快最便宜）
- 长文写作/分析/推理 → anthropic/claude-sonnet-4（写作质量最高）
- 代码生成/调试 → openai/gpt-4o 或 deepseek/deepseek-chat
- 翻译/多语言 → openai/gpt-4o（多语言最强）
- 数学/逻辑/事实检查 → deepseek/deepseek-chat（性价比最高）
- 简单分类/标签/格式化 → openai/gpt-4o-mini（最便宜）
- 审核/质检 → anthropic/claude-sonnet-4

角色可选值：Planner, Researcher, Writer, Coder, Reviewer, Operator

如果用户指定了要用某个模型，尊重用户的选择。
如果用户说"用最便宜的"，全部用 deepseek/deepseek-chat 或 openai/gpt-4o-mini。
如果用户说"用最好的"，全部用 anthropic/claude-sonnet-4。
通常生成 3-6 个步骤的工作流。`;

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
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error("OpenRouter API error: " + response.status + " " + err);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message, budget_mode } = await req.json();
  if (!message) {
    return Response.json({ error: 'message is required' }, { status: 400 });
  }

  let budgetHint = '';
  if (budget_mode === 'minimum') budgetHint = '\n\n用户偏好：用最便宜的模型。';
  else if (budget_mode === 'maximum') budgetHint = '\n\n用户偏好：用最好的模型，不考虑成本。';

  const result = await callOpenRouter(
    "anthropic/claude-sonnet-4",
    CHAT_INTERPRETER_PROMPT,
    message + budgetHint
  );

  // Strip markdown code blocks if present
  let pipelineText = result.trim();
  if (pipelineText.startsWith('```')) {
    pipelineText = pipelineText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }
  const pipeline = JSON.parse(pipelineText);

  return Response.json({
    success: true,
    pipeline: pipeline
  });
});