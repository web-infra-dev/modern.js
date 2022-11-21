export type LegacySourceUserConfig = {
  entries?: Record<
    string,
    | string
    | {
        entry: string;
        enableFileSystemRoutes?: boolean;
        disableMount?: boolean;
      }
  >;
  preEntry?: string | string[];
  enableAsyncEntry?: boolean;
  disableDefaultEntries?: boolean;
  entriesDir?: string;
  configDir?: string;
  apiDir?: string;
  envVars?: Array<string>;
  globalVars?: Record<string, string>;
  moduleScopes?:
    | Array<string | RegExp>
    | (
        | ((scopes: Array<string | RegExp>) => void)
        | ((scopes: Array<string | RegExp>) => Array<string | RegExp>)
      )[]
    | ((scopes: Array<string | RegExp>) => Array<string | RegExp>)
    | ((scopes: Array<string | RegExp>) => void);

  include?: Array<string | RegExp>;

  /**
   * The configuration of `source.designSystem` is provided by `tailwindcss` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   * @requires `tailwindcss` plugin
   */
  designSystem?: Record<string, any>;
};
