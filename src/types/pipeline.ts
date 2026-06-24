/**
 * TentaOS pipeline types — aligned with shared contract (Cursor ↔ Codex).
 * @see tentaos-shared-contract.md
 */

export type StepTool = 'terminal' | 'browser' | 'file' | 'model';
export type StepRisk = 'low' | 'medium' | 'high';
export type StepStatus =
  | 'pending'
  | 'running'
  | 'passed'
  | 'failed'
  | 'skipped'
  | 'awaiting_approval';

export type VerificationType =
  | 'test'
  | 'build'
  | 'http'
  | 'file_exists'
  | 'diff_match'
  | 'manual';

export type VerificationResult = 'pass' | 'fail';

/** Objective check attached to a step (shared contract verification block). */
export interface Check {
  type: VerificationType;
  expression: string;
  result?: VerificationResult;
  detail?: string;
}

export interface Verification extends Check {}

export type EvidenceType = 'screenshot' | 'terminal' | 'diff' | 'log';

export interface Evidence {
  type: EvidenceType;
  ref: string;
  label?: string;
}

export interface Step {
  id: string;
  index: number;
  title: string;
  tool: StepTool;
  action: string;
  risk: StepRisk;
  status: StepStatus;
  verification: Verification;
  evidence: Evidence[];
  checkpointId?: string;
}

export type TaskStatus =
  | 'queued'
  | 'planning'
  | 'running'
  | 'paused'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface TaskSummary {
  id: string;
  title: string;
  intent: string;
  status: TaskStatus;
  steps_completed: number;
  steps_total: number;
  created_date: string;
  actual_cost?: number;
}

export interface VerificationSummary {
  checks?: Check[];
  final_diff_ref?: string;
  duration_ms?: number;
  cost?: number;
}

export interface ForkPipeline {
  steps: Step[];
  status: string;
}

export interface Fork {
  id: string;
  task_id: string;
  strategy: string;
  pipeline: ForkPipeline;
  score?: number;
  isWinner?: boolean;
}

export interface FullTask extends TaskSummary {
  steps: Step[];
  verification_summary?: VerificationSummary;
  forks?: Fork[];
}

export type PipelineMode = 'preview' | 'live' | 'replay';

/** Normalized pipeline object consumed by Run View / Plan Preview (Phase 2+). */
export interface Pipeline extends TaskSummary {
  mode: PipelineMode;
  steps: Step[];
  verification_summary?: VerificationSummary;
  forks: Fork[];
}

export interface Approval {
  id: string;
  task_id: string;
  step_id: string;
  action: string;
  risk: StepRisk;
  reason: string;
  expected_impact: {
    files?: string[];
    commands?: string[];
  };
}
