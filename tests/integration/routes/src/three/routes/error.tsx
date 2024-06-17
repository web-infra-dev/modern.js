import { useRouteError, isRouteErrorResponse } from '@modern-js/runtime/router';

export default function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <div className="response-status">{error.status}</div>
        <div className="response-content">{JSON.parse(error.data).message}</div>
      </div>
    );
  } else {
    return (
      <div className="error-content">
        {(error as any).message || (error as any).data}
      </div>
    );
  }
}
