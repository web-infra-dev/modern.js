import { Link } from '@modern-js/runtime/router';

if (typeof window === 'undefined') {
  const error = new Error('SSR_ROUTE_MODULE_INIT_FAILED');
  error.name = 'RouteModuleLoadError';
  throw error;
}

export default function Page() {
  return (
    <div>
      <p id="module-error-client">Route module rendered on the client</p>
      <Link to="/chunk-error" id="chunk-error-link">
        Load route chunk
      </Link>
    </div>
  );
}
