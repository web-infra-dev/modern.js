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
  { name: '@modern-js/plugin-express' },
);
