// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[PageErrorBoundary]', error, info);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400/80 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-white mb-2">Something went wrong on this page</h2>
            <p className="text-sm text-white/45 mb-4">
              The control plane UI hit a render error. Other routes should still work.
            </p>
            {import.meta.env.DEV && (
              <pre className="text-left text-[11px] text-red-200/70 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 whitespace-pre-wrap font-mono">
                {error.message}
              </pre>
            )}
            <Link to="/Dashboard" className="text-sm text-[#00E5FF]/90 hover:text-[#00E5FF]">
              Return to Dashboard →
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default PageErrorBoundary;
