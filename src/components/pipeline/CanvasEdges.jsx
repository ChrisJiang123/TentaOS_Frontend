import React from 'react';

export default function CanvasEdges({ edges, nodes }) {
  if (!edges || !nodes || nodes.length === 0) return null;

  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      {edges.map(edge => {
        const source = nodeMap[edge.source];
        const target = nodeMap[edge.target];
        if (!source || !target) return null;

        const sx = (source.position?.x || 0) + 180; // right side of node
        const sy = (source.position?.y || 0) + 40;  // vertical center
        const tx = (target.position?.x || 0);        // left side of node
        const ty = (target.position?.y || 0) + 40;

        const midX = (sx + tx) / 2;

        return (
          <g key={edge.id}>
            <path
              d={`M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
              fill="none"
            />
            {/* Arrow */}
            <circle cx={tx} cy={ty} r="3" fill="rgba(255,255,255,0.15)" />
          </g>
        );
      })}
    </svg>
  );
}