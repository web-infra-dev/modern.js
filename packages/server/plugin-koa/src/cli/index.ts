import * as path from 'path';
import type { AppTools } from '@modern-js/app-tools';
import type { CliPlugin } from '@modern-js/core';
import { fs, createRuntimeExportsUtils } from '@modern-js/utils';

export const koaPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-koa',
  setup: api => {
    let bffExportsUtils: any;
    const { useAppContext } = api;
    const runtimeModulePath = path.resolve(__dirname, '../runtime');
    return {
      config() {
        const appContext = useAppContext();
        bffExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'server',
        );

        const existSrcDir = fs.existsSync(appContext.srcDirectory);
        const runtimePath = '@modern-js/plugin-koa/runtime';
        const alias =
          process.env.NODE_ENV === 'production' || !existSrcDir
            ? runtimePath
            : require.resolve(runtimePath);

        return {
          output: {
            externals: {
              '@modern-js/runtime/koa': runtimePath,
            },
          },
          source: {
            alias: {
              '@modern-js/runtime/server$': alias,
              '@modern-js/runtime/koa': alias,
            },
          },
        };
      },

      _internalServerPlugins({ plugins }) {
        plugins.push({
          name: '@modern-js/plugin-koa/server',
        });
        return { plugins };
      },
      addRuntimeExports(input) {
        const currentFile = bffExportsUtils.getPath();

        const relativeRuntimeModulePath = path.relative(
          path.dirname(currentFile),
          runtimeModulePath,
        );

        const relativeFramePath = path.relative(
          path.dirname(currentFile),
          require.resolve('koa'),
        );

        bffExportsUtils.addExport(`const pluginRuntime = require('${relativeRuntimeModulePath}');
           const Koa = require('${relativeFramePath}')
           module.exports = {
            Koa: Koa,
             ...pluginRuntime
           }
          `);
        return input;
      },
    };
  },
});

export default koaPlugin;
