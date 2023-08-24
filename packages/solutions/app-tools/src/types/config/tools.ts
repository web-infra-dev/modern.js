import type { JestConfig } from '@modern-js/types';
import type { PluginSwcOptions } from '@modern-js/builder-plugin-swc';
import type { PluginEsbuildOptions } from '@modern-js/builder-plugin-esbuild';
import type { SharedToolsConfig as BuilderSharedToolsConfig } from '@modern-js/builder-shared';
import type { UnwrapBuilderConfig } from '../utils';
import type {
  WebpackBuilderConfig,
  RspackBuilderConfig,
} from '../../builder/shared';

export type BuilderToolsConfig = UnwrapBuilderConfig<
  WebpackBuilderConfig,
  'tools'
> & {
  esbuild?: PluginEsbuildOptions;
};
export type RsBuilderToolsConfig = UnwrapBuilderConfig<
  RspackBuilderConfig,
  'tools'
>;
export type Tailwindcss =
  | Record<string, any>
  | ((options: Record<string, any>) => Record<string, any> | void);

export interface SharedToolsConfig extends BuilderSharedToolsConfig {
  /**
   * Used to custom Tailwind CSS configurations.
   * @requires `tailwindcss` plugin.
   * The configuration of `tools.tailwindcss` is provided by `tailwindcss` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   */
  tailwindcss?: Tailwindcss;

  /**
   * Used to custom Jest configurations.
   * @requires `test` plugin.
   * The configuration of `tools.jest` is provided by `test` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   */
  jest?: JestConfig | ((jestConfig: JestConfig) => JestConfig);

  /**
   * Used to custom SWC configurations.
   * @requires `swc` plugin.
   * The configuration of `swc` is provided by `swc` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   */
  swc?: PluginSwcOptions<'outer'>;
}

export interface ToolsUserConfig
  extends BuilderToolsConfig,
    SharedToolsConfig {}

export interface RsToolsUserConfig
  extends SharedToolsConfig,
    RsBuilderToolsConfig {}
