/** Shared contract types — keep in sync with tentaos-shared-contract.md */

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

export interface Verification {
  type: VerificationType;
  expression: string;
  result?: VerificationResult;
  detail?: string;
}

export interface Evidence {
  type: 'screenshot' | 'terminal' | 'diff' | 'log';
  ref: string;
  label?: string;
}

export interface Step {
  id: string;
  index: number;
  title: string;
  tool: StepTool;
  action?: string;
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
  /** Final answer when task completed (Engine: answer / result.answer / output_text). */
  answer?: string;
  answer_source?: string;
  answer_model?: string;
}

export interface VerificationSummary {
  checks?: Array<{ type: string; result: VerificationResult; detail?: string }>;
  final_diff_ref?: string;
  duration_ms?: number;
  cost?: number;
}

export interface Fork {
  id: string;
  task_id: string;
  strategy: string;
  pipeline: { steps: Step[]; status: string };
  score?: number;
  isWinner?: boolean;
}

export interface Approval {
  id: string;
  task_id: string;
  step_id: string;
  action: string;
  risk: StepRisk;
  reason: string;
  expected_impact?: { files?: string[]; commands?: string[] };
}

export interface FullTask extends TaskSummary {
  steps: Step[];
  verification_summary?: VerificationSummary;
  forks?: Fork[];
}

export type PipelineMode = 'preview' | 'live' | 'replay';

export interface Pipeline {
  taskId: string;
  mode: PipelineMode;
  title: string;
  intent: string;
  status: TaskStatus;
  steps: Step[];
  steps_completed: number;
  steps_total: number;
  verification_summary?: VerificationSummary;
  forks: Fork[];
  created_date?: string;
  actual_cost?: number;
  plan_id?: string;
  answer?: string;
  /** e.g. `openrouter` when answer is model-synthesized */
  answer_source?: string;
  answer_model?: string;
}
