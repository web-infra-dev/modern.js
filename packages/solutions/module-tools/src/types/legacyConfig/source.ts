import type { AliasOption } from '../config';

export type SourceLegacyUserConfig = {
  alias?: AliasOption;
  envVars?: Array<string>;
  globalVars?: Record<string, string>;
  jsxTransformRuntime?: 'automatic' | 'classic';
  /**
   * The configuration of `source.designSystem` is provided by `tailwindcss` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   * @requires `tailwindcss` plugin
   */
  designSystem?: Record<string, any>;
};
