import Webpack from 'webpack';
import { DevServerOptions } from '../type';

const { EntryPlugin } = Webpack;
export default class DevServerPlugin {
  private readonly options: DevServerOptions;

  constructor(options: DevServerOptions) {
    this.options = options;
  }

  apply(compiler: Webpack.Compiler) {
    const { options } = this;

    const host = `&host=${options.client.host || 'localhost'}`;
    const path = `&path=${options.client.path}`;
    const port = `&port=${options.client.port}`;

    // Todo @songzhenwei
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
