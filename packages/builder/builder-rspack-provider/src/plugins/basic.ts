import type { BuilderPlugin } from '../types';
import { applyBuilderBasicPlugin } from '@modern-js/builder-shared';

/**
 * Provide some basic configs of rspack
 */
export const builderPluginBasic = (): BuilderPlugin => ({
  name: 'builder-plugin-basic',

  setup(api) {
    applyBuilderBasicPlugin(api);
  },
});
