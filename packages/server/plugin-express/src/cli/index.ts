import * as path from 'path';
import os from 'os';
import type { CliPlugin } from '@modern-js/core';
import { createRuntimeExportsUtils } from '@modern-js/utils';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-express',
  setup: api => {
    let bffExportsUtils: any;
    const { useAppContext } = api;
    const runtimeModulePath = path.resolve(__dirname, '../runtime');
    return {
      config() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const appContext = useAppContext();
        const { appDirectory } = appContext;
        bffExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'server',
        );

        const serverRuntimePath = bffExportsUtils.getPath();

        let relativeRuntimePath = '';
        if (os.platform() === 'win32') {
          relativeRuntimePath = path.normalize(
            path.join('../../', path.relative(appDirectory, serverRuntimePath)),
          );
        } else {
          // Look up one level, because the artifacts after build have dist directories
          relativeRuntimePath = path.normalize(
            path.join('../', path.relative(appDirectory, serverRuntimePath)),
          );
        }

        if (
          process.env.NODE_ENV === 'development' ||
          process.env.NODE_ENV === 'test'
        ) {
          relativeRuntimePath = path.normalize(
            `./${path.relative(appDirectory, serverRuntimePath)}`,
          );
        }

        return {
          source: {
            alias: {
              '@modern-js/runtime/server': relativeRuntimePath,
            },
          },
        };
      },
      addRuntimeExports(input) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { appDirectory } = useAppContext();
        const runtimePath = require.resolve(`@modern-js/runtime`, {
          paths: [appDirectory],
        });

        const currentFile = bffExportsUtils.getPath();

        const runtimeDir = path.dirname(runtimePath);

        const relativeBffPath = path.relative(
          path.dirname(currentFile),
          path.join(runtimeDir, './exports/server'),
        );
        const relativeRuntimeModulePath = path.relative(
          path.dirname(currentFile),
          runtimeModulePath,
        );

        const relativeFramePath = path.relative(
          path.dirname(currentFile),
          require.resolve('express'),
        );

        bffExportsUtils.addExport(`const bffRuntime = require('${relativeBffPath}');
           const pluginRuntime = require('${relativeRuntimeModulePath}');
           const express = require('${relativeFramePath}')
           module.exports = {
            express: express,
             ...bffRuntime,
             ...pluginRuntime
           }
          `);
        return input;
      },
    };
  },
});
