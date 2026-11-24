/**
 * Who calls the chunk loading right now. The router sets it around its own
 * route prefetch (`<Link prefetch>`), so the loading records tell those
 * requests apart from the application's `import()`. A separate module, so the
 * router does not import the scheduler.
 */
let current: 'link' | undefined;

export const getChunkRequestSource = () => current;

export const asRoutePrefetch = <T>(load: () => T): T => {
  current = 'link';
  try {
    return load();
  } finally {
    current = undefined;
  }
};
