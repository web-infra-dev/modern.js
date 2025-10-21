import { useRouteError } from '@modern-js/runtime/router';

export default function ErrorBoundary() {
  const error = useRouteError();
  return <div className="two-error">error: {(error as any)?.message}</div>;
}
