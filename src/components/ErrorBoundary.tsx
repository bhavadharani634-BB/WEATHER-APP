import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
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
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full liquid-glass-dark rounded-3xl p-6 sm:p-8 border border-white/20 text-center my-4">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">
            {this.props.fallbackTitle || 'Something went wrong rendering this component'}
          </h3>
          <p className="text-white/70 text-xs sm:text-sm max-w-md mx-auto mb-6">
            {this.state.error?.message || 'An unexpected runtime error occurred. Please try reloading this view.'}
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-[#FEC700] text-[#20462E] font-bold text-xs hover:scale-105 transition-transform shadow-lg cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reload Component</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
