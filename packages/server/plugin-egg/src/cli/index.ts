import * as path from 'path';
import { useAppContext, createPlugin } from '@modern-js/core';
import { createRuntimeExportsUtils, fs } from '@modern-js/utils';

const PACKAGE_JSON = 'package.json';

export default createPlugin(
  () => {
    let bffExportsUtils: any;
    const runtimeModulePath = path.resolve(__dirname, '../runtime');

    return {
      config() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const appContext = useAppContext();
        bffExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'server',
        );

        return {
          source: {
            alias: { '@modern-js/runtime/server': bffExportsUtils.getPath() },
          },
        };
      },
      modifyEntryImports(input) {
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
      async afterBuild() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { appDirectory, distDirectory } = useAppContext();

        const pkgJson = path.join(appDirectory, PACKAGE_JSON);
        await fs.copyFile(pkgJson, path.join(distDirectory, PACKAGE_JSON));
      },
    };
  },
  { name: '@modern-js/plugin-egg' },
);
