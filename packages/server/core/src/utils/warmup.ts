export function warmup(bundles: Array<string | undefined>) {
  bundles.forEach(bundle => {
    bundle &&
      import(bundle).catch(_ => {
        // ignore errors, if we can't import the bundle
        // such as: the bundle is not exists.
      });
  });
}
