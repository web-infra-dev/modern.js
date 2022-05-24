import * as path from 'path';
import type { CliPlugin } from '@modern-js/core';
import { createRuntimeExportsUtils } from '@modern-js/utils';
import { getRelativeRuntimePath } from '@modern-js/adapter-helpers';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-nest',
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
              },
            },
          };
        } else {
          return {
            source: {
              alias: {
                '@modern-js/runtime/server': serverRuntimePath,
              },
            },
          };
        }
      },
      addRuntimeExports(input) {
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

        bffExportsUtils.addExport(
          `const bffRuntime = require('${relativeBffPath}');
           const pluginRuntime = require('${relativeRuntimeModulePath}');
           module.exports = {
             ...bffRuntime,
             ...pluginRuntime
           }
          `,
        );
        return input;
      },
    };
  },
});
