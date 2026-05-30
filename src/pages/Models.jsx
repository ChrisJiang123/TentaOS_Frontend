// @ts-nocheck
import React from 'react';
import { Cpu } from 'lucide-react';
import ComingSoonPage from '@/components/common/ComingSoonPage';

export default function Models() {
  return (
    <ComingSoonPage
      testId="models-page"
      title="Model Management"
      icon={Cpu}
      description="BYOK model routing and usage analytics are in early access. The Engine uses your configured models when running tasks."
      seoDescription="TentaOS model management — coming soon."
    />
  );
}
