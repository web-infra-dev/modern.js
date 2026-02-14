let callbackBootstrapPromise: Promise<void> | undefined;
const MAX_CALLBACK_BOOTSTRAP_RETRIES = 2;
let callbackBootstrapRetryCount = 0;

const bootstrapServerCallback = () => {
  if (!callbackBootstrapPromise) {
    callbackBootstrapPromise = import('./registerServerCallback').then(
      ({ registerRemoteServerCallback }) => {
        const actionPathname = window.location.pathname || '/';
        registerRemoteServerCallback(
          `${window.location.origin}${actionPathname}`,
        );
        callbackBootstrapRetryCount = 0;
      },
    );
    callbackBootstrapPromise.catch(() => {
      callbackBootstrapPromise = undefined;
      if (callbackBootstrapRetryCount >= MAX_CALLBACK_BOOTSTRAP_RETRIES) {
        return;
      }
      callbackBootstrapRetryCount += 1;
      queueMicrotask(() => {
        void bootstrapServerCallback();
      });
    });
  }

  return callbackBootstrapPromise;
};

if (typeof window !== 'undefined') {
  // Fixture-level bootstrap: keep callback wiring out of exposed modules while
  // ensuring browser-evaluated federated code always posts bridge action IDs to host.
  // Promise memoization avoids duplicate bootstrap work when multiple exposes
  // import this runtime helper in the same browser session.
  void bootstrapServerCallback();
}
