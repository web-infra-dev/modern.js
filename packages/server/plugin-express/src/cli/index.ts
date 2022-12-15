import * as path from 'path';
import type { CliPlugin } from '@modern-js/core';
import { createRuntimeExportsUtils } from '@modern-js/utils';
import { getRelativeRuntimePath } from '@modern-js/bff-core';
import type { AppTools } from '@modern-js/app-tools';
import { SERVER_PLUGIN_EXPRESS } from '@modern-js/utils/constants';

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-express',
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
                '@modern-js/runtime/express': relativeRuntimePath,
              },
            },
          };
        } else {
          return {
            source: {
              alias: {
                '@modern-js/runtime/server': serverRuntimePath,
                '@modern-js/runtime/express': serverRuntimePath,
              },
            },
          };
        }
      },

      collectServerPlugins({ plugins }) {
        plugins.push(SERVER_PLUGIN_EXPRESS);
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
          require.resolve('express'),
        );

        bffExportsUtils.addExport(`const pluginRuntime = require('${relativeRuntimeModulePath}');
           const express = require('${relativeFramePath}')
           module.exports = {
            express: express,
             ...pluginRuntime
           }
          `);
        return input;
      },
    };
  },
});
