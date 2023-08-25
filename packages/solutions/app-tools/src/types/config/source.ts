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
      /**
       * The entry file path.
       */
      entry: string;
      /**
       * Disable framework's behavior of automatically generating entry code.
       */
      disableMount?: boolean;
      /**
       * Specify the file path of custom bootstrap.
       */
      customBootstrap?: string;
    };

export type Entries = Record<string, Entry>;

export interface SharedSourceConfig extends BuilderSharedSourceConfig {
  /**
   * Used to configure custom page entries.
   */
  entries?: Entries;
  /**
   * Used to configure the main entry name.
   * @default 'main'
   */
  mainEntryName?: string;
  /**
   * This option is used for Module Federation scenario.
   * When this option is enabled, framework will wrap the automatically generated entry files with dynamic import.
   * @default false
   */
  enableAsyncEntry?: boolean;
  /**
   * Used to disable the functionality of automatically identifying page entry points based on directory structure.
   * @default false
   */
  disableDefaultEntries?: boolean;
  /**
   * By default, framework scans the src directory to identify page entries.
   * You can customize the directory used for identifying page entries with this option.
   */
  entriesDir?: string;
  /**
   * By default, framework identifies the application entry point based on the `src` directory.
   * You can use this option to prevent some directories from being recognized as application entry points.
   */
  disableEntryDirs?: string[];
  /**
   * Customize the directory of the framework configuration files.
   */
  configDir?: string;
  /**
   * @deprecated designSystem is no longer required.
   * If you are using Tailwind CSS, you can now use the `theme` option of Tailwind CSS, they are the same.
   */
  designSystem?: Record<string, any>;
}

export type SourceUserConfig = BuilderSourceConfig & SharedSourceConfig;

export type RsSourceUserConfig = RsBuilderSourceConfig & SharedSourceConfig;
