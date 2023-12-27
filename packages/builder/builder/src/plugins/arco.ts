import { isPackageInstalled } from '@modern-js/utils';
import { useSSR } from './antd';
import type { DefaultBuilderPlugin } from '@modern-js/builder-shared';
import { SourceConfig as WebpackSourceConfig } from '@modern-js/builder-webpack-provider';
import { SourceConfig as RspackSourceConfig } from '@modern-js/builder-rspack-provider';

export const builderPluginArco = (): DefaultBuilderPlugin => ({
  name: `builder-plugin-arco`,

  setup(api) {
    const ARCO_NAME = '@arco-design/web-react';
    const ARCO_ICON = `${ARCO_NAME}/icon`;

    api.modifyBuilderConfig(builderConfig => {
      const { transformImport = [] } = (builderConfig.source ||
        {}) as WebpackSourceConfig & RspackSourceConfig;

      if (
        transformImport === false ||
        !isPackageInstalled(ARCO_NAME, api.context.rootPath)
      ) {
        return;
      }

      const isUseSSR = useSSR(api.context.target);

      if (!transformImport?.some(item => item.libraryName === ARCO_NAME)) {
        transformImport.push({
          libraryName: ARCO_NAME,
          libraryDirectory: isUseSSR ? 'lib' : 'es',
          camelToDashComponentName: false,
          style: true,
        });
      }

      if (!transformImport?.some(item => item.libraryName === ARCO_ICON)) {
        transformImport.push({
          libraryName: ARCO_ICON,
          libraryDirectory: isUseSSR ? 'react-icon-cjs' : 'react-icon',
          camelToDashComponentName: false,
        });
      }

      builderConfig.source ||= {};
      (
        builderConfig.source as RspackSourceConfig & WebpackSourceConfig
      ).transformImport = transformImport;
    });
  },
});
