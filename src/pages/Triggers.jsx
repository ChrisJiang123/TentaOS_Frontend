// @ts-nocheck
import React from 'react';
import { Zap } from 'lucide-react';
import ComingSoonPage from '@/components/common/ComingSoonPage';

export default function Triggers() {
  return (
    <ComingSoonPage
      testId="triggers-page"
      title="Workflow Triggers"
      icon={Zap}
      description="Scheduled and webhook triggers are in early access. Use the Dashboard to submit tasks manually during the demo."
      seoDescription="TentaOS workflow triggers — coming soon."
    />
  );
}
