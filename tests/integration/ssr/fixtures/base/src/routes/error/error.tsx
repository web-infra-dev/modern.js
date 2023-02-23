import { isRouteErrorResponse, useRouteError } from '@modern-js/runtime/router';

const ErrorBoundary = () => {
  const error = useRouteError() as Error;
  return (
    <div>
      <h2>
        {isRouteErrorResponse(error) ? JSON.stringify(error) : error.message}
      </h2>
    </div>
  );
};
export default ErrorBoundary;
