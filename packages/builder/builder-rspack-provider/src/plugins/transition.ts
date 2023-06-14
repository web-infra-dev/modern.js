import type { BuilderPlugin } from '../types';

/**
 * Provide some temporary configurations for Rspack early transition
 */
export const builderPluginTransition = (): BuilderPlugin => ({
  name: 'builder-plugin-transition',

  setup() {
    process.env.RSPACK_CONFIG_VALIDATE = 'loose-silent';
  },
});
