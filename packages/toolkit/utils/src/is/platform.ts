export const isNodeJS = (): boolean =>
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null &&
  (process.versions as any).electron == null;

export const isBrowser = (): boolean => typeof window !== 'undefined';
