export * from './babel';

export type InternalPlugins = Record<
  string,
  string | { path: string; forced?: boolean }
>;

export type ServerPlugin = {
  /** The plugin package.json's name  */
  name: string;

  options?: Record<string, any>;
};

export type SSRMode = 'string' | 'stream' | false;
