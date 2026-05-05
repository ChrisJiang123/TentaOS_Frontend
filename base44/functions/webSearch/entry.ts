import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { query, max_results = 5 } = await req.json();
  if (!query) {
    return Response.json({ error: 'query is required' }, { status: 400 });
  }

  // Use Base44's built-in InvokeLLM with add_context_from_internet
  // This uses Gemini which has web search grounding — no external API key needed
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Search the internet for the most recent and relevant information about: "${query}"

Return the results as structured JSON with:
- answer: A comprehensive summary of findings (2-3 paragraphs)
- results: An array of the top ${max_results} most relevant findings, each with:
  - title: The headline/title
  - source: The source name or URL if available
  - content: A detailed summary (100-200 words)
  - date: Publication date if known, otherwise "recent"

Focus on:
1. Only use REAL, CURRENT information from the internet
2. Include specific dates, numbers, and facts
3. Cite sources whenever possible
4. Prioritize the most recent information

Today's date is ${new Date().toISOString().split('T')[0]}.`,
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

  return Response.json({
    success: true,
    answer: result.answer || '',
    results: result.results || []
  });
});