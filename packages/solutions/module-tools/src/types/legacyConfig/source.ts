import type { AliasOption } from '../config';

export type SourceLegacyUserConfig = {
  alias?: AliasOption;
  envVars?: Array<string>;
  globalVars?: Record<string, string>;
  jsxTransformRuntime?: 'automatic' | 'classic';
  /**
   * @deprecated designSystem is no longer required.
   * If you are using Tailwind CSS, you can now use the `theme` option of Tailwind CSS, they are the same.
   */
  designSystem?: Record<string, any>;
};
