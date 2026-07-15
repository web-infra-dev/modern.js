import { useRouteError } from '@modern-js/runtime/router';

const BoomError = () => {
  const error = useRouteError() as Error;
  return <div>error: {error.message}</div>;
};

export default BoomError;
