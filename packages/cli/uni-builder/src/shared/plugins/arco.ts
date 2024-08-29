import { isPackageInstalled } from '@modern-js/utils';
import type { RsbuildPlugin, SourceConfig } from '@rsbuild/core';
import { isServerEnvironment } from '../utils';

export const pluginArco = (
  imports?: SourceConfig['transformImport'] | false,
): RsbuildPlugin => ({
  name: 'uni-builder:arco',

  setup(api) {
    const ARCO_NAME = '@arco-design/web-react';
    const ARCO_ICON = `${ARCO_NAME}/icon`;

    api.modifyEnvironmentConfig(
      (rsbuildConfig, { name, mergeEnvironmentConfig }) => {
        if (
          imports === false ||
          !isPackageInstalled(ARCO_NAME, api.context.rootPath)
        ) {
          return;
        }

        const defaultImports = [];

        const useServerEnvironment = isServerEnvironment(
          rsbuildConfig.output.target,
          name,
        );

        if (
          typeof imports === 'function' ||
          !imports?.some(
            item => typeof item === 'object' && item.libraryName === ARCO_NAME,
          )
        ) {
          defaultImports.push({
            libraryName: ARCO_NAME,
            libraryDirectory: useServerEnvironment ? 'lib' : 'es',
            camelToDashComponentName: false,
            style: true,
          });
        }

        if (
          typeof imports === 'function' ||
          !imports?.some(
            item => typeof item === 'object' && item.libraryName === ARCO_ICON,
          )
        ) {
          defaultImports.push({
            libraryName: ARCO_ICON,
            libraryDirectory: useServerEnvironment
              ? 'react-icon-cjs'
              : 'react-icon',
            camelToDashComponentName: false,
          });
        }

        return defaultImports.length
          ? mergeEnvironmentConfig(
              {
                source: {
                  transformImport: defaultImports,
                },
              },
              rsbuildConfig,
            )
          : rsbuildConfig;
      },
    );
  },
});
