import React from 'react';
import '../styles/error-boundary.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🛡️ ErrorBoundary caught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <h1 className="error-boundary-title">🛡️ Error caught!</h1>
          <div className="error-boundary-message-wrapper">
            <h2 className="error-boundary-message-title">Error:</h2>
            <pre className="error-boundary-message-content">
              {this.state.error?.toString()}
            </pre>
          </div>
          {this.state.error?.stack && (
            <div className="error-boundary-stack-wrapper">
              <h2 className="error-boundary-stack-title">Stack trace:</h2>
              <pre className="error-boundary-stack-content">
                {this.state.error.stack}
              </pre>
            </div>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="error-boundary-reload-btn"
          >
            🔄 Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
