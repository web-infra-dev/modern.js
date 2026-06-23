import { Component, Suspense, lazy, useCallback, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { BrowserRouter } from 'react-router';

const RemotePanel = lazy(() => import('nestedRouterTreeProvider/RemotePanel'));

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
        <section data-testid="remote-router-error">
          <strong>Remote route failed</strong>
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
    console.error('[nested-router-tree] remote route failed', {
      error,
      componentStack: info.componentStack,
    });
    setStatus('error');
    setErrorMessage(error.message);
  }, []);

  return (
    <BrowserRouter>
      <main style={{ display: 'grid', gap: 16, padding: 24 }}>
        <section>
          <h1>Nested router MF case</h1>
          <p>
            The host already has a router, and the remote mounts another router
            root inside it.
          </p>
        </section>

        <section data-testid="reproduced-issue">
          <h2>Reproduced Issue</h2>
          <p>
            <strong>Status:</strong> {status}
          </p>
          <p>
            <strong>Route:</strong> /console/projects/42/detail
          </p>
          {errorMessage ? (
            <p role="alert">
              <strong>Error:</strong> {errorMessage}
            </p>
          ) : (
            <p>Waiting for the provider route module to render.</p>
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
    </BrowserRouter>
  );
}
