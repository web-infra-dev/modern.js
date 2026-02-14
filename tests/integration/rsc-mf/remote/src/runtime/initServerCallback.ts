let callbackBootstrapPromise: Promise<void> | undefined;
const MAX_CALLBACK_BOOTSTRAP_RETRIES = 2;
let callbackBootstrapRetryCount = 0;
const scheduleRetryTask = (task: () => void) => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(task);
    return;
  }

  void Promise.resolve().then(task);
};

const bootstrapServerCallback = () => {
  if (!callbackBootstrapPromise) {
    callbackBootstrapPromise = import('./registerServerCallback').then(
      ({ registerRemoteServerCallback }) => {
        registerRemoteServerCallback(
          `${window.location.origin}${window.location.pathname}`,
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
      scheduleRetryTask(() => {
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
