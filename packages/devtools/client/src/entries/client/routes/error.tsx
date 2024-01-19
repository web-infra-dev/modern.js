import { useRouteError } from '@modern-js/runtime/router';

const ErrorBoundary = () => {
  const error = useRouteError();
  if (error instanceof Error) {
    return (
      <div>
        <h1>{error.name}</h1>
        <h2>{error.message}</h2>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    return (
      <div>
        <h1>Unknown Error</h1>
        <h2>{Object.toString.call(error)}</h2>
      </div>
    );
  }
};
export default ErrorBoundary;
