import * as path from 'path';
import { useAppContext, createPlugin } from '@modern-js/core';
import { createRuntimeExportsUtils } from '@modern-js/utils';

export default createPlugin(
  () => {
    let bffExportsUtils: any;
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

        // Look up one level, because the artifacts after build have dist directories
        let relativeRuntimePath = path.join(
          '../',
          path.relative(appDirectory, serverRuntimePath),
        );

        if (
          process.env.NODE_ENV === 'development' ||
          process.env.NODE_ENV === 'test'
        ) {
          relativeRuntimePath = `./${path.relative(
            appDirectory,
            serverRuntimePath,
          )}`;
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
  {
    name: '@modern-js/plugin-nest',
  },
) as any;
