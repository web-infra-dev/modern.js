import type { AliasOption } from '@modern-js/utils';

export type SourceLegacyUserConfig = {
  alias?: AliasOption;
  entries?: Record<
    string,
    | string
    | {
        entry: string;
        disableMount?: boolean;
      }
  >;
  mainEntryName?: string;
  preEntry?: string | string[];
  enableAsyncEntry?: boolean;
  /**
   * support entry.tsx entry
   */
  enableCustomEntry?: boolean;
  disableDefaultEntries?: boolean;
  entriesDir?: string;
  configDir?: string;
  apiDir?: string;
  envVars?: Array<string>;
  globalVars?: Record<string, string>;

  include?: Array<string | RegExp>;

  /**
   * @deprecated designSystem is no longer required.
   * If you are using Tailwind CSS, you can now use the `theme` option of Tailwind CSS, they are the same.
   */
  designSystem?: Record<string, any>;
};
