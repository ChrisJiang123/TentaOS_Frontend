// @ts-nocheck
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Workflow, Play, Save, Plus, Sparkles, Bot, Wrench, GitBranch, UserCheck, ScanSearch, Maximize, Trash2, ShieldCheck, FlaskConical } from 'lucide-react';
import useSEO from '@/lib/useSEO';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DraggableNode from '../components/pipeline/DraggableNode';
import CanvasEdges from '../components/pipeline/CanvasEdges';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  cortexPipelineTemplateDeploymentHealthCheck,
  cortexPipelineWorkflowsMock,
} from '@/data/tentaosDashboardMock';
import {
  dryRunPipeline as apiDryRunPipeline,
  getPipelineNodes,
  getPipelineTemplates,
  validatePipeline as apiValidatePipeline,
} from '@/lib/tentaosDashboardApi';
import { useToast } from '@/components/ui/use-toast';

const PIPELINE_LOCAL_STORAGE_KEY = 'tentaos-pipeline-local-draft-v1';

const PALETTE = [
  {
    type: 'cortex_step',
    label: 'Cortex Step',
    icon: Bot,
    color: '#38BDF8',
    subtitle: 'Planning or reasoning step',
    tooltip: 'Reads projected task state and proposes next action.',
  },
  {
    type: 'tool_tentacle',
    label: 'Tool Tentacle',
    icon: Wrench,
    color: '#34D399',
    subtitle: 'Local action unit',
    tooltip: 'Executes local action with sensor feedback.',
  },
  {
    type: 'sucker_sensor',
    label: 'Sucker Sensor',
    icon: ScanSearch,
    color: '#22D3EE',
    subtitle: 'Probe local evidence',
    tooltip: 'Collects evidence before action.',
  },
  {
    type: 'coherence_gate',
    label: 'Coherence Gate',
    icon: GitBranch,
    color: '#FBBF24',
    subtitle: 'Branch by state or risk',
    tooltip: 'Validates state before commit.',
  },
  {
    type: 'human_approval',
    label: 'Human Approval',
    icon: UserCheck,
    color: '#F87171',
    subtitle: 'Pause for review',
    tooltip: 'Pauses execution for sensitive actions.',
  },
];

function WorkflowCard({ workflow, onSelect, isSelected }) {
  return (
    <button
      onClick={() => onSelect(workflow)}
      className={cn(
        "w-full text-left p-3 rounded-xl border transition-all",
        isSelected
          ? "bg-sky-400/[0.06] border-sky-400/20"
          : "bg-slate-800/40 border-slate-500/10 hover:bg-slate-800/60"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Workflow className={cn("w-3.5 h-3.5", isSelected ? "text-sky-400/90" : "text-slate-500")} />
        <h3 className="text-xs font-medium text-slate-100 truncate">{workflow.name}</h3>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded capitalize",
          workflow.pack === 'growth' ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'
        )}>
          {workflow.pack}
        </span>
        <span className="text-[10px] text-slate-500">{workflow.nodes?.length || 0} nodes</span>
      </div>
    </button>
  );
}

