import Webpack from 'webpack';
import { DEFAULT_DEV_OPTIONS } from '../constants';
import { DevServerOptions } from '../types';

const { EntryPlugin } = Webpack;
export default class DevServerPlugin {
  private readonly options: DevServerOptions;

  constructor(options: DevServerOptions) {
    this.options = options;
  }

  apply(compiler: Webpack.Compiler) {
    const { options } = this;

    const client = { ...DEFAULT_DEV_OPTIONS.client, ...options.client };

    const host = `&host=${client.host}`;
    const path = `&path=${client.path}`;
    const port = `&port=${client.port}`;

    const clientEntry = `${require.resolve(
      '@modern-js/hmr-client',
    )}?${host}${path}${port}`;
    const hotEntry = require.resolve('webpack/hot/dev-server');
    const additionalEntries = [clientEntry, hotEntry];

    // use a hook to add entries if available
    for (const additionalEntry of additionalEntries) {
      new EntryPlugin(compiler.context, additionalEntry, {
        name: undefined,
      }).apply(compiler);
    }

    // Todo remove, client must inject.
    const compilerOptions = compiler.options;
    compilerOptions.plugins = compilerOptions.plugins || [];

    if (
      hotEntry &&
      !compilerOptions.plugins.find(
        p => p.constructor === Webpack.HotModuleReplacementPlugin,
      )
    ) {
      // apply the HMR plugin, if it didn't exist before.
      const plugin = new Webpack.HotModuleReplacementPlugin();

      plugin.apply(compiler);
    }
  }
}
