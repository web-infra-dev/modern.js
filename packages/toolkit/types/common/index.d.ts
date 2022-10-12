export type InternalPlugins = Record<
  string,
  string | { path: string; forced?: boolean }
>;
