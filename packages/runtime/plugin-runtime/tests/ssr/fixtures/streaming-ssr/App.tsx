import type React from 'react';
import { Suspense, lazy } from 'react';

const Home = lazy(() => import('./Home'));

const App: React.FunctionComponent = () => {
  return (
    <>
      <div>
        <div>App Layout</div>
        <Suspense fallback={<div>loading home...</div>}>
          <Home />
        </Suspense>
      </div>
      {'<!--<?- SHELL_STREAM_END ?>-->'}
    </>
  );
};

export default App;
