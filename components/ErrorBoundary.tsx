
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
          <div className="bg-brand-900 border border-red-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle size={32} />
              <h1 className="text-xl font-bold">Application Error</h1>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Something went wrong while loading the application. This might be due to a connection issue or corrupted local data.
            </p>
            <div className="bg-black/30 p-4 rounded-lg mb-6 overflow-auto max-h-40">
                <code className="text-red-400 text-xs font-mono break-all">
                    {this.state.error?.message || 'Unknown Error'}
                </code>
            </div>
            <button
              onClick={() => {
                  localStorage.clear();
                  window.location.reload();
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw size={18} />
              Reset App Data & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
