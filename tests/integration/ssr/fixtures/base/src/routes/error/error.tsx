import { useRouteError } from '@modern-js/runtime/router';

const ErrorBoundary = () => {
  const error = useRouteError() as Error;
  return (
    <div className="error">
      <h2>{error.message}</h2>
    </div>
  );
};
export default ErrorBoundary;
