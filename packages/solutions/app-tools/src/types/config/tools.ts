import type { JestConfig } from '@modern-js/types';
import type { PluginSwcOptions } from '@rsbuild/plugin-swc';
import type { PluginEsbuildOptions } from '@rsbuild/plugin-esbuild';
import type { BuilderConfig } from '@modern-js/uni-builder';
import type { UnwrapBuilderConfig } from '../utils';

export type Tailwindcss =
  | Record<string, any>
  | ((options: Record<string, any>) => Record<string, any> | void);

export interface ToolsUserConfig
  extends UnwrapBuilderConfig<BuilderConfig, 'tools'> {
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

  /**
   * Used to custom Esbuild configurations.
   * @requires `esbuild` plugin.
   * The configuration of `esbuild` is provided by `esbuild` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   */
  esbuild?: PluginEsbuildOptions;
}
