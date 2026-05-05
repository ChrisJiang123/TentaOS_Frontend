import React, { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Workflow, Play, Save, Plus, Sparkles, Bot, Wrench, GitBranch, Settings, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DraggableNode from '../components/pipeline/DraggableNode';
import CanvasEdges from '../components/pipeline/CanvasEdges';

const nodeTypes = [
  { type: 'agent', label: 'Agent Node', icon: Bot, color: '#3B82F6', desc: 'AI agent step' },
  { type: 'tool', label: 'Tool Node', icon: Wrench, color: '#10B981', desc: 'Tool invocation' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: '#F59E0B', desc: 'Branching' },
  { type: 'approval', label: 'Approval Gate', icon: Settings, color: '#EF4444', desc: 'Human check' },
];

function WorkflowCard({ workflow, onSelect, isSelected }) {
  return (
    <button
      onClick={() => onSelect(workflow)}
      className={cn(
        "w-full text-left p-3 rounded-xl border transition-all",
        isSelected
          ? "bg-blue-500/10 border-blue-500/30"
          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Workflow className={cn("w-3.5 h-3.5", isSelected ? "text-blue-400" : "text-white/40")} />
        <h3 className="text-xs font-medium text-white truncate">{workflow.name}</h3>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded capitalize",
          workflow.pack === 'growth' ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'
        )}>
          {workflow.pack}
        </span>
        <span className="text-[10px] text-white/30">{workflow.nodes?.length || 0} nodes</span>
      </div>
    </button>
  );
}

export default function PipelineStudio() {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [localNodes, setLocalNodes] = useState(null); // local override for dragging
  const [isGenerating, setIsGenerating] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
  const canvasRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => [],
  });

  const saveWorkflow = useMutation({
    mutationFn: async () => {},
  });

  const activeWorkflow = selectedWorkflow || workflows[0];
  const nodes = localNodes || activeWorkflow?.nodes || [];
  const edges = activeWorkflow?.edges || [];

  // When switching workflow, reset local state
  const handleSelectWorkflow = (wf) => {
    setSelectedWorkflow(wf);
    setLocalNodes(null);
    setSelectedNodeId(null);
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
  }, [activeWorkflow]);

  const handleSave = () => {
    if (activeWorkflow && localNodes) {
      saveWorkflow.mutate({ id: activeWorkflow.id, nodes: localNodes });
    }
  };

  // Drop new node from palette
  const handleDropNewNode = (nodeType, e) => {
    if (!canvasRef.current || !activeWorkflow) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - canvasOffset.x;
    const y = e.clientY - rect.top - canvasOffset.y;

    const newNode = {
      id: `node_${Date.now()}`,
      type: nodeType.type,
      label: nodeType.label,
      agent: nodeType.type === 'agent' ? 'planner' : undefined,
      tools: [],
      position: { x: Math.round(x), y: Math.round(y) },
    };

    setLocalNodes(prev => [...(prev || activeWorkflow?.nodes || []), newNode]);
  };

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
    const desc = prompt('Describe the workflow you want to create:');
    if (!desc) return;
    setIsGenerating(true);
    // base44 generateWorkflow 已移除：本地模式不生成
    setIsGenerating(false);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="w-[240px] bg-[#0A0A0F] border-r border-white/[0.06] flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-medium text-white/60">Workflows</h2>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white/40 hover:text-white/60">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="space-y-1.5 max-h-[200px] overflow-auto">
            {workflows.map(wf => (
              <WorkflowCard key={wf.id} workflow={wf} onSelect={handleSelectWorkflow} isSelected={activeWorkflow?.id === wf.id} />
            ))}
          </div>
        </div>

        <div className="p-3 flex-1">
          <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2">Drag to Canvas</h3>
          <div className="space-y-1.5">
            {nodeTypes.map(nt => (
              <div
                key={nt.type}
                draggable
                onDragEnd={(e) => handleDropNewNode(nt, e)}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] cursor-grab active:cursor-grabbing transition-colors"
              >
                <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: nt.color + '15' }}>
                  <nt.icon className="w-3.5 h-3.5" style={{ color: nt.color }} />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-white/70">{nt.label}</p>
                  <p className="text-[9px] text-white/30">{nt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-12 border-b border-white/[0.06] px-4 flex items-center justify-between bg-[#0A0A0F]/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Workflow className="w-4 h-4 text-blue-400" />
            <h1 className="text-sm font-medium text-white truncate">
              {activeWorkflow?.name || 'Pipeline Studio'}
            </h1>
            {activeWorkflow?.source === 'ai_generated' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost" className="text-white/30 h-7 w-7 p-0" onClick={() => setCanvasOffset({ x: 0, y: 0 })}>
              <Maximize className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 text-white/50 hover:bg-white/5 h-7 text-[11px]"
              onClick={generateWorkflow}
              disabled={isGenerating}
            >
              <Sparkles className="w-3 h-3 mr-1 text-purple-400" />
              {isGenerating ? 'Generating...' : 'AI Generate'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 text-white/50 hover:bg-white/5 h-7 text-[11px]"
              onClick={handleSave}
              disabled={!localNodes}
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white h-7 text-[11px]">
              <Play className="w-3 h-3 mr-1" />
              Run
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className={cn(
            "flex-1 relative overflow-hidden bg-[#08080E]",
            isPanning ? "cursor-grabbing" : "cursor-default"
          )}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
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
                node={node}
                onMove={handleNodeMove}
                onSelect={setSelectedNodeId}
                isSelected={selectedNodeId === node.id}
                onDelete={handleDeleteNode}
              />
            ))}
          </div>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white/20 pointer-events-none">
              <div className="text-center">
                <Workflow className="w-10 h-10 mx-auto mb-3 text-white/10" />
                <p className="text-sm">Drag nodes from the left panel to start</p>
                <p className="text-xs mt-1 text-white/15">Or use AI Generate to create a workflow</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Node Config */}
      {selectedNode && (
        <div className="w-[220px] bg-[#0A0A0F] border-l border-white/[0.06] p-4 flex-shrink-0">
          <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-4">Node Config</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Label</label>
              <p className="text-sm text-white">{selectedNode.label}</p>
            </div>
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
          </div>
        </div>
      )}

      {/* Right panel - Workflow info when no node selected */}
      {!selectedNode && activeWorkflow && (
        <div className="w-[220px] bg-[#0A0A0F] border-l border-white/[0.06] p-4 flex-shrink-0">
          <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-4">Workflow Info</h3>
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
          </div>
        </div>
      )}
    </div>
  );
}