import { Suspense, lazy, useState } from 'react';
import './page.css';

// Rendered by SSR inside Suspense, so its CSS is needed in the shell.
const Shown = lazy(() => import('./shown'));

export default function Page() {
  const [Dialog, setDialog] = useState<null | React.ComponentType>(null);
  return (
    <div className="css-scope-page">
      CSS scope page
      <Suspense fallback={<div>Loading...</div>}>
        <Shown />
      </Suspense>
      {/* Only imported after a click, never rendered by SSR. */}
      <button
        type="button"
        onClick={() => import('./dialog').then(m => setDialog(() => m.default))}
      >
        open
      </button>
      {Dialog ? <Dialog /> : null}
    </div>
  );
}
