export * from './babel';

export type InternalPlugins = Record<
  string,
  string | { path: string; forced?: boolean }
>;

export type SSRMode = 'string' | 'stream';
