// warmup bundle in production env
import { checkIsProd } from './utils';

export function warmup(bundles: Array<string | undefined>) {
  if (checkIsProd()) {
    bundles.forEach(bundle => {
      try {
        bundle && import(bundle);
      } catch (_) {
        // ignore errors, if we can't import the bundle
        // such as: the bundle is not exists.
      }
    });
  }
}
