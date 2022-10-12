import * as path from 'path';
import type { CliPlugin } from '@modern-js/core';
import { createRuntimeExportsUtils } from '@modern-js/utils';
import { getRelativeRuntimePath } from '@modern-js/bff-core';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-koa',
  setup: api => {
    let bffExportsUtils: any;
    const { useAppContext } = api;
    const runtimeModulePath = path.resolve(__dirname, '../runtime');
    return {
      config() {
        const appContext = useAppContext();
        const { appDirectory } = appContext;
        bffExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'server',
        );

        const serverRuntimePath = bffExportsUtils.getPath();

        const relativeRuntimePath = getRelativeRuntimePath(
          appDirectory,
          serverRuntimePath,
        );

        if (process.env.NODE_ENV === 'production') {
          return {
            source: {
              alias: {
                '@modern-js/runtime/server': relativeRuntimePath,
                '@modern-js/runtime/koa': relativeRuntimePath,
              },
            },
          };
        } else {
          return {
            source: {
              alias: {
                '@modern-js/runtime/server': serverRuntimePath,
                '@modern-js/runtime/koa': serverRuntimePath,
              },
            },
          };
        }
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
