import { useRouteError } from '@modern-js/runtime/router';

export default function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  return <div>Dang!</div>;
}
