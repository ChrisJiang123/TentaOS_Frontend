// @ts-nocheck
import { useEffect, useState } from 'react';
import { pipelineRunStore } from '@/lib/pipelineRunStore';

export function usePipelineRun() {
  const [snap, setSnap] = useState(() => pipelineRunStore.getSnapshot());
  useEffect(() => pipelineRunStore.subscribe(setSnap), []);
  return snap;
}
