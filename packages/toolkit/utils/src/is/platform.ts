export const isNodeJS = (): boolean =>
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null &&
  process.versions.electron == null;

export const isBrowser = () => typeof window !== undefined;
