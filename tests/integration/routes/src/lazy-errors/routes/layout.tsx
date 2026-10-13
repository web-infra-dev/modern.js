import {
  Link,
  Outlet,
  useLocation,
  useNavigation,
} from '@modern-js/runtime/router';

export default function Layout() {
  const location = useLocation();
  const navigation = useNavigation();
  return (
    <div>
      <div
        className="lazy-route-status"
        data-pathname={location.pathname}
        data-navigation-state={navigation.state}
      />
      <Link to="module-error" className="module-error-link" prefetch="none">
        Module error
      </Link>
      <Link to="network-error" className="network-error-link" prefetch="none">
        Network error
      </Link>
      {/* Reset the boundary so transitions reveal the new route's fallback. */}
      <Outlet key={location.pathname} />
    </div>
  );
}
