import * as path from 'path';
import type { AppTools } from '@modern-js/app-tools';
import type { CliPlugin } from '@modern-js/core';
import { createRuntimeExportsUtils } from '@modern-js/utils';

export const expressPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-express',
  setup: api => {
    let bffExportsUtils: any;
    const { useAppContext } = api;
    const runtimeModulePath = path.resolve(__dirname, '../runtime');

    const useConfig = api.useConfigContext();

    const appContext = api.useAppContext();

    api.setAppContext({
      ...appContext,
      bffRuntimeFramework: 'express',
    });

    return {
      config() {
        const appContext = useAppContext();
        bffExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'server',
        );

        const runtimePath =
          process.env.NODE_ENV === 'development' &&
          !useConfig?.bff?.crossProject
            ? require.resolve('@modern-js/plugin-express/runtime')
            : '@modern-js/plugin-express/runtime';

        return {
          source: {
            alias: {
              '@modern-js/runtime/server': runtimePath,
              '@modern-js/runtime/express': runtimePath,
            },
          },
        };
      },

      _internalServerPlugins({ plugins }) {
        plugins.push({
          name: '@modern-js/plugin-express/server',
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

export default expressPlugin;
