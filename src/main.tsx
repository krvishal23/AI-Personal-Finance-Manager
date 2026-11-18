import { Component, createRoot, type ErrorInfo, type ReactNode } from 'react';
import App from './App.tsx';
import './index.css';

interface AppErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application failed to render:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main role="alert" className="min-h-screen bg-slate-950 p-8 text-slate-100">
          <h1 className="text-xl font-semibold">GULLAK couldn’t start</h1>
          <p className="mt-2 text-slate-300">
            An unexpected error stopped the app from rendering. Reload the page to try again.
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Required #root element was not found in index.html.');
}

createRoot(rootElement).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
