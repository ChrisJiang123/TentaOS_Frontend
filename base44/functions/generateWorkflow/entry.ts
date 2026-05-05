import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description, pack } = await req.json();
    if (!description) {
      return Response.json({ error: 'description is required' }, { status: 400 });
    }

    // Use LLM to generate a workflow
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a workflow architect for TentaOS, an AI operating system.

Generate a workflow from this description: "${description}"

Available agent roles: planner, researcher, coder, writer, operator, reviewer
Available tools: web_search, browser, code_executor, file_manager, doc_generator, http_client

Create a workflow with:
1. A descriptive name
2. 3-6 nodes, each with an agent, model, and tools
3. Edges connecting the nodes in execution order

Each node needs: id, type (agent/tool/approval), label, agent role, model suggestion, tools array, and position (x, y coordinates spread across the canvas).

Return a JSON with: name, description, nodes array, edges array.`,
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          nodes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                type: { type: "string" },
                label: { type: "string" },
                agent: { type: "string" },
                model: { type: "string" },
                tools: { type: "array", items: { type: "string" } },
                position: {
                  type: "object",
                  properties: {
                    x: { type: "number" },
                    y: { type: "number" }
                  }
                }
              }
            }
          },
          edges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                source: { type: "string" },
                target: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Save to database
    const workflow = await base44.asServiceRole.entities.Workflow.create({
      name: result.name || 'AI Generated Workflow',
      description: result.description || description,
      nodes: result.nodes || [],
      edges: result.edges || [],
      is_template: false,
      source: 'ai_generated',
      pack: pack || 'custom',
    });

    return Response.json({ success: true, workflow });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});