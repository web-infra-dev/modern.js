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
        className="loadable-route-status"
        data-pathname={location.pathname}
        data-navigation-state={navigation.state}
      />
      <Link to="/" className="loadable-home-link" prefetch="none">
        Home
      </Link>
      <Link to="module-error" className="module-error-link" prefetch="none">
        Module error
      </Link>
      <Link to="network-error" className="network-error-link" prefetch="none">
        Network error
      </Link>
      <button
        className="fetch-loadable-data"
        onClick={() => fetcher.load('/network-error')}
      >
        Fetch route data
      </button>
      <output className="loadable-fetcher" data-state={fetcher.state} />
      <Outlet />
    </div>
  );
}
