let callbackBootstrapPromise: Promise<void> | undefined;

const bootstrapServerCallback = () => {
  if (!callbackBootstrapPromise) {
    callbackBootstrapPromise = import('./registerServerCallback').then(
      ({ registerRemoteServerCallback }) => {
        const actionPathname = window.location.pathname || '/';
        registerRemoteServerCallback(
          `${window.location.origin}${actionPathname}`,
          'rscRemote',
        );
      },
    );
    callbackBootstrapPromise.catch(() => {
      callbackBootstrapPromise = undefined;
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
