import React, { Suspense, lazy } from 'react';

const Home = lazy(() => import('./Home'));

const ShellError: React.FunctionComponent = () => {
  if (typeof window === 'undefined') {
    throw Error('shell error');
  }

  return (
    <div>
      <div>Shell Layout</div>
      <Suspense fallback={<div>loading home...</div>}>
        <Home />
      </Suspense>
    </div>
  );
};

export default ShellError;
