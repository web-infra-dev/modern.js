import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

function RootBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return <div>ERROR: {error.status}</div>;
  }

  return <div>Something went wrong</div>;
}
export default RootBoundary;
