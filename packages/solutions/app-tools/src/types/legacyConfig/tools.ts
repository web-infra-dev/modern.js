import type { DevServerOptions } from '@modern-js/types';
import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { JestConfig } from '@modern-js/core';

// FIXME: need definition by itself.
type BuilderToolsConfig = Required<BuilderConfig>['tools'];
export type ToolsLegacyUserConfig = BuilderToolsConfig & {
  esbuild?: Record<string, unknown>;
  devServer?: DevServerOptions;
  /**
   * The configuration of `tools.tailwindcss` is provided by `tailwindcss` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   * @requires `tailwindcss` plugin
   */
  tailwindcss?:
    | Record<string, any>
    | ((options: Record<string, any>) => Record<string, any> | void);
  jest?: JestConfig | ((jestConfig: JestConfig) => JestConfig);
};
