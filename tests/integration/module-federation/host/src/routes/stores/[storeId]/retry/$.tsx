import { createModernReactRemote } from '@modern-js/runtime/mf';
export default createModernReactRemote({
  remote: 'provider/RetryProductApp',
  fallback: ({ error, retry }) => (
    <button data-testid="route-retry" onClick={retry}>
      {error.message}
    </button>
  ),
});
