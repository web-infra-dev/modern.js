import type { SharedBuilderConfig } from '@modern-js/builder-shared';

export type BuilderSourceConfig = Required<SharedBuilderConfig>['source'];

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
