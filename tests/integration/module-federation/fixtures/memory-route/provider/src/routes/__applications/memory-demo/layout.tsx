import {
  Link,
  Outlet,
  useLocation,
  useMemoryRoute,
  useNavigate,
} from '@modern-js/runtime/router';
import { useState } from 'react';

export default function MemoryDemoLayout({ label }: { label?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const memory = useMemoryRoute();
  const [count, setCount] = useState(0);

  return (
    <article
      data-testid="memory-demo-root"
      data-memory-enabled={String(memory.enabled)}
      data-memory-basename={memory.basename ?? ''}
      data-memory-index={String(memory.initialIndex ?? '')}
      data-memory-entries={String(memory.initialEntries?.length ?? 0)}
    >
      <p data-testid="memory-demo-label">{label ?? 'unnamed'}</p>
      <p data-testid="memory-demo-location">
        {location.pathname}
        {location.search}
        {location.hash}
      </p>
      <button
        type="button"
        data-testid="memory-demo-count"
        onClick={() => setCount(value => value + 1)}
      >
        Count: {count}
      </button>
      <button
        type="button"
        data-testid="memory-demo-back"
        onClick={() => navigate(-1)}
      >
        Back
      </button>
      <Link data-testid="memory-demo-home-link" to=".">
        Home
      </Link>
      <Link
        data-testid="memory-demo-next-link"
        to="detail/99?tab=client&probe=client-nav"
      >
        Detail 99
      </Link>
      <Outlet />
    </article>
  );
}
