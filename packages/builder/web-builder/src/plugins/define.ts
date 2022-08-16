import _ from '@modern-js/utils/lodash';
import type { BuilderPlugin } from '../types';

const builtinVars = ['NODE_ENV'];

export const PluginEntry = (): BuilderPlugin => ({
  name: 'web-builder-plugin-define',

  async setup(api) {
    const { DefinePlugin } = await import('webpack');
    const config = api.getBuilderConfig();
    const globalVars = config.source?.globalVars || {};

    // Add built-in vars
    for (const varName of builtinVars) {
      const varValue = process.env[varName];
      varValue && (globalVars[varName] = varValue);
    }

    // Serialize global vars
    const serializedVars = _.mapValues(globalVars, value =>
      JSON.stringify(value),
    );

    // Apply define plugin
    api.modifyWebpackChain(async chain => {
      chain.plugin('define').use(DefinePlugin, [serializedVars]);
    });
  },
});
