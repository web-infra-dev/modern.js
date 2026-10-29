import { useRouteError } from '@modern-js/runtime/router';

export default function ErrorBoundary() {
  const error = useRouteError() as Error;
  return <pre id="route-error">{`${error.name}: ${error.message}`}</pre>;
}
