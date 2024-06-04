import { isRouteErrorResponse, useRouteError } from '@modern-js/runtime/router';

const ErrorBoundary = () => {
  const error = useRouteError() as Error;
  return (
    <div className="error">
      <h2>
        {isRouteErrorResponse(error)
          ? JSON.stringify({
              status: error.status,
              statusText: error.statusText,
              data: {
                messsage: error.data.message,
              },
            })
          : error.message}
      </h2>
    </div>
  );
};
export default ErrorBoundary;