export default function PipelineStudio() {
  const { toast } = useToast();
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [localNodes, setLocalNodes] = useState(null); // local override for dragging
  const [isGenerating, setIsGenerating] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastValidation, setLastValidation] = useState(null);
  const [lastDryRun, setLastDryRun] = useState(null);
  const panRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
  const canvasRef = useRef(null);

  useSEO({
    title: 'Cortex Pipeline — TentaOS',
    description: 'Design task execution paths with Cortex steps, tool tentacles, and coherence gates in TentaOS.',
    keywords: 'TentaOS, Cortex Pipeline, workflow, agents',
  });

  const { data: pipelineBootstrap } = useQuery({
    queryKey: ['pipeline-bootstrap'],
    queryFn: async () => {
      const [templatesRes, nodesRes] = await Promise.all([getPipelineTemplates(), getPipelineNodes()]);
      return { templatesRes, nodesRes };
    },
  });
  const workflows = pipelineBootstrap?.templatesRes?.data?.templates?.length
    ? pipelineBootstrap.templatesRes.data.templates
    : cortexPipelineWorkflowsMock;
  const pipelineBootstrapError =
    pipelineBootstrap?.templatesRes?.error || pipelineBootstrap?.nodesRes?.error || null;

  const saveWorkflow = useMutation({
    mutationFn: async ({ workflowId, name, nodes: nodesToSave, edges: edgesToSave }) => {
      const payload = {
        version: 1,
        savedAt: new Date().toISOString(),
        workflowId,
        name,
        nodes: nodesToSave,
        edges: edgesToSave,
      };
      try {
        localStorage.setItem(PIPELINE_LOCAL_STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        throw new Error(e?.message || 'localStorage write failed');
      }
      return payload;
    },
    onSuccess: () => {
      toast({
        title: 'Pipeline saved locally.',
        description: 'Draft stored in this browser only — not sent to the server.',
      });
    },
    onError: (e) => {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: e instanceof Error ? e.message : String(e),
      });
    },
  });

  const activeWorkflow = selectedWorkflow || workflows[0];
  const nodes = localNodes || activeWorkflow?.nodes || [];
  const edges = activeWorkflow?.edges || [];

  const paletteByType = useMemo(() => {
    const map = new Map();
    PALETTE.forEach((p) => map.set(p.type, p));
    return map;
  }, []);

  // When switching workflow, reset local state
  const handleSelectWorkflow = (wf) => {
    setSelectedWorkflow(wf);
    setLocalNodes(null);
    setSelectedNodeId(null);
    setLastValidation(null);
    setLastDryRun(null);
  };

  const handleNodeMove = useCallback((nodeId, pos) => {
    setLocalNodes(prev => {
      const current = prev || activeWorkflow?.nodes || [];
      return current.map(n =>
        n.id === nodeId ? { ...n, position: { x: Math.round(pos.x), y: Math.round(pos.y) } } : n
      );
    });
  }, [activeWorkflow]);

  const handleDeleteNode = useCallback((nodeId) => {
    setLocalNodes(prev => {
      const current = prev || activeWorkflow?.nodes || [];
      return current.filter(n => n.id !== nodeId);
    });
    setSelectedNodeId((prev) => (prev === nodeId ? null : prev));
  }, [activeWorkflow]);

  const handleSave = () => {
    if (!activeWorkflow || nodes.length === 0) return;
    const nodesToSave = localNodes ?? activeWorkflow.nodes ?? [];
    const edgesToSave = Array.isArray(activeWorkflow.edges) ? activeWorkflow.edges : edges;
    saveWorkflow.mutate({
      workflowId: activeWorkflow.id,
      name: activeWorkflow.name,
      nodes: nodesToSave,
      edges: edgesToSave,
    });
  };

  const ensureLocalBase = useCallback(() => (localNodes || activeWorkflow?.nodes || []), [activeWorkflow, localNodes]);

  const addNodeAt = useCallback((paletteType, pos) => {
    if (!activeWorkflow) return;
    const spec = paletteByType.get(paletteType);
    if (!spec) return;
    const now = Date.now();
    const newNode = {
      id: `node_${paletteType}_${now}`,
      type: paletteType,
      label: spec.label,
      subtitle: spec.subtitle,
      agent: paletteType === 'cortex_step' ? 'planner' : undefined,
      tools: paletteType === 'tool_tentacle' ? ['http_client'] : [],
      position: { x: Math.round(pos.x), y: Math.round(pos.y) },
      meta: {},
    };

    setLocalNodes((prev) => [...(prev || activeWorkflow?.nodes || []), newNode]);
    setSelectedNodeId(newNode.id);
  }, [activeWorkflow, paletteByType]);

  const addNodeCentered = useCallback((paletteType) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = rect.width / 2 - canvasOffset.x;
    const cy = rect.height / 2 - canvasOffset.y;
    addNodeAt(paletteType, { x: cx - 90, y: cy - 30 });
  }, [addNodeAt, canvasOffset.x, canvasOffset.y]);

  const handlePaletteDragStart = (paletteType, e) => {
    try {
      e.dataTransfer.setData('application/x-tentaos-node', paletteType);
      e.dataTransfer.effectAllowed = 'copy';
    } catch {
      // ignore
    }
  };

  const handleCanvasDrop = (e) => {
    if (!canvasRef.current || !activeWorkflow) return;
    e.preventDefault();
    const type = e.dataTransfer?.getData?.('application/x-tentaos-node');
    if (!type) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - canvasOffset.x;
    const y = e.clientY - rect.top - canvasOffset.y;
    addNodeAt(type, { x, y });
  };

  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  };

  const clearCanvas = () => {
    setLocalNodes([]);
    setSelectedNodeId(null);
    setLastValidation(null);
    setLastDryRun(null);
  };

  const startWithCortexTemplate = () => {
    const tpl = cortexPipelineTemplateDeploymentHealthCheck;
    const stamp = Date.now();
    const idMap = new Map(tpl.nodes.map((n) => [n.id, `${n.id}_${stamp}`]));
    const clonedNodes = tpl.nodes.map((n) => ({
      ...n,
      id: idMap.get(n.id),
      position: { ...n.position },
      meta: n.meta ? { ...n.meta } : {},
      tools: Array.isArray(n.tools) ? [...n.tools] : n.tools,
    }));
    setSelectedWorkflow(tpl);
    setLocalNodes(clonedNodes);
    setSelectedNodeId(clonedNodes[0]?.id || null);
    setLastValidation(null);
    setLastDryRun(null);
    setCanvasOffset({ x: 0, y: 0 });
  };

  const validatePipelineMutation = useMutation({
    mutationFn: async () => {
      const payload = { workflow_id: activeWorkflow?.id, nodes: ensureLocalBase(), edges };
      return apiValidatePipeline(payload);
    },
    onSuccess: (res) => setLastValidation({ ...res.data, _source: res.source, _error: res.error }),
  });

  const dryRunPipelineMutation = useMutation({
    mutationFn: async () => {
      const payload = { workflow_id: activeWorkflow?.id, nodes: ensureLocalBase(), edges };
      return apiDryRunPipeline(payload);
    },
    onSuccess: (res) => setLastDryRun({ ...res.data, _source: res.source, _error: res.error }),
  });

  // Canvas panning
  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.tagName === 'svg') {
      setIsPanning(true);
      setSelectedNodeId(null);
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        offsetX: canvasOffset.x,
        offsetY: canvasOffset.y,
      };
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isPanning) return;
    setCanvasOffset({
      x: panRef.current.offsetX + (e.clientX - panRef.current.startX),
      y: panRef.current.offsetY + (e.clientY - panRef.current.startY),
    });
  };

  const handleCanvasMouseUp = () => setIsPanning(false);

  const generateWorkflow = async () => {
    const desc = prompt('Short label for this local template (e.g. onboarding check):');
    if (desc == null) return;
    const label = (desc || 'Local template').trim().slice(0, 80) || 'Local template';
    setIsGenerating(true);
    try {
      const stamp = Date.now();
      const wfId = `wf_local_${stamp}`;
      const newNodes = PALETTE.map((p, i) => ({
        id: `n_${stamp}_${i}`,
        type: p.type,
        label: p.label,
        subtitle: p.subtitle,
        position: { x: 80 + i * 140, y: 120 },
        meta: { generated_from: label, deterministic_mock: true },
        tools: p.type === 'tool_tentacle' ? ['http_client'] : undefined,
        agent: p.type === 'cortex_step' ? 'planner' : undefined,
      }));
      const newEdges = newNodes.slice(0, -1).map((n, i) => ({
        id: `e_${stamp}_${i}`,
        from: n.id,
        to: newNodes[i + 1].id,
      }));
      const wf = {
        id: wfId,
        name: `Generated: ${label}`,
        description: 'Local mock pipeline from palette (no AI service connected).',
        pack: 'local',
        source: 'local',
        nodes: newNodes,
        edges: newEdges,
      };
      setSelectedWorkflow(wf);
      setLocalNodes(newNodes.map((n) => ({ ...n, position: { ...n.position } })));
      setSelectedNodeId(newNodes[0]?.id || null);
      setLastValidation(null);
      setLastDryRun(null);
      toast({
        title: 'Generated local mock pipeline.',
        description: `Template “${label}” (${newNodes.length} nodes).`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!selectedNodeId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteNode(selectedNodeId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDeleteNode, selectedNodeId]);

  const canSavePipeline = Boolean(activeWorkflow && nodes.length > 0);

  return (
    <TooltipProvider>
      <div data-testid="pipeline-page" className="min-h-screen flex bg-[#121B2C]">
      {/* Left Panel */}
      <div className="w-[240px] bg-[#121B2C] border-r border-slate-500/12 flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-slate-500/12">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-medium text-slate-400">Task Runtime</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white/40 hover:text-white/70" disabled>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#1A2436] border border-slate-500/15 text-slate-100">
                目前仅支持本地模板与画布编辑
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-1.5 max-h-[200px] overflow-auto">
            {workflows.map(wf => (
              <WorkflowCard key={wf.id} workflow={wf} onSelect={handleSelectWorkflow} isSelected={activeWorkflow?.id === wf.id} />
            ))}
          </div>
          {pipelineBootstrapError && (
            <p className="text-[10px] text-amber-400/90 mt-2 px-0.5" data-testid="pipeline-bootstrap-api-error">
              {pipelineBootstrapError}
            </p>
          )}
        </div>

        <div className="p-3 flex-1">
          <h3 className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">BUILD EXECUTION PATH</h3>
          <div className="space-y-1.5">
            {PALETTE.map(nt => (
              <div
                key={nt.type}
                data-testid={`pipeline-palette-${nt.type}`}
                draggable
                onDragStart={(e) => handlePaletteDragStart(nt.type, e)}
                onClick={() => addNodeCentered(nt.type)}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-800/50 border border-slate-500/12 hover:bg-slate-800/80 cursor-pointer active:cursor-grabbing transition-colors"
              >
                <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: nt.color + '15' }}>
                  <nt.icon className="w-3.5 h-3.5" style={{ color: nt.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-medium text-slate-100">{nt.label}</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-[10px] text-slate-500 hover:text-slate-300 select-none">ⓘ</span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#1A2436] border border-slate-500/15 text-slate-100 max-w-[240px]">
                        {nt.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-[9px] text-slate-500">{nt.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#141E2E]">
        {/* Toolbar */}
        <div className="h-12 border-b border-slate-500/12 px-4 flex items-center justify-between bg-[#161F30] flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Workflow className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-sm font-medium text-slate-100 truncate">Cortex Pipeline</h1>
              {activeWorkflow?.name && (
                <span className="text-xs text-slate-500 truncate max-w-[min(200px,28vw)] hidden sm:inline" title={activeWorkflow.name}>
                  {activeWorkflow.name}
                </span>
              )}
            </div>
            {activeWorkflow?.source === 'ai_generated' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 flex items-center gap-1 flex-shrink-0">
                <Sparkles className="w-3 h-3" /> AI
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost" className="text-slate-500 h-7 w-7 p-0 hover:text-slate-300" onClick={() => setCanvasOffset({ x: 0, y: 0 })}>
              <Maximize className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              data-testid="start-cortex-template"
              className="border-slate-500/15 text-slate-400 hover:bg-slate-800/40 h-7 text-[11px]"
              onClick={startWithCortexTemplate}
            >
              <Sparkles className="w-3 h-3 mr-1 text-sky-400" />
              Start with Cortex Template
            </Button>
            <Button
              size="sm"
              variant="outline"
              data-testid="validate-pipeline"
              className="border-slate-500/15 text-slate-400 hover:bg-slate-800/40 h-7 text-[11px]"
              onClick={() => validatePipelineMutation.mutate()}
              disabled={!activeWorkflow || validatePipelineMutation.isPending}
            >
              <ShieldCheck className="w-3 h-3 mr-1 text-sky-400" />
              {validatePipelineMutation.isPending ? 'Validating…' : 'Validate'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              data-testid="dry-run-pipeline"
              className="border-slate-500/15 text-slate-400 hover:bg-slate-800/40 h-7 text-[11px]"
              onClick={() => dryRunPipelineMutation.mutate()}
              disabled={!activeWorkflow || dryRunPipelineMutation.isPending}
            >
              <FlaskConical className="w-3 h-3 mr-1 text-sky-400" />
              {dryRunPipelineMutation.isPending ? 'Dry Running…' : 'Dry Run'}
            </Button>
            {nodes.length > 0 ? (
              <Button
                size="sm"
                variant="outline"
                data-testid="clear-pipeline"
                className="border-slate-500/15 text-slate-400 hover:bg-slate-800/40 h-7 text-[11px]"
                onClick={clearCanvas}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-not-allowed">
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid="clear-pipeline"
                      className="border-slate-500/15 text-slate-400 hover:bg-slate-800/40 h-7 text-[11px]"
                      onClick={clearCanvas}
                      disabled
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="bg-[#1A2436] border border-slate-500/15 text-slate-100">
                  画布为空时无法清空；请先添加节点或使用模板。
                </TooltipContent>
              </Tooltip>
            )}
            <Button
              size="sm"
              variant="outline"
              data-testid="generate-template-pipeline"
              className="border-slate-500/15 text-slate-400 hover:bg-slate-800/40 h-7 text-[11px]"
              onClick={generateWorkflow}
              disabled={isGenerating}
            >
              <Sparkles className="w-3 h-3 mr-1 text-purple-400" />
              {isGenerating ? 'Generating…' : 'Generate Template'}
            </Button>
            {canSavePipeline ? (
              <Button
                size="sm"
                variant="outline"
                data-testid="save-pipeline"
                className="border-slate-500/15 text-slate-400 hover:bg-slate-800/40 h-7 text-[11px]"
                onClick={handleSave}
                disabled={saveWorkflow.isPending}
              >
                <Save className="w-3 h-3 mr-1" />
                {saveWorkflow.isPending ? 'Saving…' : 'Save'}
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-not-allowed">
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid="save-pipeline"
                      className="border-slate-500/15 text-slate-400 hover:bg-slate-800/40 h-7 text-[11px]"
                      onClick={handleSave}
                      disabled
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="bg-[#1A2436] border border-slate-500/15 text-slate-100 max-w-[260px]">
                  Add nodes before saving.
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" className="bg-sky-500 hover:bg-sky-400 text-slate-950 h-7 text-[11px]" disabled>
                  <Play className="w-3 h-3 mr-1" />
                  Run
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#1A2436] border border-slate-500/15 text-slate-100">
                Run 需要 Engine 的 pipeline runtime 接口（尚未接入）
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Task status strip (below header) */}
        <div className="flex-shrink-0 border-b border-slate-500/10 bg-[#151B2A]/80 px-3 py-1.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] leading-tight text-slate-500">
            <span>
              <span className="text-slate-500">Task:</span>{' '}
              <span className="text-slate-300">Frontend-backend health check</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">·</span>
            <span>
              <span className="text-slate-500">Status:</span>{' '}
              <span className="text-slate-300">Verifying</span>
            </span>
            <span className="text-slate-600">·</span>
            <span>
              <span className="text-slate-500">Cortex:</span>{' '}
              <span className="text-slate-300">v0.14</span>
            </span>
            <span className="text-slate-600">·</span>
            <span>
              <span className="text-slate-500">Token Saved:</span>{' '}
              <span className="text-emerald-400/90">60%</span>
            </span>
            <span className="text-slate-600">·</span>
            <span>
              <span className="text-slate-500">Risk:</span>{' '}
              <span className="text-emerald-400/90">Low</span>
            </span>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          data-testid="pipeline-canvas"
          className={cn(
            "flex-1 relative overflow-hidden bg-[#171F30]",
            isPanning ? "cursor-grabbing" : "cursor-default"
          )}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
        >
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgb(148 163 184) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              backgroundPosition: `${canvasOffset.x % 30}px ${canvasOffset.y % 30}px`,
            }}
          />

          {/* Nodes container */}
          <div
            className="absolute inset-0"
            style={{ transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)` }}
          >
            <CanvasEdges edges={edges} nodes={nodes} />
            {nodes.map(node => (
              <DraggableNode
                key={node.id}
                node={{
                  ...node,
                  agent: node.agent || (node.type === 'cortex_step' ? 'planner' : undefined),
                }}
                onMove={handleNodeMove}
                onSelect={setSelectedNodeId}
                isSelected={selectedNodeId === node.id}
                onDelete={handleDeleteNode}
              />
            ))}
          </div>

          {nodes.length === 0 && (
            <div
              data-testid="pipeline-empty-state"
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="text-center max-w-[420px] px-6 pointer-events-auto">
                <Workflow className="w-9 h-9 mx-auto mb-3 text-slate-600/50" />
                <p className="text-sm font-medium text-slate-200">Build this task’s execution path</p>
                <p className="text-xs mt-2 text-slate-500 leading-relaxed">
                  Every action becomes a TransitionCapsule with proof, trace, and rollback.
                </p>
                <div className="mt-5 flex justify-center">
                  <Button
                    size="sm"
                    data-testid="start-cortex-template"
                    onClick={startWithCortexTemplate}
                    className="bg-sky-500/90 hover:bg-sky-400 text-slate-950 h-8 text-xs font-medium shadow-none"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Start with Cortex Template
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Canvas status (subtle, bottom-right) */}
          <div className="absolute bottom-3 right-3 pointer-events-none z-10">
            <div
              data-testid="proof-status-pill"
              className="pointer-events-auto rounded-lg border border-slate-500/12 bg-[#151B2A]/85 px-2.5 py-2 space-y-1 text-[10px] text-slate-500 leading-snug backdrop-blur-sm"
            >
              <div>
                <span className="text-slate-500">Proof Mode:</span>{' '}
                <span className="text-sky-400/90">On</span>
              </div>
              <div>
                <span className="text-slate-500">Rollback:</span>{' '}
                <span className="text-slate-400">Available</span>
              </div>
              <div>
                <span className="text-slate-500">Trace:</span>{' '}
                <span className="text-slate-400">Recording</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Node Config */}
      {selectedNode && (
        <div
          data-testid="pipeline-inspector"
          className="w-[220px] bg-[#151B2A] border-l border-slate-500/12 p-4 flex-shrink-0"
        >
          <h3 className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-4">Node Config</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Label</label>
              <p className="text-sm text-white">{selectedNode.label}</p>
            </div>
            {selectedNode.subtitle && (
              <div>
                <label className="text-[11px] text-white/40 block mb-1">Subtitle</label>
                <p className="text-xs text-white/60">{selectedNode.subtitle}</p>
              </div>
            )}
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Type</label>
              <p className="text-xs text-white/60 capitalize">{selectedNode.type}</p>
            </div>
            {selectedNode.agent && (
              <div>
                <label className="text-[11px] text-white/40 block mb-1">Agent</label>
                <p className="text-xs text-white/60 capitalize">{selectedNode.agent}</p>
              </div>
            )}
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Position</label>
              <p className="text-xs text-white/40 font-mono">
                x: {selectedNode.position?.x || 0}, y: {selectedNode.position?.y || 0}
              </p>
            </div>
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                data-testid="pipeline-btn-delete-node"
                onClick={() => handleDeleteNode(selectedNode.id)}
                className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 h-8 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete node
              </Button>
              <p className="text-[10px] text-white/30 mt-2">Tip: press Delete / Backspace</p>
            </div>
          </div>
        </div>
      )}

      {/* Right panel - Workflow info when no node selected */}
      {!selectedNode && activeWorkflow && (
        <div className="w-[220px] bg-[#151B2A] border-l border-slate-500/12 p-4 flex-shrink-0">
          <h3 className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-4">Workflow Info</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Name</label>
              <p className="text-sm text-white">{activeWorkflow.name}</p>
            </div>
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Description</label>
              <p className="text-xs text-white/50">{activeWorkflow.description}</p>
            </div>
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Nodes</label>
              <p className="text-sm text-white">{nodes.length}</p>
            </div>
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Edges</label>
              <p className="text-sm text-white">{edges.length}</p>
            </div>

            <div className="pt-3 border-t border-white/[0.06] space-y-2" data-testid="pipeline-last-validate">
              <label className="text-[11px] text-white/40 block">Last Validate</label>
              {!lastValidation ? (
                <p className="text-xs text-white/30">No validation run yet.</p>
              ) : (
                <div className="text-xs">
                  <p className={cn("font-medium", lastValidation.ok ? "text-emerald-400" : "text-red-400")}>
                    {lastValidation.ok ? 'OK' : 'Issues found'} <span className="text-white/20">·</span>{' '}
                    <span className="text-white/40">{lastValidation._source === 'engine' ? 'Engine' : 'Mock'}</span>
                  </p>
                  {lastValidation.summary && <p className="text-white/50 mt-1">{lastValidation.summary}</p>}
                  {(lastValidation.warnings || []).length > 0 && (
                    <ul className="mt-2 space-y-1 text-white/40 list-disc pl-4">
                      {lastValidation.warnings.slice(0, 3).map((w) => <li key={w}>{w}</li>)}
                    </ul>
                  )}
                  {(lastValidation.errors || []).length > 0 && (
                    <ul className="mt-2 space-y-1 text-red-400/90 list-disc pl-4">
                      {lastValidation.errors.slice(0, 3).map((er) => <li key={er}>{er}</li>)}
                    </ul>
                  )}
                  {lastValidation._error && (
                    <p className="mt-2 text-[10px] text-amber-400/90" data-testid="pipeline-validate-api-error">
                      Client: {lastValidation._error}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 space-y-2" data-testid="pipeline-last-dry-run">
              <label className="text-[11px] text-white/40 block">Last Dry Run</label>
              {!lastDryRun ? (
                <p className="text-xs text-white/30">No dry-run yet.</p>
              ) : (
                <div className="text-xs text-white/50 space-y-1">
                  <p className="text-white/60">
                    <span className="text-[#38BDF8]">Proof Mode</span>: {String(Boolean(lastDryRun.proof_mode)).toUpperCase()}
                    {' '}<span className="text-white/20">·</span>{' '}
                    <span className="text-[#34D399]">Rollback</span>: {String(Boolean(lastDryRun.rollback_available)).toUpperCase()}
                  </p>
                  <p>
                    Est. cost: <span className="text-white/70">${Number(lastDryRun.estimated_cost_usd || 0).toFixed(2)}</span>
                    {' '}<span className="text-white/20">·</span>{' '}
                    Tokens: <span className="text-white/70">{Math.round(Number(lastDryRun.estimated_tokens || 0)).toLocaleString()}</span>
                  </p>
                  <p className="text-white/30">
                    Source: {lastDryRun._source === 'engine' ? 'Engine' : 'Mock'}
                  </p>
                  {lastDryRun._error && (
                    <p className="text-[10px] text-amber-400/90" data-testid="pipeline-dry-run-api-error">
                      Client: {lastDryRun._error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </TooltipProvider>
  );
}