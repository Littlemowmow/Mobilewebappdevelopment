import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to an error reporting service in production
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-5xl mb-4">😵</div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">Try refreshing the page</p>
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-semibold">Refresh</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Route-level error fallback for React Router errorElement */
export function RouteErrorFallback() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-5xl mb-4">😵</div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Something went wrong</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-4">Try refreshing the page</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-semibold">Refresh</button>
      </div>
    </div>
  );
}
