import type { SharedSourceConfig as BuilderSharedSourceConfig } from '@modern-js/builder-shared';
import type {
  WebpackBuilderConfig,
  RspackBuilderConfig,
} from '../../builder/shared';

export type BuilderSourceConfig = NonNullable<WebpackBuilderConfig['source']>;
export type RsBuilderSourceConfig = NonNullable<RspackBuilderConfig['source']>;

export type Entry =
  | string
  | {
      entry: string;
      disableMount?: boolean;
      customBootstrap?: string;
    };

export type Entries = Record<string, Entry>;

export interface SharedSourceConfig extends BuilderSharedSourceConfig {
  entries?: Entries;
  mainEntryName?: string;
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

export type SourceUserConfig = BuilderSourceConfig & SharedSourceConfig;

export type RsSourceUserConfig = RsBuilderSourceConfig & SharedSourceConfig;
