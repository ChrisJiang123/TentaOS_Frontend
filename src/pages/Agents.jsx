// @ts-nocheck
import React from 'react';
import { Bot } from 'lucide-react';
import ComingSoonPage from '@/components/common/ComingSoonPage';

export default function Agents() {
  return (
    <ComingSoonPage
      testId="agents-page"
      title="Agents"
      icon={Bot}
      description="Agent profiles and permission controls are in early access. Submit tasks from the Dashboard to run workflows on the Engine."
      seoDescription="TentaOS agent management — coming soon."
    />
  );
}
