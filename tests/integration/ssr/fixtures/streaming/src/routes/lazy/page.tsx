import { Suspense, lazy } from 'react';
import './index.css';

const LazyComponent = lazy(() => import('./lazy'));

export default function Page() {
  return (
    <div className="color">
      Lazy page
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>
    </div>
  );
}
