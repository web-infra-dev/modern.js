import type { BuilderPlugin } from '../types';
import _ from '@modern-js/utils/lodash';

export const PluginReact = (): BuilderPlugin => ({
  name: 'builder-plugin-react',

  setup(api) {
    api.modifyRspackConfig(async rspackConfig => {
      // todo
      _.set(rspackConfig, 'builtins.react', {
        development: true,
        refresh: false,
      });
    });
  },
});
