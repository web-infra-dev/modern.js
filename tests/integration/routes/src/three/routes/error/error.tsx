import { useRouteError } from '@modern-js/runtime/router';

export default function ErrorBoundary() {
  const error = useRouteError() as { data: string };
  return <div className="error-case">{error.data}</div>;
}
