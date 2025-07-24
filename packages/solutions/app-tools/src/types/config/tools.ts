import type { BuilderConfig } from '@modern-js/builder';
import type { JestConfig } from '@modern-js/types';
import type { UnwrapBuilderConfig } from '../utils';

export type Tailwindcss =
  | Record<string, any>
  | ((options: Record<string, any>) => Record<string, any> | void);

type BuilderToolsConfig = UnwrapBuilderConfig<BuilderConfig, 'tools'>;

export interface ToolsUserConfig extends Omit<BuilderToolsConfig, 'swc'> {
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
  swc?: BuilderToolsConfig['swc'];
}
