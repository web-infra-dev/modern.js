import { useRouteError } from '@modern-js/runtime/router';

export default function ErrorBoundary() {
  const error = useRouteError() as Error & {
    code?: string;
    request?: string;
    type?: string;
  };

  return (
    <pre className="lazy-route-error">
      {JSON.stringify({
        name: error.name,
        message: error.message,
        code: error.code,
        request: error.request,
        type: error.type,
      })}
    </pre>
  );
}
