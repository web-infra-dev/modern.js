import {
  Link,
  Outlet,
  useLocation,
  useMemoryRoute,
  useNavigate,
} from '@modern-js/runtime/router';

export default function MemoryLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const memory = useMemoryRoute();

  return (
    <main data-testid="memory-layout">
      <p data-testid="memory-enabled">
        memory-enabled:{String(memory.enabled)}
      </p>
      <p data-testid="memory-location">
        {location.pathname}
        {location.search}
      </p>
      <button
        type="button"
        data-testid="memory-back"
        onClick={() => navigate(-1)}
      >
        Back
      </button>
      <Link data-testid="memory-to-home" to="/">
        Home
      </Link>
      <Link data-testid="memory-to-user-99" to="/user/99?tab=next">
        User 99
      </Link>
      <Outlet />
    </main>
  );
}
