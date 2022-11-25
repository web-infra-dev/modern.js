import type webpack from 'webpack';
import type { DevServerOptions } from '../../types';

export default class DevServerPlugin {
  private readonly options: DevServerOptions;

  constructor(options: DevServerOptions) {
    this.options = options;
  }

  injectHMRClient(compiler: webpack.Compiler) {
    const { client } = this.options;
    const host = client?.host ? `&host=${client.host}` : '';
    const path = client?.path ? `&path=${client.path}` : '';
    const port = client?.port ? `&port=${client.port}` : '';

    const clientEntry = `${require.resolve(
      './hmr-client',
    )}?${host}${path}${port}`;

    // use a hook to add entries if available
    new compiler.webpack.EntryPlugin(compiler.context, clientEntry, {
      name: undefined,
    }).apply(compiler);
  }

  apply(compiler: webpack.Compiler) {
    if (this.options.hot || this.options.liveReload) {
      this.injectHMRClient(compiler);
    }

    // Todo remove, client must inject.
    const compilerOptions = compiler.options;
    const { HotModuleReplacementPlugin } = compiler.webpack;
    compilerOptions.plugins = compilerOptions.plugins || [];

    if (
      !compilerOptions.plugins.find(
        p => p.constructor === HotModuleReplacementPlugin,
      )
    ) {
      // apply the HMR plugin, if it didn't exist before.
      const plugin = new HotModuleReplacementPlugin();

      plugin.apply(compiler);
    }
  }
}
