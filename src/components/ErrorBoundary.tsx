import React, { type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  override componentDidCatch(error: Error, _errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(error);
    }
  }

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="app-shell error-shell">
        <section className="hero-panel error-panel">
          <div>
            <p className="eyebrow">DocAutoFiller</p>
            <h1>Something went wrong</h1>
            <p className="hero-copy">{this.state.message}</p>
          </div>
          <button type="button" className="submit-button" onClick={() => window.location.assign('/')}>
            Back to dashboard
          </button>
        </section>
      </main>
    );
  }
}