// @ts-nocheck
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import RunView from '@/components/run/RunView';
import TaskPanelErrorBoundary from '@/components/debug/TaskPanelErrorBoundary';

export default function TaskDetail() {
  const [params] = useSearchParams();
  const taskId = params.get('id');
  const mode = params.get('mode') === 'replay' ? 'replay' : 'live';

  return (
    <TaskPanelErrorBoundary title="Run view render error">
      <RunView taskId={taskId} mode={mode} />
    </TaskPanelErrorBoundary>
  );
}
