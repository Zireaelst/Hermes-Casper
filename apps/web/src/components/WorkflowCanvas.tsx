"use client";

import {
  Background,
  Controls,
  type Edge,
  Handle,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";

/** Node lifecycle state → design-system status token (theme-aware, design-system.md §6). */
const STATE_STYLE: Record<string, { border: string; text: string; dot: string }> = {
  done: {
    border: "color-mix(in srgb, var(--color-success) 55%, transparent)",
    text: "var(--color-success)",
    dot: "var(--color-success)",
  },
  active: {
    border: "color-mix(in srgb, var(--color-warning) 55%, transparent)",
    text: "var(--color-warning)",
    dot: "var(--color-warning)",
  },
  failed: {
    border: "color-mix(in srgb, var(--color-danger) 55%, transparent)",
    text: "var(--color-danger)",
    dot: "var(--color-danger)",
  },
  idle: {
    border: "var(--color-border)",
    text: "var(--color-text-subtle)",
    dot: "var(--color-text-subtle)",
  },
};

type NodeState = keyof typeof STATE_STYLE;
type StageData = { label: string; state: NodeState };

function StageNode({ data }: NodeProps) {
  const { label, state } = data as StageData;
  const s = STATE_STYLE[state] ?? STATE_STYLE.idle!;
  return (
    <div
      className="rounded-lg px-3 py-2 font-mono text-xs shadow-sm"
      style={{ border: `1px solid ${s.border}`, color: s.text, background: "var(--color-surface-raised)" }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full" style={{ background: s.dot }} aria-hidden />
        {label}
      </span>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = { stage: StageNode };

const STAGES = ["discover", "negotiate", "purchase", "execute", "pay"] as const;

export interface WorkflowCanvasProps {
  /** Order status drives how far the pipeline has progressed. */
  orderStatus: string;
  /** Payment status drives the final `pay` node specifically. */
  paymentStatus?: string;
}

function computeStates(orderStatus: string, paymentStatus?: string): NodeState[] {
  const failed = orderStatus === "failed" || orderStatus === "cancelled";
  // discover/negotiate/purchase are done once an Order exists at all.
  const base: NodeState[] = ["done", "done", "done"];
  // execute: done when settled, else active while in-flight.
  const settled = orderStatus === "settled";
  const execute: NodeState = failed ? "failed" : settled ? "done" : "active";
  let pay: NodeState = "idle";
  if (failed) pay = "failed";
  else if (paymentStatus === "settled" || settled) pay = "done";
  else if (paymentStatus === "settling" || paymentStatus === "authorized") pay = "active";
  else if (orderStatus === "authorized" || orderStatus === "settling") pay = "active";
  return [...base, execute, pay];
}

export function WorkflowCanvas({ orderStatus, paymentStatus }: WorkflowCanvasProps) {
  const { nodes, edges } = useMemo(() => {
    const states = computeStates(orderStatus, paymentStatus);
    const nodes: Node[] = STAGES.map((label, i) => ({
      id: label,
      type: "stage",
      position: { x: i * 150, y: 0 },
      data: { label, state: states[i] ?? "idle" },
      draggable: false,
      connectable: false,
    }));
    const edges: Edge[] = STAGES.slice(1).map((label, i) => ({
      id: `${STAGES[i]}-${label}`,
      source: STAGES[i]!,
      target: label,
      animated: states[i + 1] === "active",
      style: { stroke: "var(--color-border-strong)" },
    }));
    return { nodes, edges };
  }, [orderStatus, paymentStatus]);

  return (
    <div className="h-44 w-full overflow-hidden rounded-xl border border-border bg-surface-raised">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        preventScrolling={false}
      >
        <Background color="var(--color-border-strong)" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
