import type { BuilderConfig } from '@modern-js/builder-webpack-provider';

export type BuilderSourceConfig = Required<BuilderConfig>['source'];

export type Entry =
  | string
  | {
      entry: string;
      enableFileSystemRoutes?: boolean;
      disableMount?: boolean;
    };

export type Entries = Record<string, Entry>;

export interface SourceUserConfig extends BuilderSourceConfig {
  entries?: Entries;
  enableAsyncEntry?: boolean;
  disableDefaultEntries?: boolean;
  entriesDir?: string;
  configDir?: string;
}

export type SourceNormalizedConfig = Omit<
  SourceUserConfig,
  'alias' | 'moduleScopes'
>;
