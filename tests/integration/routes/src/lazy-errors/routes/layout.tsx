import {
  Link,
  Outlet,
  useFetcher,
  useLocation,
  useNavigation,
} from '@modern-js/runtime/router';

export default function Layout() {
  const location = useLocation();
  const navigation = useNavigation();
  const fetcher = useFetcher();
  return (
    <div>
      <div
        className="lazy-route-status"
        data-pathname={location.pathname}
        data-navigation-state={navigation.state}
      />
      <Link to="/" className="lazy-home-link" prefetch="none">
        Home
      </Link>
      <Link to="module-error" className="module-error-link" prefetch="none">
        Module error
      </Link>
      <Link to="network-error" className="network-error-link" prefetch="none">
        Network error
      </Link>
      <Link to="preload-retry" className="preload-retry-link" prefetch="none">
        Preload retry
      </Link>
      <button
        type="button"
        className="fetch-route-data"
        onClick={() => fetcher.load('/preload-retry')}
      >
        Fetch route data
      </button>
      <output className="route-fetcher" data-state={fetcher.state} />
      {/* Reset the boundary so transitions reveal the new route's fallback. */}
      <Outlet key={location.pathname} />
    </div>
  );
}
