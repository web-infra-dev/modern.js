import * as path from 'path';
import type { CliPlugin } from '@modern-js/core';
import { createRuntimeExportsUtils, fs } from '@modern-js/utils';
import { getRelativeRuntimePath } from '@modern-js/bff-core';
import type { AppTools } from '@modern-js/app-tools';
import { SERVER_PLUGIN_EGG } from '@modern-js/utils/constants';

const PACKAGE_JSON = 'package.json';

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-egg',
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

      collectServerPlugins({ plugins }) {
        plugins.push(SERVER_PLUGIN_EGG);
        return { plugins };
      },

      async afterBuild() {
        const { appDirectory, distDirectory } = useAppContext();

        const pkgJson = path.join(appDirectory, PACKAGE_JSON);
        await fs.copyFile(pkgJson, path.join(distDirectory, PACKAGE_JSON));
      },
    };
  },
});
