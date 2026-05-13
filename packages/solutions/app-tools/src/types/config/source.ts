import type { BuilderConfig } from '@modern-js/builder';

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
       * use src/{entryName}/entry.tsx to custom entry
       */
      customEntry?: boolean;
    };

export type Entries = Record<string, Entry>;

export interface SourceUserConfig extends NonNullable<BuilderConfig['source']> {
  /**
   * Add code before each page entry. It will be executed before the page code.
   * @default []
   */
  preEntry?: string | string[];
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
   * When enabled, framework will inject `source.preEntry` into the top of the
   * auto-generated entry file (`index.jsx`) and will not pass `source.preEntry`
   * to builder config.
   * This is useful when `source.enableAsyncEntry` is enabled and you still want
   * preEntry to run before the real entry code.
   * @default false
   */
  enableAsyncPreEntry?: boolean;
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
   * Customize the directory of the framework configuration files.
   */
  configDir?: string;
}
