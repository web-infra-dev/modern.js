import { Suspense, lazy } from 'react';
import './dialog.css';

const Deep = lazy(() => import('./deep'));

export default function Dialog() {
  return (
    <div className="css-scope-dialog">
      Dialog
      <Suspense fallback={null}>
        <Deep />
      </Suspense>
    </div>
  );
}
