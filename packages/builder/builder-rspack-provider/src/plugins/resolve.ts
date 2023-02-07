import type { BuilderPlugin } from '../types';
import {
  setConfig,
  applyBuilderResolvePlugin,
} from '@modern-js/builder-shared';

export const builderPluginResolve = (): BuilderPlugin => ({
  name: 'builder-plugin-resolve',

  setup(api) {
    applyBuilderResolvePlugin(api);

    api.modifyRspackConfig(async rspackConfig => {
      const isTsProject = Boolean(api.context.tsconfigPath);

      if (isTsProject) {
        setConfig(
          rspackConfig,
          'resolve.tsConfigPath',
          api.context.tsconfigPath,
        );
      }
    });
  },
});
