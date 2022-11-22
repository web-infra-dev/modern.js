import type { DevServerOptions } from '@modern-js/types';
import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { JestConfig } from '@modern-js/core';

export type BuilderToolsConfig = Required<BuilderConfig>['tools'];

/**
 * The configuration of `tools.tailwindcss` is provided by `tailwindcss` plugin.
 * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
 * @requires `tailwindcss` plugin
 */
export type Tailwindcss =
  | Record<string, any>
  | ((options: Record<string, any>) => Record<string, any> | void);

export interface ToolsUserConfig extends BuilderToolsConfig {
  devServer?: DevServerOptions;
  tailwindcss?: Tailwindcss;
  jest?: JestConfig | ((jestConfig: JestConfig) => JestConfig);
}

export type ToolsNormalizedConfig = ToolsUserConfig;
