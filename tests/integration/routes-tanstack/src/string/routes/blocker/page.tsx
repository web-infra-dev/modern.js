import { Link, useBlocker } from '@modern-js/runtime/tanstack-router';
import { useState } from 'react';

export default function BlockerPage() {
  const [dirty, setDirty] = useState(true);
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    withResolver: true,
  });

  return (
    <div id="blocker-page">
      <div id="blocker-dirty">{dirty ? 'dirty' : 'clean'}</div>
      <button
        type="button"
        data-testid="toggle-dirty"
        onClick={() => {
          setDirty(value => !value);
        }}
      >
        toggle-dirty
      </button>

      <Link to="/" data-testid="blocker-leave-link">
        leave-home
      </Link>

      {blocker.status === 'blocked' ? (
        <div data-testid="blocker-controls">
          <button
            type="button"
            data-testid="blocker-stay"
            onClick={() => {
              blocker.reset();
            }}
          >
            stay
          </button>
          <button
            type="button"
            data-testid="blocker-proceed"
            onClick={() => {
              blocker.proceed();
            }}
          >
            proceed
          </button>
        </div>
      ) : null}
    </div>
  );
}
