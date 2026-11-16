import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: ''
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred.'
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndReload = () => {
    try {
      localStorage.removeItem('pkm_user');
      localStorage.removeItem('pkm_token');
      localStorage.removeItem('pkm_cart');
    } catch {
      // ignore storage access issues
    }
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-white font-['Outfit']">
                Something Went Wrong
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The page encountered a runtime error instead of loading cleanly. Details are shown below:
              </p>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-left text-[11px] font-mono text-rose-300 break-words">
              {this.state.errorMessage}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 min-h-[44px] px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-xl inline-flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Store</span>
              </button>
              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="flex-1 min-h-[44px] px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl inline-flex items-center justify-center gap-1.5 transition"
              >
                <Home className="w-4 h-4" />
                <span>Reset Session</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
