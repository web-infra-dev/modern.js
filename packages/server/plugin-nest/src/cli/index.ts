import * as path from 'path';
import type { CliPlugin } from '@modern-js/core';
import { createRuntimeExportsUtils } from '@modern-js/utils';
import { getRelativeRuntimePath } from '@modern-js/bff-core';
import type { AppTools } from '@modern-js/app-tools';

export default (): CliPlugin<AppTools> => ({
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
      collectServerPlugins({ plugins }) {
        plugins.push({
          '@modern-js/plugin-nest': '@modern-js/plugin-nest/server',
        });
        return { plugins };
      },
      addRuntimeExports(input) {
        const currentFile = bffExportsUtils.getPath();

        const relativeRuntimeModulePath = path.relative(
          path.dirname(currentFile),
          runtimeModulePath,
        );

        bffExportsUtils.addExport(
          `const pluginRuntime = require('${relativeRuntimeModulePath}');
           module.exports = {
             ...pluginRuntime
           }
          `,
        );
        return input;
      },
    };
  },
});
