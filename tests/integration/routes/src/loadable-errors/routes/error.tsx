import { Link } from '@modern-js/runtime/router';
import RouteError from '../../lazy-errors/routes/error';

export default function ErrorBoundary() {
  return (
    <>
      <Link to="/" className="loadable-home-link" prefetch="none">
        Home
      </Link>
      <RouteError />
    </>
  );
}
