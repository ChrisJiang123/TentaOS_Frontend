// @ts-nocheck
/** WebSocket event names — shared contract (tentaos-shared-contract.md). */

export const PIPELINE_WS_EVENTS = [
  'connection_established',
  'task_started',
  'step_started',
  'terminal_output',
  'browser_action',
  'verification_result',
  'step_completed',
  'step_failed',
  'approval_required',
  'approval_resolved',
  'auto_approved',
  'checkpoint_created',
  'task_completed',
  'completed',
  'task_finished',
  'task_failed',
  'fork_started',
  'fork_step_started',
  'fork_step_completed',
  'fork_completed',
  'fork_scored',
  'merge_completed',
];
