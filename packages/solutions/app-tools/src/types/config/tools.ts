import type { BuilderConfig } from '@modern-js/builder';
import type { UnwrapBuilderConfig } from '../utils';

type BuilderToolsConfig = UnwrapBuilderConfig<BuilderConfig, 'tools'>;

export interface ToolsUserConfig extends Omit<BuilderToolsConfig, 'swc'> {
  /**
   * Used to custom SWC configurations.
   * @requires `swc` plugin.
   * The configuration of `swc` is provided by `swc` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   */
  swc?: BuilderToolsConfig['swc'];
}
