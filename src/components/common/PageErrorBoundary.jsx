// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Page-level error boundary — must wrap routed content only (not sidebar/nav).
 * Remount via key={location.pathname} on the parent so errors reset on navigation.
 */
export class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[PageErrorBoundary]', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    const prevKey = prevProps.resetKey;
    const nextKey = this.props.resetKey;
    if (prevKey != null && nextKey != null && prevKey !== nextKey && this.state.error) {
      this.setState({ error: null, errorInfo: null });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error, errorInfo } = this.state;
    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 lg:p-8 min-h-[40vh]">
          <div className="max-w-lg w-full text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400/80 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-white mb-2">Something went wrong on this page</h2>
            <p className="text-sm text-white/45 mb-6">
              This page hit a render error. Use the sidebar to open another route, or choose an action below.
            </p>

            {import.meta.env.DEV && (
              <div className="text-left mb-6 space-y-2">
                <pre className="text-[11px] text-red-200/80 bg-red-500/10 border border-red-500/20 rounded-lg p-3 whitespace-pre-wrap font-mono overflow-auto max-h-32">
                  {error.message}
                </pre>
                {errorInfo?.componentStack && (
                  <pre className="text-[10px] text-white/35 bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 whitespace-pre-wrap font-mono overflow-auto max-h-40">
                    {errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/Dashboard"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-[#00E5FF] text-[#06060B] text-sm font-medium hover:bg-[#00E5FF]/90"
              >
                Back to Dashboard
              </Link>
              <Link
                to="/Settings"
                className="inline-flex items-center px-4 py-2 rounded-lg border border-white/[0.12] text-white/70 text-sm hover:bg-white/[0.04]"
              >
                Go to Settings
              </Link>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/[0.12] text-white/70 text-sm hover:bg-white/[0.04]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default PageErrorBoundary;
