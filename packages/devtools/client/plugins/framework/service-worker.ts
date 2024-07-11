import { AppTools, CliPlugin } from '@modern-js/app-tools';
import { rspack } from '@rsbuild/core';
import assert from 'assert';

export const serviceWorkerPlugin = (): CliPlugin<AppTools<'rspack'>> => ({
  name: 'service-worker',
  setup(_api) {
    return {
      beforeCreateCompiler({ bundlerConfigs }) {
        const configs = bundlerConfigs || [];
        const mainConfig = configs.find(({ target }) =>
          Array.isArray(target) ? target.includes('web') : target === 'web',
        );
        assert(mainConfig, 'Main config not found');
        configs.push({
          target: 'webworker',
          entry: './src/service-worker.ts',
          output: {
            filename: 'static/sw-devtools.js',
            uniqueName: 'modernjsDevtoolsSw',
          },
          optimization: {
            minimize: process.env.NODE_ENV === 'production',
          },
          plugins: [
            new rspack.DefinePlugin({
              'process.env.VERSION': JSON.stringify(
                require('../../package.json').version,
              ),
            }),
          ],
          module: mainConfig.module,
        });
      },
      config() {
        return {};
      },
    };
  },
});
