import type { BuilderConfig } from '@modern-js/builder-webpack-provider';

export type BuilderSourceConfig = Required<BuilderConfig>['source'];

export type Entry =
  | string
  | {
      entry: string;
      disableMount?: boolean;
    };

export type Entries = Record<string, Entry>;

export interface SourceUserConfig extends BuilderSourceConfig {
  entries?: Entries;
  enableAsyncEntry?: boolean;
  disableDefaultEntries?: boolean;
  entriesDir?: string;
  disableEntryDirs?: string[];
  configDir?: string;
  /**
   * The configuration of `source.designSystem` is provided by `tailwindcss` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   * @requires `tailwindcss` plugin
   */
  designSystem?: Record<string, any>;
}

export type SourceNormalizedConfig = SourceUserConfig;
