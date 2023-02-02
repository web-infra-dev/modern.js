import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { BuilderConfig as RsBuilderConfig } from '@modern-js/builder-rspack-provider';
import type { SharedSourceConfig as BuilderSharedSourceConfig } from '@modern-js/builder-shared';

export type BuilderSourceConfig = NonNullable<BuilderConfig['source']>;
export type RsBuilderSourceConfig = NonNullable<RsBuilderConfig['source']>;

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

export interface SourceUserConfig
  extends BuilderSourceConfig,
    SharedSourceConfig {}

export interface RsSourceUserConfig
  extends RsBuilderSourceConfig,
    SharedSourceConfig {}
