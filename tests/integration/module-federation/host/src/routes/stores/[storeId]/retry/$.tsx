import { createModernReactRemote } from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';
export default createModernReactRemote({
  remote: () => loadRemote('provider/RetryProductApp'),
  fallback: ({ error, retry }) => (
    <button data-testid="route-retry" onClick={retry}>
      {error.message}
    </button>
  ),
});
