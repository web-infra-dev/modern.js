import { Component, Suspense, lazy, useCallback, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

const RemotePanel = lazy(() => import('reactMultiVersionProvider/RemotePanel'));

type RemoteErrorBoundaryProps = {
  children: ReactNode;
  onError: (error: Error, info: ErrorInfo) => void;
};

type RemoteErrorBoundaryState = {
  error: string | null;
};

class RemoteErrorBoundary extends Component<
  RemoteErrorBoundaryProps,
  RemoteErrorBoundaryState
> {
  state: RemoteErrorBoundaryState = { error: null };

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error: error.message });
    this.props.onError(error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <section data-testid="remote-panel-error">
          <strong>Remote render failed</strong>
          <p>{this.state.error}</p>
        </section>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onRemoteError = useCallback((error: Error, info: ErrorInfo) => {
    console.error('[react-multi-version] remote render failed', {
      error,
      componentStack: info.componentStack,
    });
    setStatus('error');
    setErrorMessage(error.message);
  }, []);

  return (
    <main style={{ display: 'grid', gap: 16, padding: 24 }}>
      <section>
        <h1>React multi version MF case</h1>
        <p>
          The remote renders a dependency package that bundles its own React.
        </p>
      </section>

      <section data-testid="reproduced-issue">
        <h2>Reproduced Issue</h2>
        <p>
          <strong>Status:</strong> {status}
        </p>
        <p>
          <strong>Route:</strong> /checkout
        </p>
        {errorMessage ? (
          <p role="alert">
            <strong>Error:</strong> {errorMessage}
          </p>
        ) : (
          <p>Waiting for the remote checkout component to render.</p>
        )}
      </section>

      <section>
        <h2>Remote Provider</h2>
        <RemoteErrorBoundary onError={onRemoteError}>
          <Suspense fallback={<div>Loading remote provider...</div>}>
            <RemotePanel />
          </Suspense>
        </RemoteErrorBoundary>
      </section>
    </main>
  );
}
