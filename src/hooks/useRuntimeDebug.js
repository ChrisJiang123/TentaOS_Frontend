// @ts-nocheck
import { useEffect, useState } from 'react';
import { runtimeDebug } from '@/lib/runtimeDebug';

export function useRuntimeDebug() {
  const [snap, setSnap] = useState(() => runtimeDebug.getSnapshot());
  useEffect(() => runtimeDebug.subscribe(setSnap), []);
  return snap;
}
