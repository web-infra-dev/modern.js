if (typeof window !== 'undefined') {
  // Fixture-level bootstrap: keep callback wiring out of exposed modules while
  // ensuring browser-evaluated federated code always posts bridge action IDs to host.
  void import('./registerServerCallback').then(
    ({ registerRemoteServerCallback }) => {
      const actionPathname = window.location.pathname || '/';
      registerRemoteServerCallback(
        `${window.location.origin}${actionPathname}`,
        'rscRemote',
      );
    },
  );
}
