import { registerRemoteServerCallback } from './registerServerCallback';

if (typeof window !== 'undefined') {
  const actionPathname = window.location.pathname || '/';
  registerRemoteServerCallback(
    `${window.location.origin}${actionPathname}`,
    'rscRemote',
  );
}
