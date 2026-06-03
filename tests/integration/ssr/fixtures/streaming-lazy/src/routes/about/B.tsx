import loadable from '@modern-js/runtime/loadable';
import { Suspense, lazy } from 'react';
import './b.css';

const C = lazy(() => import('./C'));
const D = loadable(() => import('./D'), {
  fallback: <div>Loading D...</div>,
});

export default () => {
  return (
    <div className="b-deep">
      <div>B content</div>
      <Suspense fallback={<div>Loading C...</div>}>
        <C />
      </Suspense>
      <D />
    </div>
  );
};
