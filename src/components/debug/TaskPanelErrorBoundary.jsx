// @ts-nocheck
import React from 'react';

export class TaskPanelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[TaskPanelErrorBoundary]', error, info);
  }

  render() {
    const { error } = this.state;
    const { title = 'Task detail render error', children } = this.props;

    if (error) {
      return (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 my-4">
          <p className="text-sm font-medium text-red-300">{title}</p>
          {import.meta.env.DEV && (
            <pre className="mt-2 text-[11px] text-red-200/70 whitespace-pre-wrap font-mono">
              {error.message}
            </pre>
          )}
        </div>
      );
    }

    return children;
  }
}

export default TaskPanelErrorBoundary;
