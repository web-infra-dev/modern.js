import { webpack } from '@modern-js/webpack';
import { DevServerOptions } from '../types';

const { EntryPlugin } = webpack;
export default class DevServerPlugin {
  private readonly options: DevServerOptions;

  constructor(options: DevServerOptions) {
    this.options = options;
  }

  apply(compiler: webpack.Compiler) {
    const { client } = this.options;

    const host = client.host ? `&host=${client.host}` : '';
    const path = client.path ? `&path=${client.path}` : '';
    const port = client.port ? `&port=${client.port}` : '';

    const clientEntry = `${require.resolve(
      '@modern-js/hmr-client',
    )}?${host}${path}${port}`;
    const additionalEntries = [clientEntry];

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
      !compilerOptions.plugins.find(
        p => p.constructor === webpack.HotModuleReplacementPlugin,
      )
    ) {
      // apply the HMR plugin, if it didn't exist before.
      const plugin = new webpack.HotModuleReplacementPlugin();

      plugin.apply(compiler);
    }
  }
}
