import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { JestConfig } from '@modern-js/core';
import type { PluginSwcOptions } from '@modern-js/builder-plugin-swc';
import type { PluginEsbuildOptions } from '@modern-js/builder-plugin-esbuild';
import type { BuilderConfig as RsBuilderConfig } from '@modern-js/builder-rspack-provider';
import type { SharedToolsConfig as BuilderSharedToolsConfig } from '@modern-js/builder-shared';
import type { UnwrapBuilderConfig } from '../utils';

export type BuilderToolsConfig = UnwrapBuilderConfig<BuilderConfig, 'tools'> & {
  esbuild?: PluginEsbuildOptions;
};
export type RsBuilderToolsConfig = UnwrapBuilderConfig<
  RsBuilderConfig,
  'source'
>;
/**
 * The configuration of `tools.tailwindcss` is provided by `tailwindcss` plugin.
 * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
 * @requires `tailwindcss` plugin
 */
export type Tailwindcss =
  | Record<string, any>
  | ((options: Record<string, any>) => Record<string, any> | void);

export interface SharedToolsConfig extends BuilderSharedToolsConfig {
  tailwindcss?: Tailwindcss;
  jest?: JestConfig | ((jestConfig: JestConfig) => JestConfig);
  /**
   * The configuration of `swc` is provided by `swc` plugin.
   * @requires `swc` plugin
   */
  swc?: PluginSwcOptions;
}
export interface ToolsUserConfig
  extends BuilderToolsConfig,
    SharedToolsConfig {}

export interface RsToolsUserConfig
  extends SharedToolsConfig,
    RsBuilderToolsConfig {}
