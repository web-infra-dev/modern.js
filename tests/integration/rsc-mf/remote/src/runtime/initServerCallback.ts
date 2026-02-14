import { registerRemoteServerCallback } from '../components/registerServerCallback';

if (typeof window !== 'undefined') {
  // Fixture-level bootstrap: make federated client actions post back through
  // host route using bridge-prefixed ids without requiring host userland wiring.
  const actionPathname = window.location.pathname || '/';
  registerRemoteServerCallback(
    `${window.location.origin}${actionPathname}`,
    'rscRemote',
  );
}
