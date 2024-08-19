import type { RsbuildPlugin } from '@rsbuild/core';
import { isPackageInstalled } from '@modern-js/utils';
import { isServerEnvironment } from '../utils';

export const pluginArco = (): RsbuildPlugin => ({
  name: 'uni-builder:arco',

  setup(api) {
    const ARCO_NAME = '@arco-design/web-react';
    const ARCO_ICON = `${ARCO_NAME}/icon`;

    api.modifyEnvironmentConfig((rsbuildConfig, { name }) => {
      const { transformImport = [] } = rsbuildConfig.source;

      if (
        transformImport === false ||
        !isPackageInstalled(ARCO_NAME, api.context.rootPath)
      ) {
        return;
      }

      const useServerEnvironment = isServerEnvironment(
        rsbuildConfig.output.target,
        name,
      );

      if (!transformImport?.some(item => item.libraryName === ARCO_NAME)) {
        transformImport.push({
          libraryName: ARCO_NAME,
          libraryDirectory: useServerEnvironment ? 'lib' : 'es',
          camelToDashComponentName: false,
          style: true,
        });
      }

      if (!transformImport?.some(item => item.libraryName === ARCO_ICON)) {
        transformImport.push({
          libraryName: ARCO_ICON,
          libraryDirectory: useServerEnvironment
            ? 'react-icon-cjs'
            : 'react-icon',
          camelToDashComponentName: false,
        });
      }

      rsbuildConfig.source.transformImport = transformImport;
    });
  },
});
